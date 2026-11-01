export type CircuitBreakerScope = "project" | "portfolio";
export type CircuitBreakerState = "closed" | "open" | "half_open";
export interface CircuitBreakerConfig {
    readonly breakerId: string;
    readonly scope: CircuitBreakerScope;
    readonly scopeKey: string;
    readonly failureThreshold: number;
    readonly cooldownMs: number;
}
export interface CircuitBreakerSnapshot extends CircuitBreakerConfig {
    readonly state: CircuitBreakerState;
    readonly failureCount: number;
    readonly openedAt: string | null;
    readonly probeStartedAt: string | null;
    readonly version: number;
    readonly evidenceRefs: readonly string[];
}
export interface CircuitBreakerPermit {
    readonly allowed: boolean;
    readonly reason: "closed" | "cooldown" | "half_open_probe" | "probe_in_flight";
    readonly breaker: CircuitBreakerSnapshot;
}
export declare function createCircuitBreaker(config: CircuitBreakerConfig, evidenceRefs: readonly string[]): CircuitBreakerSnapshot;
export declare function requestCircuitBreakerPermit(snapshot: CircuitBreakerSnapshot, now: string, evidenceRefs: readonly string[]): CircuitBreakerPermit;
export declare function recordCircuitBreakerFailure(snapshot: CircuitBreakerSnapshot, now: string, evidenceRefs: readonly string[]): CircuitBreakerSnapshot;
export declare function recordCircuitBreakerSuccess(snapshot: CircuitBreakerSnapshot, now: string, evidenceRefs: readonly string[]): CircuitBreakerSnapshot;
export type DeadLetterState = "dead_letter" | "blocked" | "requeued" | "resolved";
export type DeadLetterFailureClass = "retry_exhausted" | "permanent_failure" | "blocked";
export interface DeadLetterTransition {
    readonly from: DeadLetterState;
    readonly to: DeadLetterState;
    readonly reason: string;
    readonly occurredAt: string;
    readonly evidenceRefs: readonly string[];
}
export interface DeadLetterRecord {
    readonly deadLetterId: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly runId: string;
    readonly taskId: string;
    readonly state: DeadLetterState;
    readonly failureClass: DeadLetterFailureClass;
    readonly attemptCount: number;
    readonly reason: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: number;
    readonly evidenceRefs: readonly string[];
    readonly transitions: readonly DeadLetterTransition[];
    readonly taskCompletionAuthorized: false;
}
export interface DeadLetterScope {
    readonly ownerId: string;
    readonly projectId: string;
    readonly runId: string;
    readonly taskId: string;
}
export interface CreateDeadLetterInput extends DeadLetterScope {
    readonly deadLetterId: string;
    readonly disposition: "dead_letter" | "blocked";
    readonly failureClass: DeadLetterFailureClass;
    readonly attemptCount: number;
    readonly reason: string;
    readonly occurredAt: string;
    readonly evidenceRefs: readonly string[];
}
export declare function createDeadLetter(input: CreateDeadLetterInput): DeadLetterRecord;
export declare function manageDeadLetter(record: DeadLetterRecord, scope: DeadLetterScope, action: "requeue" | "resolve", reason: string, occurredAt: string, evidenceRefs: readonly string[]): DeadLetterRecord;
