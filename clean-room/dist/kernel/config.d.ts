export declare const CURRENT_RUNTIME_CONFIG_VERSION: 1;
export declare const CURRENT_RUNTIME_SCHEMA_VERSION: 1;
export declare const CURRENT_RUNTIME_API_VERSION: 1;
export type EnvironmentName = "development" | "test" | "preview" | "staging" | "production";
export type BackendClassification = "isolated" | "shared-nonproduction" | "protected-production";
export interface VersionRange {
    readonly min: number;
    readonly max: number;
}
export declare const SUPPORTED_RUNTIME_SCHEMA_RANGE: Readonly<VersionRange>;
export declare const SUPPORTED_RUNTIME_API_RANGE: Readonly<VersionRange>;
export interface RuntimeConfig {
    readonly configVersion?: number;
    readonly environment: EnvironmentName;
    readonly releaseId: string;
    readonly schemaVersion: number;
    readonly apiVersion: number;
    readonly compatibleSchema: VersionRange;
    readonly compatibleApi: VersionRange;
    readonly features: Readonly<Record<string, boolean>>;
}
export interface VersionedRuntimeConfig extends RuntimeConfig {
    readonly configVersion: typeof CURRENT_RUNTIME_CONFIG_VERSION;
}
export interface TrustedBackendBinding {
    readonly providerKey: string;
    readonly environment: EnvironmentName;
    readonly classification?: BackendClassification;
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
export interface RuntimeStartupContract {
    readonly runtime: RuntimeConfig;
    readonly trustedEnvironment?: TrustedEnvironmentDescriptor;
}
export interface ValidatedRuntimeStartupContract {
    readonly runtime: VersionedRuntimeConfig;
    readonly trustedEnvironment?: TrustedEnvironmentDescriptor;
}
export declare function validateRuntimeConfig(config: RuntimeConfig): RuntimeConfig;
export declare function validateVersionedRuntimeConfig(config: RuntimeConfig): VersionedRuntimeConfig;
export declare function validateTrustedEnvironment(descriptor: TrustedEnvironmentDescriptor): TrustedEnvironmentDescriptor;
export declare function validateRuntimeStartupContract(contract: RuntimeStartupContract): ValidatedRuntimeStartupContract;
