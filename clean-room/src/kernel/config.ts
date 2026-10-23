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
