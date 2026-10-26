import { validateTrustedEnvironmentBinding } from "./trusted-environment.mjs";

export type EnvironmentName = "development" | "test" | "preview" | "staging" | "production";
export type BackendClassification = "isolated" | "shared-nonproduction" | "protected-production";

export interface VersionRange { readonly min: number; readonly max: number; }
export interface RuntimeConfig {
  readonly environment: EnvironmentName;
  readonly releaseId: string;
  readonly schemaVersion: number;
  readonly apiVersion: number;
  readonly compatibleSchema: VersionRange;
  readonly compatibleApi: VersionRange;
  readonly features: Readonly<Record<string, boolean>>;
}

export interface TrustedBackendBinding {
  readonly providerKey: string;
  readonly environment: EnvironmentName;
  readonly classification: BackendClassification;
  readonly baseUrl: string;
  readonly projectRef: string;
  readonly authIssuer: string;
  readonly authAudience: string;
}

export interface TrustedEnvironmentDescriptor {
  readonly environment: EnvironmentName;
  readonly releaseId: string;
  readonly configurationDigest: string;
  readonly backend: TrustedBackendBinding;
}

export function validateRuntimeConfig(config: RuntimeConfig): RuntimeConfig {
  if (!config.releaseId.trim()) throw new Error("releaseId is required");
  for (const [label, value] of [["schemaVersion", config.schemaVersion], ["apiVersion", config.apiVersion]] as const) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
  }
  for (const [label, range] of [["compatibleSchema", config.compatibleSchema], ["compatibleApi", config.compatibleApi]] as const) {
    if (range.min < 1 || range.max < range.min) throw new Error(`Invalid ${label} range`);
  }
  if (config.schemaVersion < config.compatibleSchema.min || config.schemaVersion > config.compatibleSchema.max) throw new Error("Current schemaVersion is outside compatibleSchema range");
  if (config.apiVersion < config.compatibleApi.min || config.apiVersion > config.compatibleApi.max) throw new Error("Current apiVersion is outside compatibleApi range");
  return Object.freeze({ ...config, features: Object.freeze({ ...config.features }) });
}

export function validateTrustedEnvironment(descriptor: TrustedEnvironmentDescriptor): TrustedEnvironmentDescriptor {
  if (!descriptor.releaseId.trim() || !descriptor.configurationDigest.trim()) throw new Error("Trusted environment releaseId/configurationDigest are required");
  if (descriptor.backend.environment !== descriptor.environment) throw new Error("Frontend/backend environment mismatch blocked");
  validateTrustedEnvironmentBinding({
    deploymentEnvironment: descriptor.environment,
    backendClassification: descriptor.backend.classification,
    providerKey: descriptor.backend.providerKey,
    projectRef: descriptor.backend.projectRef,
    baseUrl: descriptor.backend.baseUrl,
    authIssuer: descriptor.backend.authIssuer,
    authAudience: descriptor.backend.authAudience,
    configDigest: descriptor.configurationDigest
  });
  return Object.freeze({ ...descriptor, backend: Object.freeze({ ...descriptor.backend }) });
}
