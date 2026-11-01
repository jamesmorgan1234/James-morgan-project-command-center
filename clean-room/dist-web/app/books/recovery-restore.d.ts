export type RestoreConflictState = "none" | "requires_owner_resolution" | "resolved";
export interface BookRestoreManifest {
    readonly id: string;
    readonly ownerId: string;
    readonly exportManifestId: string;
    readonly schemaVersion: number;
    readonly compatibleSchemaVersions: readonly number[];
    readonly bookIds: readonly string[];
    readonly artifactIds: readonly string[];
    readonly publicationStateRefs: readonly string[];
    readonly approvalStateRefs: readonly string[];
    readonly protectedAssetIds: readonly string[];
    readonly supersededStateRefs: readonly string[];
    readonly revokedAuthorityRefs: readonly string[];
    readonly providerMigrationRefs: readonly string[];
    readonly historicalSourceRefs: readonly string[];
    readonly conflictState: RestoreConflictState;
    readonly conflictRefs: readonly string[];
    readonly restoredAt: string;
}
export declare function validateBookRestoreManifest(m: BookRestoreManifest, currentSchemaVersion: number): BookRestoreManifest;
export declare function assertRestoreDoesNotResurrectAuthority(m: BookRestoreManifest, candidateStateRefs: readonly string[], candidateAuthorityRefs: readonly string[]): void;
export declare function historicalRecoveryIsCurrentTruthByDefault(): false;
