export type AssetSensitivity = "internal" | "sensitive" | "protected" | "secret";
export type AssetOriginalState = "available" | "missing" | "reconstruction";
export type AssetApprovalState = "unreviewed" | "approved" | "locked";
export type AssetQaStatus = "passed" | "failed";
export interface AssetGenerationProvenance {
    readonly generatorRef?: string;
    readonly toolRef?: string;
    readonly providerRef?: string;
}
export interface AssetQaReceipt {
    readonly status: AssetQaStatus;
    readonly evidenceId: string;
}
export interface AssetMediaMetadata {
    readonly durationMs?: number;
    readonly widthPx?: number;
    readonly heightPx?: number;
}
export interface AssetArchiveManifestEntry {
    readonly path: string;
    readonly sha256?: string;
}
export interface AssetArchiveManifest {
    readonly entries: readonly AssetArchiveManifestEntry[];
}
export interface AssetRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly originRequirementId?: string;
    readonly originTaskId?: string;
    readonly generation?: AssetGenerationProvenance;
    readonly qa?: AssetQaReceipt;
    readonly mediaType?: string;
    readonly mediaMetadata?: AssetMediaMetadata;
    readonly archiveManifest?: AssetArchiveManifest;
    readonly name: string;
    readonly sha256?: string;
    readonly version: number;
    readonly sensitivity: AssetSensitivity;
    readonly originalState: AssetOriginalState;
    readonly approvalState: AssetApprovalState;
    readonly sourceRef: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface ProtectedAssetReplacementAuthorization {
    readonly ownerDecisionRef: string;
    readonly authorized: true;
}
export declare class AssetRegistry {
    #private;
    register(record: AssetRecord): void;
    replace(record: AssetRecord, expectedVersion: number, authorization?: ProtectedAssetReplacementAuthorization): void;
    get(id: string): AssetRecord | undefined;
    history(id: string): readonly AssetRecord[];
    listProject(projectId: string): readonly AssetRecord[];
    findDuplicatesBySha256(sha256: string): readonly AssetRecord[];
}
