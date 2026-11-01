/**
 * Side-effect discipline and failure policy.
 *
 * Fresh lock/stop checks before a side effect, reservation, post-effect
 * verification, checkpoints, recorded task outcomes, retry fingerprints,
 * systemic failure grouping, circuit breaking and quarantine.
 */
export interface SideEffectGate {
    readonly projectLockToken: string | null;
    readonly expectedProjectLockToken: string;
    readonly stopOrPauseRequested: boolean;
}
export declare function assertSideEffectAllowed(gate: SideEffectGate): void;
export declare function reserveSideEffect(key: string, reserved: Set<string>): void;
export declare function verifySideEffect(observed: string | null, expected: string): string;
export interface Checkpoint {
    readonly taskKey: string;
    readonly stateVersion: number;
    readonly createdAt: string;
}
export declare function writeCheckpoint(state: {
    taskKey: string;
    stable: boolean;
    stateVersion: number;
}, createdAt: string): Checkpoint;
export declare function selectNextTask(ready: readonly string[], checkpoint: Checkpoint | null): string;
export declare function assertAdvanceable(evidence: {
    readonly ambiguous: boolean;
}): void;
export type SkipPolicy = "explicit_allow" | "forbid";
export declare function assertSkipAllowed(policy: SkipPolicy): void;
export type TaskOutcome = "skipped" | "excluded" | "blocked" | "failed" | "reopened";
export interface TaskOutcomeRecord {
    readonly taskKey: string;
    readonly outcome: TaskOutcome;
    readonly reason: string;
}
export declare function recordTaskOutcome(taskKey: string, outcome: TaskOutcome, reason: string): TaskOutcomeRecord;
export type RetryKind = "task" | "run" | "provider";
export declare function retryFingerprint(kind: RetryKind, parts: readonly string[]): string;
export interface SystemicFailureGroup {
    readonly fingerprint: string;
    readonly occurrences: number;
}
export declare function groupSystemicFailures(fingerprints: readonly string[], minimumOccurrences?: number): readonly SystemicFailureGroup[];
export declare class CircuitBreaker {
    #private;
    constructor(threshold: number, cooldownMs: number);
    get failures(): number;
    get open(): boolean;
    recordFailure(now: Date): void;
    canProceed(now: Date): boolean;
    recordSuccess(): void;
    manualReset(): void;
}
export declare class QuarantineRegistry {
    #private;
    recordFailure(key: string, threshold: number): boolean;
    isQuarantined(key: string): boolean;
    assertAvailable(key: string): void;
    clear(key: string): void;
}
