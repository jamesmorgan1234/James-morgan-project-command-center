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
export declare function recommendationSecurityImpact(input: {
    touchesProtectedData: boolean;
    changesAuthorization: boolean;
    addsExternalIntegration: boolean;
}): RecommendationSecurityAssessment;
export interface AcceptedRecommendationLink {
    readonly recommendationId: string;
    readonly roadmapUnitRef: string;
    readonly status: "accepted";
}
export declare function linkAcceptedRecommendation(recommendationId: string, roadmapUnitRef: string): AcceptedRecommendationLink;
export interface ImplementedRecommendationLink {
    readonly recommendationId: string;
    readonly releaseEvidenceRef: string;
    readonly status: "implemented";
}
export declare function linkImplementedRecommendation(recommendationId: string, releaseEvidenceRef: string): ImplementedRecommendationLink;
