export type CapabilityTruth = "verified_supported" | "verified_unsupported" | "unverified";
export interface EnumerationCapability {
    readonly enumerateAll: CapabilityTruth;
    readonly stableIds: CapabilityTruth;
    readonly updatedMetadata: CapabilityTruth;
    readonly revisionIds: CapabilityTruth;
    readonly contentHashes: CapabilityTruth;
    readonly deltaFetch: CapabilityTruth;
    readonly deletionDetection: CapabilityTruth;
    readonly stablePagination: CapabilityTruth;
}
export interface SourceFingerprint {
    readonly stableId: string;
    readonly updatedAt?: string;
    readonly revisionId?: string;
    readonly contentHash?: string;
    readonly messageCount?: number;
    readonly byteSize?: number;
    readonly title?: string;
}
export type RefreshClassification = "changed" | "unchanged" | "uncertain";
export declare function classifyRefresh(previous: SourceFingerprint | undefined, next: SourceFingerprint): RefreshClassification;
export interface EnumerationPage {
    readonly cursor?: string;
    readonly nextCursor?: string;
    readonly stableIds: readonly string[];
    readonly consistencyToken?: string;
}
export type EnumerationStabilityReason = "stable_complete" | "no_pages" | "pagination_stability_unverified" | "cursor_chain_changed" | "cursor_loop" | "duplicate_source_during_enumeration" | "enumeration_changed_during_pagination" | "enumeration_fingerprint_changed" | "not_terminal";
export interface EnumerationStabilityResult {
    readonly complete: boolean;
    readonly restartRequired: boolean;
    readonly reason: EnumerationStabilityReason;
    readonly enumeratedCount: number;
}
export declare function evaluateEnumerationStability(input: {
    readonly stablePagination: CapabilityTruth;
    readonly pages: readonly EnumerationPage[];
    readonly startFingerprint?: string;
    readonly endFingerprint?: string;
}): EnumerationStabilityResult;
export interface RefreshLease {
    readonly sourceId: string;
    readonly holderId: string;
    readonly generation: number;
    readonly acquiredAt: string;
    readonly expiresAt: string;
}
export declare class RefreshLeaseManager {
    #private;
    acquire(sourceId: string, holderId: string, acquiredAt: string, expiresAt: string): RefreshLease;
    assertCommit(sourceId: string, holderId: string, generation: number, now: string): void;
}
export interface RefreshCheckpoint {
    readonly sourceId: string;
    readonly generation: number;
    readonly checkpointRef: string;
    readonly classification: RefreshClassification;
    readonly successful: boolean;
    readonly checkedAt: string;
}
export type DerivedInvalidationState = "deleted" | "restricted";
export interface DerivedInvalidationExpectation {
    readonly derivedId: string;
    readonly observationId: string;
    readonly resultingState: DerivedInvalidationState;
}
export interface DerivedProjectionAcknowledgement extends DerivedInvalidationExpectation {
    readonly sourceId: string;
    readonly generation: number;
    readonly acknowledgedAt: string;
    readonly evidenceRefs: readonly string[];
}
export type RefreshRecoveryAction = "restart_source" | "awaiting_derived_expectation_snapshot" | "awaiting_derived_acknowledgements" | "complete" | "resume_from_checkpoint";
export interface RefreshRecoveryDecision {
    readonly sourceId: string;
    readonly requestedGeneration: number;
    readonly checkpointGeneration?: number;
    readonly checkpointRef?: string;
    readonly action: RefreshRecoveryAction;
    readonly reason: string;
    readonly pendingDerivedIds: readonly string[];
}
/**
 * In-memory contract for the durable A07.6 refresh seam. A committed source checkpoint is
 * not enough to call a changed source recovered: its dependent-invalidations snapshot must
 * first exist, and every expected dependent derived projection must then acknowledge its
 * resulting deleted/restricted state with evidence. A newer worker generation may resume
 * only after that closure, so replacement cannot silently bypass derivative invalidation.
 */
export declare class RefreshRecoveryCoordinator {
    #private;
    recordCheckpoint(checkpoint: RefreshCheckpoint): RefreshCheckpoint;
    expectDerivedInvalidations(sourceId: string, generation: number, expectations: readonly DerivedInvalidationExpectation[]): readonly DerivedInvalidationExpectation[];
    acknowledge(acknowledgement: DerivedProjectionAcknowledgement): DerivedProjectionAcknowledgement;
    evaluate(sourceId: string, requestedGeneration: number): RefreshRecoveryDecision;
}
export type InventoryItemState = "readable" | "unreadable" | "tombstone";
export interface InventoryItem {
    readonly stableId: string;
    readonly state: InventoryItemState;
    readonly reason?: string;
}
export interface RefreshCoverage {
    readonly enumerationComplete: boolean;
    readonly expectedCount?: number;
    readonly items: readonly InventoryItem[];
}
export declare function evaluateCoverage(coverage: RefreshCoverage): Readonly<{
    complete: boolean;
    readable: number;
    unreadable: number;
    tombstones: number;
    unaccounted: number;
}>;
export interface RefreshCandidate {
    readonly stableId: string;
    readonly classification: RefreshClassification;
    readonly updatedAt?: string;
    readonly lastCheckedAt?: string;
}
export declare function fairRefreshOrder(candidates: readonly RefreshCandidate[], oldItemEvery?: number): readonly RefreshCandidate[];
