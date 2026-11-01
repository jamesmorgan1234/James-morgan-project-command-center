/**
 * Task contracts and safety boundaries.
 *
 * Preconditions, postconditions, invariants, side-effect and external-call
 * budgets, duration limits, cancellation cadence, resumability and atomicity
 * classification, compensation, evidence strength, verification timeout and
 * manual-review fallback.
 */
export type TrustLevel = "untrusted" | "standard" | "trusted";
export declare function assertFallbackAllowed(fallbackTrust: TrustLevel, requiredTrust: TrustLevel, protectedAction: boolean): void;
export type CompensationStrategy = "none" | "rollback" | "manual";
export interface TaskContract {
    readonly preconditions: readonly string[];
    readonly postconditions: readonly string[];
    readonly invariants: readonly string[];
    readonly sideEffectBudget: number;
    readonly externalCallBudget: number;
    readonly maxDurationMs: number;
    readonly cancellationCheckEvery: number;
    readonly resumable: boolean;
    readonly atomic: boolean;
    readonly compensation: CompensationStrategy;
    readonly evidenceStrength: "attested" | "observed" | "verified";
    readonly verificationTimeoutMs: number;
    readonly manualReviewFallback: boolean;
}
export declare function defineTaskContract(contract: TaskContract): TaskContract;
export declare function assertContractSatisfied(contract: TaskContract, observed: {
    preconditions: readonly string[];
    postconditions: readonly string[];
    invariants: readonly string[];
}): void;
export declare class TaskBudgetRunner {
    #private;
    constructor(contract: TaskContract, startedAt: string);
    get sideEffects(): number;
    get externalCalls(): number;
    get cancellationChecks(): number;
    consumeSideEffect(): void;
    consumeExternalCall(): void;
    assertWithinDuration(now: string): void;
    shouldCheckCancellation(stepIndex: number): boolean;
}
export declare function classifyTask(contract: TaskContract): {
    readonly resumability: "resumable" | "not_resumable";
    readonly atomicity: "atomic" | "compensable";
};
export declare function compensationPlan(contract: TaskContract): readonly string[];
export declare function assertEvidenceStrength(required: TaskContract["evidenceStrength"], provided: TaskContract["evidenceStrength"]): void;
export declare function assertVerificationTimely(startedAtMs: number, nowMs: number, timeoutMs: number): void;
export declare function manualReviewFallback(contract: TaskContract, failure: string): {
    readonly action: "manual_review";
    readonly failure: string;
};
