import { inferBackendClassification, validateTrustedEnvironmentBinding } from "./trusted-environment.mjs";
export const CURRENT_RUNTIME_CONFIG_VERSION = 1;
export const CURRENT_RUNTIME_SCHEMA_VERSION = 1;
export const CURRENT_RUNTIME_API_VERSION = 1;
const ENVIRONMENT_NAMES = new Set(["development", "test", "preview", "staging", "production"]);
export const SUPPORTED_RUNTIME_SCHEMA_RANGE = Object.freeze({
    min: CURRENT_RUNTIME_SCHEMA_VERSION,
    max: CURRENT_RUNTIME_SCHEMA_VERSION
});
export const SUPPORTED_RUNTIME_API_RANGE = Object.freeze({
    min: CURRENT_RUNTIME_API_VERSION,
    max: CURRENT_RUNTIME_API_VERSION
});
function assertEnvironment(value, label) {
    if (typeof value !== "string" || !ENVIRONMENT_NAMES.has(value))
        throw new Error(`Invalid ${label}`);
}
function validateRange(label, range) {
    if (!range || !Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max) || range.min < 1 || range.max < range.min) {
        throw new Error(`Invalid ${label} range`);
    }
    return Object.freeze({ min: range.min, max: range.max });
}
function validateFeatureFlags(features) {
    if (!features || typeof features !== "object" || Array.isArray(features))
        throw new Error("features must be an object of boolean flags");
    const normalized = {};
    for (const [key, value] of Object.entries(features)) {
        if (!key.trim())
            throw new Error("Feature flag names must be nonblank");
        if (typeof value !== "boolean")
            throw new Error(`Feature flag ${key} must be boolean`);
        normalized[key] = value;
    }
    return Object.freeze(normalized);
}
function assertReleaseIdentity(releaseId, label) {
    if (typeof releaseId !== "string" || !releaseId.trim())
        throw new Error(`${label} is required`);
    if (/^__COMMAND_CENTER_[A-Z0-9_]+__$/.test(releaseId.trim()))
        throw new Error(`${label} contains an unresolved build placeholder`);
}
function assertSupportedRuntimeVersion(label, version, supported) {
    if (version < supported.min || version > supported.max) {
        throw new Error(`Unsupported ${label} ${version}; supported range is ${supported.min}-${supported.max}`);
    }
}
export function validateRuntimeConfig(config) {
    if (!config || typeof config !== "object")
        throw new Error("Runtime config is required");
    assertEnvironment(config.environment, "runtime environment");
    assertReleaseIdentity(config.releaseId, "releaseId");
    if (config.configVersion !== undefined && (!Number.isSafeInteger(config.configVersion) || config.configVersion < 1)) {
        throw new Error("configVersion must be a positive safe integer");
    }
    for (const [label, value] of [["schemaVersion", config.schemaVersion], ["apiVersion", config.apiVersion]]) {
        if (!Number.isSafeInteger(value) || value < 1)
            throw new Error(`${label} must be a positive safe integer`);
    }
    const compatibleSchema = validateRange("compatibleSchema", config.compatibleSchema);
    const compatibleApi = validateRange("compatibleApi", config.compatibleApi);
    if (config.schemaVersion < compatibleSchema.min || config.schemaVersion > compatibleSchema.max)
        throw new Error("Current schemaVersion is outside compatibleSchema range");
    if (config.apiVersion < compatibleApi.min || config.apiVersion > compatibleApi.max)
        throw new Error("Current apiVersion is outside compatibleApi range");
    const features = validateFeatureFlags(config.features);
    return Object.freeze({ ...config, releaseId: config.releaseId.trim(), compatibleSchema, compatibleApi, features });
}
export function validateVersionedRuntimeConfig(config) {
    const validated = validateRuntimeConfig(config);
    if (validated.configVersion === undefined)
        throw new Error("configVersion is required before startup execution");
    if (validated.configVersion !== CURRENT_RUNTIME_CONFIG_VERSION) {
        throw new Error(`Unsupported configVersion ${validated.configVersion}; expected ${CURRENT_RUNTIME_CONFIG_VERSION}`);
    }
    assertSupportedRuntimeVersion("schemaVersion", validated.schemaVersion, SUPPORTED_RUNTIME_SCHEMA_RANGE);
    assertSupportedRuntimeVersion("apiVersion", validated.apiVersion, SUPPORTED_RUNTIME_API_RANGE);
    return validated;
}
export function validateTrustedEnvironment(descriptor) {
    if (!descriptor || typeof descriptor !== "object")
        throw new Error("Trusted environment descriptor is required");
    assertEnvironment(descriptor.environment, "trusted environment");
    assertEnvironment(descriptor.backend?.environment, "backend environment");
    assertReleaseIdentity(descriptor.releaseId, "Trusted environment releaseId");
    if (typeof descriptor.configurationDigest !== "string" || !descriptor.configurationDigest.trim())
        throw new Error("Trusted environment configurationDigest is required");
    if (descriptor.backend.environment !== descriptor.environment)
        throw new Error("Frontend/backend environment mismatch blocked");
    const classification = descriptor.backend.classification ?? inferBackendClassification(descriptor.backend.projectRef);
    validateTrustedEnvironmentBinding({
        deploymentEnvironment: descriptor.environment,
        backendClassification: classification,
        providerKey: descriptor.backend.providerKey,
        projectRef: descriptor.backend.projectRef,
        baseUrl: descriptor.backend.baseUrl,
        authIssuer: descriptor.backend.authIssuer,
        authAudience: descriptor.backend.authAudience,
        configDigest: descriptor.configurationDigest
    });
    return Object.freeze({
        ...descriptor,
        releaseId: descriptor.releaseId.trim(),
        configurationDigest: descriptor.configurationDigest.trim(),
        backend: Object.freeze({ ...descriptor.backend, classification })
    });
}
export function validateRuntimeStartupContract(contract) {
    if (!contract || typeof contract !== "object")
        throw new Error("Runtime startup contract is required");
    const runtime = validateVersionedRuntimeConfig(contract.runtime);
    if (!contract.trustedEnvironment)
        return Object.freeze({ runtime });
    const trustedEnvironment = validateTrustedEnvironment(contract.trustedEnvironment);
    if (runtime.environment !== trustedEnvironment.environment)
        throw new Error("Runtime/trusted environment mismatch blocked");
    if (runtime.releaseId !== trustedEnvironment.releaseId)
        throw new Error("Runtime/trusted release identity mismatch blocked");
    return Object.freeze({ runtime, trustedEnvironment });
}
//# sourceMappingURL=config.js.map