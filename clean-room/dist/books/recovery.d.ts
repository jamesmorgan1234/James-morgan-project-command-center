export interface RecoveredBookCandidate {
    readonly bookId: string;
    readonly projectId: string;
    readonly canonicalTitle: string;
    readonly sourceRefs: readonly string[];
    readonly artifactRefs: readonly string[];
    readonly missingArtifactKinds: readonly string[];
    readonly status: "active" | "dormant" | "archived";
}
export declare function validateBookRecovery(candidates: readonly RecoveredBookCandidate[]): Readonly<{
    total: number;
    unresolved: number;
}>;
export type BookRecoveryStatus = "active" | "dormant" | "archived";
export type BookArtifactRecoveryState = "present" | "missing" | "recovered_original" | "reconstructed";
export interface EvidenceBackedRecoveredBook {
    readonly bookId: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly canonicalTitle: string;
    readonly aliases: readonly string[];
    readonly seriesRootId?: string | undefined;
    readonly seriesSequence?: number | undefined;
    readonly status: BookRecoveryStatus;
    readonly sourceRefs: readonly string[];
    readonly artifactRefs: readonly string[];
    readonly missingArtifactKinds: readonly string[];
    readonly continuityRefs: readonly string[];
    readonly recoveredAt: string;
}
export interface RecoveredBookArtifact {
    readonly id: string;
    readonly ownerId: string;
    readonly bookId: string;
    readonly kind: string;
    readonly state: BookArtifactRecoveryState;
    readonly artifactRef?: string | undefined;
    readonly contentHash?: string | undefined;
    readonly sourceRefs: readonly string[];
    readonly reconstructionRefs: readonly string[];
    readonly observedAt: string;
}
export interface BookArchiveTransition {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly from: BookRecoveryStatus;
    readonly to: BookRecoveryStatus;
    readonly ownerActionRef: string;
    readonly observedAt: string;
}
export interface BookExportManifest {
    readonly id: string;
    readonly ownerId: string;
    readonly projectIds: readonly string[];
    readonly bookIds: readonly string[];
    readonly artifactIds: readonly string[];
    readonly providerKeys: readonly string[];
    readonly manifestHash: string;
    readonly sourceRefs: readonly string[];
    readonly createdAt: string;
}
export interface BookProviderMigrationRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly fromProviderKey: string;
    readonly toProviderKey: string;
    readonly state: "planned" | "exported" | "imported" | "verified" | "blocked";
    readonly exportManifestId: string;
    readonly evidenceRefs: readonly string[];
    readonly observedAt: string;
}
export declare class BookRecoveryCatalog {
    #private;
    registerBook(book: EvidenceBackedRecoveredBook): EvidenceBackedRecoveredBook;
    registerArtifact(artifact: RecoveredBookArtifact): RecoveredBookArtifact;
    transitionStatus(transition: BookArchiveTransition): EvidenceBackedRecoveredBook;
    search(ownerId: string, query: string, limit?: number): readonly EvidenceBackedRecoveredBook[];
    validateSeriesContinuity(ownerId: string, seriesRootId: string): Readonly<{
        pass: boolean;
        orderedBookIds: readonly string[];
        missingSequences: readonly number[];
        continuityComplete: boolean;
    }>;
    unresolved(ownerId: string): readonly EvidenceBackedRecoveredBook[];
    list(ownerId: string): readonly EvidenceBackedRecoveredBook[];
}
export declare function validateBookExportManifest(manifest: BookExportManifest): BookExportManifest;
export declare function validateBookProviderMigration(record: BookProviderMigrationRecord, manifests: readonly BookExportManifest[]): BookProviderMigrationRecord;
