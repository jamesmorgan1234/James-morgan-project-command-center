function decision(promote, reason) {
    return Object.freeze({ promote, action: promote ? "promote" : "rollback", reason });
}
function evaluate(stable, candidate, maxSuccessRegression) {
    if (!Number.isFinite(maxSuccessRegression) || maxSuccessRegression < 0)
        throw new Error("maxSuccessRegression must be non-negative");
    if (candidate.protectedBoundaryViolationCount > 0)
        return decision(false, "protected_boundary_violation");
    if (candidate.duplicateSideEffectCount > 0)
        return decision(false, "duplicate_side_effect");
    if (candidate.successRate < stable.successRate - maxSuccessRegression)
        return decision(false, "success_rate_regression");
    if (candidate.verificationFailureRate > stable.verificationFailureRate)
        return decision(false, "verification_regression");
    return decision(true, "candidate_within_safe_thresholds");
}
export function evaluateCanary(stableOrLegacy, candidateOrRegression, maybeRegression = 0.02) {
    if ("stableSuccessRate" in stableOrLegacy) {
        const regression = typeof candidateOrRegression === "number" ? candidateOrRegression : 0.02;
        const stable = {
            successRate: stableOrLegacy.stableSuccessRate,
            verificationFailureRate: stableOrLegacy.stableVerificationFailureRate,
            protectedBoundaryViolationCount: 0,
            duplicateSideEffectCount: 0
        };
        const candidate = {
            successRate: stableOrLegacy.candidateSuccessRate,
            verificationFailureRate: stableOrLegacy.candidateVerificationFailureRate,
            protectedBoundaryViolationCount: stableOrLegacy.protectedBoundaryViolationCount,
            duplicateSideEffectCount: stableOrLegacy.duplicateSideEffectCount
        };
        return evaluate(stable, candidate, regression);
    }
    if (!candidateOrRegression || typeof candidateOrRegression === "number")
        throw new Error("Candidate canary metrics are required");
    return evaluate(stableOrLegacy, candidateOrRegression, maybeRegression);
}
//# sourceMappingURL=rollout.js.map