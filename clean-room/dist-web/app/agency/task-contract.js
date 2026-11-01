/**
 * Task contracts and safety boundaries.
 *
 * Preconditions, postconditions, invariants, side-effect and external-call
 * budgets, duration limits, cancellation cadence, resumability and atomicity
 * classification, compensation, evidence strength, verification timeout and
 * manual-review fallback.
 */
const TRUST_RANK = Object.freeze({ untrusted: 0, standard: 1, trusted: 2 });
export function assertFallbackAllowed(fallbackTrust, requiredTrust, protectedAction) {
    if (!protectedAction)
        return;
    if (TRUST_RANK[fallbackTrust] < TRUST_RANK[requiredTrust])
        throw new Error("A protected action cannot fall back to a lower-trust executor");
}
export function defineTaskContract(contract) {
    if (contract.preconditions.length === 0)
        throw new Error("A task contract requires at least one precondition");
    if (contract.postconditions.length === 0)
        throw new Error("A task contract requires at least one postcondition");
    if (contract.invariants.length === 0)
        throw new Error("A task contract requires at least one invariant");
    for (const [label, value] of Object.entries({
        sideEffectBudget: contract.sideEffectBudget,
        externalCallBudget: contract.externalCallBudget,
        maxDurationMs: contract.maxDurationMs,
        cancellationCheckEvery: contract.cancellationCheckEvery,
        verificationTimeoutMs: contract.verificationTimeoutMs
    })) {
        if (!Number.isSafeInteger(value) || value < 1)
            throw new Error(`Task contract requires a positive integer ${label}`);
    }
    if (contract.atomic && contract.compensation === "none" && contract.postconditions.length > 1)
        throw new Error("A multi-step atomic task requires a compensation strategy");
    return Object.freeze({
        ...contract,
        preconditions: Object.freeze([...contract.preconditions]),
        postconditions: Object.freeze([...contract.postconditions]),
        invariants: Object.freeze([...contract.invariants])
    });
}
export function assertContractSatisfied(contract, observed) {
    for (const check of ["preconditions", "postconditions", "invariants"]) {
        const missing = contract[check].filter((item) => !observed[check].includes(item));
        if (missing.length > 0)
            throw new Error(`Task ${check} not satisfied: ${missing.join(", ")}`);
    }
}
export class TaskBudgetRunner {
    #contract;
    #startedAtMs;
    #sideEffects = 0;
    #externalCalls = 0;
    #cancellationChecks = 0;
    constructor(contract, startedAt) {
        this.#contract = contract;
        this.#startedAtMs = Date.parse(startedAt);
        if (Number.isNaN(this.#startedAtMs))
            throw new Error("Task start time must be a valid timestamp");
    }
    get sideEffects() { return this.#sideEffects; }
    get externalCalls() { return this.#externalCalls; }
    get cancellationChecks() { return this.#cancellationChecks; }
    consumeSideEffect() {
        if (this.#sideEffects >= this.#contract.sideEffectBudget)
            throw new Error("Task side-effect budget exhausted");
        this.#sideEffects += 1;
    }
    consumeExternalCall() {
        if (this.#externalCalls >= this.#contract.externalCallBudget)
            throw new Error("Task external-call budget exhausted");
        this.#externalCalls += 1;
    }
    assertWithinDuration(now) {
        const elapsed = Date.parse(now) - this.#startedAtMs;
        if (!Number.isFinite(elapsed) || elapsed < 0)
            throw new Error("Task duration cannot be computed from an invalid clock");
        if (elapsed > this.#contract.maxDurationMs)
            throw new Error("Task exceeded its maximum duration");
    }
    shouldCheckCancellation(stepIndex) {
        if (!Number.isSafeInteger(stepIndex) || stepIndex < 0)
            throw new Error("Step index must be a nonnegative integer");
        if (stepIndex % this.#contract.cancellationCheckEvery !== 0)
            return false;
        this.#cancellationChecks += 1;
        return true;
    }
}
export function classifyTask(contract) {
    return Object.freeze({
        resumability: contract.resumable ? "resumable" : "not_resumable",
        atomicity: contract.atomic ? "atomic" : "compensable"
    });
}
export function compensationPlan(contract) {
    if (contract.atomic)
        return Object.freeze(["none"]);
    if (contract.compensation === "none")
        throw new Error("A non-atomic task requires a compensation strategy");
    return Object.freeze([contract.compensation]);
}
const EVIDENCE_RANK = Object.freeze({ attested: 0, observed: 1, verified: 2 });
export function assertEvidenceStrength(required, provided) {
    if (EVIDENCE_RANK[provided] < EVIDENCE_RANK[required])
        throw new Error(`Evidence strength ${provided} is below the required ${required}`);
}
export function assertVerificationTimely(startedAtMs, nowMs, timeoutMs) {
    if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs))
        throw new Error("Verification clock is invalid");
    if (nowMs - startedAtMs > timeoutMs)
        throw new Error("Task verification timed out");
}
export function manualReviewFallback(contract, failure) {
    if (!contract.manualReviewFallback)
        throw new Error("Manual-review fallback is not permitted for this task");
    if (!failure.trim())
        throw new Error("Manual-review fallback requires a failure reason");
    return Object.freeze({ action: "manual_review", failure });
}
//# sourceMappingURL=task-contract.js.map