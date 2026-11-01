/**
 * Recommendation impact binding.
 *
 * A recommendation must declare its security impact before owner review, an
 * accepted recommendation must point at the roadmap unit it becomes, and an
 * implemented recommendation must point at the release evidence that shipped it.
 */

export type RecommendationSecurityRisk = "none" | "review_required" | "protected";

export interface RecommendationSecurityAssessment {
  readonly risk: RecommendationSecurityRisk;
  readonly reviewRequired: boolean;
  readonly reasons: readonly string[];
}

export function recommendationSecurityImpact(input: {
  touchesProtectedData: boolean;
  changesAuthorization: boolean;
  addsExternalIntegration: boolean;
}): RecommendationSecurityAssessment {
  const reasons: string[] = [];
  if (input.changesAuthorization) reasons.push("changes_authorization");
  if (input.touchesProtectedData) reasons.push("touches_protected_data");
  if (input.addsExternalIntegration) reasons.push("adds_external_integration");
  const risk: RecommendationSecurityRisk = input.changesAuthorization
    ? "protected"
    : reasons.length > 0 ? "review_required" : "none";
  return Object.freeze({
    risk,
    reviewRequired: risk !== "none",
    reasons: Object.freeze(reasons)
  });
}

export interface AcceptedRecommendationLink {
  readonly recommendationId: string;
  readonly roadmapUnitRef: string;
  readonly status: "accepted";
}

export function linkAcceptedRecommendation(recommendationId: string, roadmapUnitRef: string): AcceptedRecommendationLink {
  if (!recommendationId.trim()) throw new Error("Accepted recommendation link requires a recommendation id");
  if (!roadmapUnitRef.trim()) throw new Error("Accepted recommendation requires a roadmap unit reference");
  return Object.freeze({ recommendationId, roadmapUnitRef, status: "accepted" as const });
}

export interface ImplementedRecommendationLink {
  readonly recommendationId: string;
  readonly releaseEvidenceRef: string;
  readonly status: "implemented";
}

export function linkImplementedRecommendation(recommendationId: string, releaseEvidenceRef: string): ImplementedRecommendationLink {
  if (!recommendationId.trim()) throw new Error("Implemented recommendation link requires a recommendation id");
  if (!releaseEvidenceRef.trim()) throw new Error("Implemented recommendation requires release evidence");
  return Object.freeze({ recommendationId, releaseEvidenceRef, status: "implemented" as const });
}
