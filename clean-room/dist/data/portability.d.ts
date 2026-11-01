import type { AssetSensitivity } from "./assets.js";
import type { ProviderRegistry } from "./providers.js";
export interface PortableRecord {
    readonly id: string;
    readonly entityType: string;
    readonly version: number;
    readonly contentHash: string;
    readonly sensitivity: AssetSensitivity;
    readonly provenanceRefs: readonly string[];
    readonly data: Readonly<Record<string, unknown>>;
}
export type ImportDisposition = "create" | "update" | "duplicate" | "conflict";
export interface ImportItemResult {
    readonly id: string;
    readonly disposition: ImportDisposition;
    readonly reason: string;
}
export interface ImportDryRun {
    readonly batchId: string;
    readonly results: readonly ImportItemResult[];
    readonly canApplyWithoutOverwrite: boolean;
}
export interface ExportManifest {
    readonly recordCount: number;
    readonly redactedCount: number;
    readonly records: readonly PortableRecord[];
}
export interface ExportScope {
    readonly ownerId: string;
    readonly projectId?: string;
}
export type RestrictedExportSensitivity = Exclude<AssetSensitivity, "internal">;
export interface RestrictedExportAuthorization {
    readonly authorized: true;
    readonly ownerDecisionRef: string;
    readonly scope: ExportScope;
    readonly encrypted: true;
    readonly encryptionKeyRef: string;
    readonly allowedSensitivities: readonly RestrictedExportSensitivity[];
}
export declare const RESTRICTED_DATA_EXPORT_SCOPE: "data:restricted:export";
export interface IntegrationExportAuthority {
    readonly providerKey: string;
    readonly providerVersion: number;
}
export interface ExportOptions {
    readonly scope: ExportScope;
    readonly authorization?: RestrictedExportAuthorization;
    readonly integration?: IntegrationExportAuthority;
}
export declare class PortabilityCenter {
    #private;
    constructor(providerRegistry?: ProviderRegistry);
    stageImport(batchId: string, incoming: readonly PortableRecord[], existing: readonly PortableRecord[]): ImportDryRun;
    export(records: readonly PortableRecord[], options?: ExportOptions): ExportManifest;
}
