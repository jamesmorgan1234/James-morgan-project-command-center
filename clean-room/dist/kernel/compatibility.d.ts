export interface ApiVersionRange {
    readonly min: number;
    readonly max: number;
}
export interface ApiSemanticVersion {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
}
export interface ApiDeprecationNotice {
    readonly apiVersion: number;
    readonly deprecatedSince: ApiSemanticVersion;
    readonly sunsetAfter: string;
    readonly replacement: string;
    readonly warning: string;
}
export interface CompatibilityHello {
    readonly apiVersion: number;
    readonly schemaVersion: number;
    readonly capabilities: readonly string[];
    readonly acceptsUnknownFields: boolean;
}
export interface ServerCompatibilityHello extends CompatibilityHello {
    readonly supportedClientApi: ApiVersionRange;
}
export interface CompatibilityNegotiation {
    readonly accepted: boolean;
    readonly negotiatedApiVersion: number | null;
    readonly negotiatedSchemaVersion: number | null;
    readonly sharedCapabilities: readonly string[];
    readonly unsupportedClientCapabilities: readonly string[];
    readonly reason: string | null;
}
export interface ParsedCompatibilityEnvelope {
    readonly apiVersion: number;
    readonly schemaVersion: number;
    readonly capabilities: readonly string[];
    readonly acceptsUnknownFields: boolean;
    readonly unknownFields: readonly string[];
}
export interface ApiContractSnapshot {
    readonly version: ApiSemanticVersion;
    readonly capabilities: readonly string[];
    readonly deprecatedCapabilities: readonly string[];
}
export type ApiChangeLevel = "patch" | "minor" | "major";
export interface ApiChangeImpactReport {
    readonly level: ApiChangeLevel;
    readonly previousVersion: string;
    readonly nextVersion: string;
    readonly addedCapabilities: readonly string[];
    readonly removedCapabilities: readonly string[];
    readonly newlyDeprecatedCapabilities: readonly string[];
    readonly breaking: boolean;
    readonly summary: string;
}
export interface ApiChangelogEntry {
    readonly version: ApiSemanticVersion;
    readonly level: ApiChangeLevel;
    readonly summary: string;
    readonly deprecatedCapabilities: readonly string[];
}
export declare function validateApiSemanticVersion(version: ApiSemanticVersion): ApiSemanticVersion;
export declare function formatApiSemanticVersion(version: ApiSemanticVersion): string;
export declare function classifyApiVersionChange(previous: ApiSemanticVersion, next: ApiSemanticVersion): ApiChangeLevel;
export declare function buildApiDeprecationMetadata(notice: ApiDeprecationNotice): Readonly<Record<string, string>>;
export declare function negotiateCompatibility(clientInput: CompatibilityHello, serverInput: ServerCompatibilityHello): CompatibilityNegotiation;
export declare function negotiateClientCapabilities(client: CompatibilityHello, server: ServerCompatibilityHello): CompatibilityNegotiation;
export declare function negotiateServerCapabilities(server: ServerCompatibilityHello, client: CompatibilityHello): CompatibilityNegotiation;
export declare function resolveUnsupportedFeature(feature: string, negotiation: CompatibilityNegotiation): Readonly<{
    supported: boolean;
    reason: string | null;
}>;
export declare function assertBackendClientCompatibility(negotiation: CompatibilityNegotiation): void;
export declare function readCompatibilityEnvelope(input: unknown): ParsedCompatibilityEnvelope;
export declare function writeCompatibilityEnvelope(input: CompatibilityHello & Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
export declare function assessApiChange(previousInput: ApiContractSnapshot, nextInput: ApiContractSnapshot): ApiChangeImpactReport;
export declare function validateApiChangelog(entries: readonly ApiChangelogEntry[]): readonly ApiChangelogEntry[];
