function validNonNegative(value) { return Number.isSafeInteger(value) && value >= 0; }
export function validateAdmissionPolicy(policy) {
    if (!validNonNegative(policy.monetaryBudgetCents))
        throw new Error("monetaryBudgetCents must be a non-negative safe integer");
    if (!Number.isSafeInteger(policy.maxConcurrent) || policy.maxConcurrent < 1)
        throw new Error("maxConcurrent must be a positive safe integer");
    if (!validNonNegative(policy.maxQueueDepth) || !validNonNegative(policy.maxRetries) || !validNonNegative(policy.maxRuntimeMs))
        throw new Error("Admission limits must be non-negative safe integers");
}
export function evaluateAdmission(policy, request) {
    validateAdmissionPolicy(policy);
    if (!request.pricingKnown)
        return Object.freeze({ allowed: false, reason: "pricing_unknown" });
    if (request.estimatedCostCents === undefined || !validNonNegative(request.estimatedCostCents))
        return Object.freeze({ allowed: false, reason: "invalid_estimated_cost" });
    if (request.estimatedCostCents > policy.monetaryBudgetCents)
        return Object.freeze({ allowed: false, reason: "monetary_budget_exceeded" });
    if (request.currentConcurrent >= policy.maxConcurrent)
        return Object.freeze({ allowed: false, reason: "concurrency_limit_reached" });
    if (request.queueDepth > policy.maxQueueDepth)
        return Object.freeze({ allowed: false, reason: "queue_depth_limit_exceeded" });
    if (request.retryCount > policy.maxRetries)
        return Object.freeze({ allowed: false, reason: "retry_limit_exceeded" });
    if (!validNonNegative(request.requestedRuntimeMs) || request.requestedRuntimeMs > policy.maxRuntimeMs)
        return Object.freeze({ allowed: false, reason: "runtime_limit_exceeded" });
    return Object.freeze({ allowed: true, reason: "admitted" });
}
export function zeroBudgetPolicy(overrides) {
    return Object.freeze({ monetaryBudgetCents: 0, ...overrides });
}
//# sourceMappingURL=admission.js.map