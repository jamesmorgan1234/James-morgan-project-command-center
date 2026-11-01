export interface BackoffRetryPolicy {
    readonly maxAttempts: number;
    readonly baseDelayMs: number;
    readonly multiplier: number;
    readonly maxDelayMs: number;
}
export declare function deterministicRetryDelay(policy: BackoffRetryPolicy, attempt: number): number;
export declare class PessimisticLockTable {
    #private;
    acquire(resource: string, token: string): void;
    release(resource: string, token: string): void;
}
export declare function assertOptimisticVersion(actualVersion: number, expectedVersion: number, nextVersion: number): void;
export declare class BackpressureError extends Error {
    readonly capacity: number;
    constructor(capacity: number);
}
export declare class BoundedWorkQueue<T> {
    #private;
    readonly capacity: number;
    constructor(capacity: number);
    enqueue(item: T): void;
    dequeue(): T | undefined;
    get size(): number;
}
export type ServiceHealth = "healthy" | "degraded" | "unavailable";
export interface DegradationDecision<T> {
    readonly health: ServiceHealth;
    readonly value?: T;
    readonly reason?: string;
}
export declare function gracefulDegradation<T>(primary: () => T, fallback: () => T, unavailableReason: string): DegradationDecision<T>;
export interface TransactionStep<TContext> {
    readonly name: string;
    readonly execute: (context: TContext) => void | Promise<void>;
    readonly compensate: (context: TContext) => void | Promise<void>;
}
export declare class CompensatingTransaction<TContext> {
    #private;
    constructor(steps: readonly TransactionStep<TContext>[]);
    execute(context: TContext): Promise<readonly string[]>;
}
export interface CacheEntry<T> {
    readonly value: T;
    readonly sourceVersion: number;
    readonly cachedAt: string;
}
export declare class CoherentCache<T> {
    #private;
    set(key: string, entry: CacheEntry<T>): void;
    get(key: string, sourceVersion: number): T | undefined;
    invalidate(key: string): void;
}
export interface FeatureFlagRecord {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly safeToEnable: boolean;
}
export declare class SafeFeatureFlags {
    #private;
    register(record: FeatureFlagRecord): void;
    replace(record: FeatureFlagRecord, expectedVersion: number): void;
    enabled(key: string): boolean;
}
export interface DeprecationWindow {
    readonly announcedAt: string;
    readonly sunsetAt: string;
}
export declare function deprecationState(window: DeprecationWindow, now: string): "active" | "deprecated" | "retired";
export interface ObservabilityEvent {
    readonly traceId: string;
    readonly hook: string;
    readonly timestamp: string;
    readonly attributes: Readonly<Record<string, string | number | boolean>>;
}
export declare class ObservabilityHooks {
    #private;
    emit(event: ObservabilityEvent): ObservabilityEvent;
    byTrace(traceId: string): readonly ObservabilityEvent[];
}
