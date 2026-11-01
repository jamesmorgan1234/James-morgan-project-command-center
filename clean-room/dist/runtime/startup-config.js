import { validateRuntimeStartupContract } from "../kernel/config.js";
function meta(documentRef, name) {
    const value = documentRef.querySelector(`meta[name="${name}"]`)?.content.trim();
    return value || undefined;
}
function requiredMeta(documentRef, name) {
    const value = meta(documentRef, name);
    if (!value)
        throw new Error(`Missing startup configuration: ${name}`);
    return value;
}
function positiveInteger(value, label) {
    if (!/^\d+$/.test(value))
        throw new Error(`Invalid startup configuration: ${label}`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1)
        throw new Error(`Invalid startup configuration: ${label}`);
    return parsed;
}
function versionRange(value, label) {
    const match = /^(\d+)-(\d+)$/.exec(value);
    if (!match)
        throw new Error(`Invalid startup configuration: ${label}`);
    return Object.freeze({ min: positiveInteger(match[1], `${label}.min`), max: positiveInteger(match[2], `${label}.max`) });
}
function featureFlags(value) {
    if (!value)
        return Object.freeze({});
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch {
        throw new Error("Invalid startup configuration: command-center-features");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Invalid startup configuration: command-center-features");
    return parsed;
}
function projectRefFromSupabaseUrl(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
        throw new Error("Invalid startup configuration: command-center-supabase-url");
    }
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co"))
        throw new Error("Invalid startup configuration: command-center-supabase-url");
    const projectRef = url.hostname.slice(0, -".supabase.co".length).trim();
    if (!projectRef || projectRef.includes("."))
        throw new Error("Invalid startup configuration: command-center-supabase-url");
    return Object.freeze({ origin: url.origin, projectRef });
}
export function readBrowserStartupConfiguration(documentRef) {
    const runtime = {
        configVersion: positiveInteger(requiredMeta(documentRef, "command-center-config-version"), "command-center-config-version"),
        environment: requiredMeta(documentRef, "command-center-environment"),
        releaseId: requiredMeta(documentRef, "command-center-release"),
        schemaVersion: positiveInteger(requiredMeta(documentRef, "command-center-schema-version"), "command-center-schema-version"),
        apiVersion: positiveInteger(requiredMeta(documentRef, "command-center-api-version"), "command-center-api-version"),
        compatibleSchema: versionRange(requiredMeta(documentRef, "command-center-compatible-schema"), "command-center-compatible-schema"),
        compatibleApi: versionRange(requiredMeta(documentRef, "command-center-compatible-api"), "command-center-compatible-api"),
        features: featureFlags(meta(documentRef, "command-center-features"))
    };
    if (meta(documentRef, "command-center-runtime-endpoint"))
        return validateRuntimeStartupContract({ runtime });
    const supabaseUrl = meta(documentRef, "command-center-supabase-url");
    if (!supabaseUrl)
        return validateRuntimeStartupContract({ runtime });
    const backendEnvironment = requiredMeta(documentRef, "command-center-backend-environment");
    const backend = projectRefFromSupabaseUrl(supabaseUrl);
    const trustedEnvironment = {
        environment: backendEnvironment,
        releaseId: runtime.releaseId,
        configurationDigest: requiredMeta(documentRef, "command-center-config-digest"),
        backend: {
            providerKey: "supabase",
            environment: backendEnvironment,
            baseUrl: backend.origin,
            projectRef: backend.projectRef,
            authIssuer: `${backend.origin}/auth/v1`,
            authAudience: "authenticated"
        }
    };
    return validateRuntimeStartupContract({ runtime, trustedEnvironment });
}
export function assertBrowserStartupConfiguration(documentRef) {
    return readBrowserStartupConfiguration(documentRef);
}
//# sourceMappingURL=startup-config.js.map