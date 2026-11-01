/**
 * Recommendation impact binding.
 *
 * A recommendation must declare its security impact before owner review, an
 * accepted recommendation must point at the roadmap unit it becomes, and an
 * implemented recommendation must point at the release evidence that shipped it.
 */
export function recommendationSecurityImpact(input) {
    const reasons = [];
    if (input.changesAuthorization)
        reasons.push("changes_authorization");
    if (input.touchesProtectedData)
        reasons.push("touches_protected_data");
    if (input.addsExternalIntegration)
        reasons.push("adds_external_integration");
    const risk = input.changesAuthorization
        ? "protected"
        : reasons.length > 0 ? "review_required" : "none";
    return Object.freeze({
        risk,
        reviewRequired: risk !== "none",
        reasons: Object.freeze(reasons)
    });
}
export function linkAcceptedRecommendation(recommendationId, roadmapUnitRef) {
    if (!recommendationId.trim())
        throw new Error("Accepted recommendation link requires a recommendation id");
    if (!roadmapUnitRef.trim())
        throw new Error("Accepted recommendation requires a roadmap unit reference");
    return Object.freeze({ recommendationId, roadmapUnitRef, status: "accepted" });
}
export function linkImplementedRecommendation(recommendationId, releaseEvidenceRef) {
    if (!recommendationId.trim())
        throw new Error("Implemented recommendation link requires a recommendation id");
    if (!releaseEvidenceRef.trim())
        throw new Error("Implemented recommendation requires release evidence");
    return Object.freeze({ recommendationId, releaseEvidenceRef, status: "implemented" });
}
//# sourceMappingURL=recommendation-impact.js.map