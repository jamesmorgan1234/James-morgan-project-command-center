export type SyncCompleteness = "unknown" | "partial" | "complete";
export type SyncTrust = "unrated" | "low" | "medium" | "high" | "authoritative";
export type SyncReachability = "unknown" | "reachable" | "degraded" | "unreachable";
export interface SyncReliability {
    readonly successRate?: number;
    readonly sampleSize?: number;
    readonly lastFailureAt?: string;
}
export interface SyncEnvelope<T> {
    readonly entityId: string;
    readonly version: number;
    readonly updatedAt: string;
    readonly contentHash: string;
    readonly sourceNode: string;
    readonly payload: Readonly<T>;
    readonly freshUntil?: string;
    readonly completeness?: SyncCompleteness;
    readonly trust?: SyncTrust;
    readonly reachability?: SyncReachability;
    readonly reliability?: SyncReliability;
    readonly obligationRefs?: readonly string[];
    readonly revalidationTriggers?: readonly string[];
}
export type SyncAction = "accept" | "ignore_duplicate" | "reject_stale" | "conflict" | "reconcile_gap";
export interface SyncDecision<T> {
    readonly action: SyncAction;
    readonly reason: string;
    readonly chosen?: SyncEnvelope<T>;
}
export declare function reconcileSync<T>(local: SyncEnvelope<T> | undefined, incoming: SyncEnvelope<T>): SyncDecision<T>;
export interface ReconciliationConflict<T> {
    readonly id: string;
    readonly local: SyncEnvelope<T>;
    readonly incoming: SyncEnvelope<T>;
    readonly createdAt: string;
    readonly resolved: boolean;
    readonly obligationRefs?: readonly string[];
    readonly revalidationTriggers?: readonly string[];
}
export declare class ReconciliationQueue<T> {
    #private;
    add(conflict: ReconciliationConflict<T>): void;
    resolve(id: string): ReconciliationConflict<T>;
    pending(): readonly ReconciliationConflict<T>[];
}
