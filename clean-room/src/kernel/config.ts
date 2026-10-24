export type EnvironmentName = "development" | "test" | "staging" | "production";

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
  if (!descriptor.backend.providerKey.trim() || !descriptor.backend.projectRef.trim() || !descriptor.backend.authAudience.trim()) throw new Error("Trusted backend provider/project/audience are required");
  let baseUrl: URL;
  let issuer: URL;
  try { baseUrl = new URL(descriptor.backend.baseUrl); issuer = new URL(descriptor.backend.authIssuer); }
  catch { throw new Error("Trusted backend URL/issuer must be valid URLs"); }
  if (baseUrl.protocol !== "https:" || issuer.protocol !== "https:") throw new Error("Trusted backend URL/issuer must use HTTPS");
  if (baseUrl.origin !== issuer.origin) throw new Error("Auth issuer must belong to the trusted backend origin");
  return Object.freeze({ ...descriptor, backend: Object.freeze({ ...descriptor.backend }) });
}
