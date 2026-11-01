export type EpistemicState = "OWNER_STATED" | "VERIFIED" | "EXTERNALLY_CONFIRMED" | "CALCULATED" | "OBSERVED" | "STRONGLY_SUPPORTED" | "INFERRED" | "WEAK_INFERENCE" | "GENERATED" | "HYPOTHESIS" | "PREDICTION" | "ESTIMATE" | "RECOMMENDATION" | "ASSUMPTION" | "EXPERIMENTAL_FINDING" | "STALE" | "CONFLICTING" | "SUPERSEDED" | "DISPROVEN" | "UNKNOWN" | "NOT_APPLICABLE";
export interface EpistemicEvidenceContribution {
    readonly evidenceId: string;
    readonly sourceRef: string;
    readonly independenceGroup: string;
    readonly sourceConfidence: number;
    readonly transformationConfidence: number;
}
export interface EpistemicAssessment {
    readonly id: string;
    readonly claimId: string;
    readonly subjectId: string;
    readonly valueFingerprint: string;
    readonly state: EpistemicState;
    readonly authorityRank: number;
    readonly brainId?: string;
    readonly methodId?: string;
    readonly domainId?: string;
    readonly evidence: readonly EpistemicEvidenceContribution[];
    readonly calibrationScore: number;
    readonly confidence: number;
    readonly observedAt: string;
    readonly recordedAt: string;
    readonly staleAfter?: string;
    readonly applicabilityRefs: readonly string[];
    readonly supersedesAssessmentId?: string;
}
export interface EpistemicResolutionRequest {
    readonly subjectId: string;
    readonly applicabilityRefs: readonly string[];
    readonly now: string;
    readonly confidenceHalfLifeMs: number;
    readonly minimumConfidence: number;
    readonly highImpact: boolean;
}
export interface EpistemicResolution {
    readonly status: "resolved" | "abstain" | "unknown";
    readonly selected?: EpistemicAssessment;
    readonly confidence: number;
    readonly visibleAssessmentIds: readonly string[];
    readonly conflictingAssessmentIds: readonly string[];
    readonly reasons: readonly string[];
}
export declare function validateEpistemicAssessment(assessment: EpistemicAssessment): EpistemicAssessment;
export declare function decayedEpistemicConfidence(assessment: EpistemicAssessment, now: string, halfLifeMs: number): number;
export declare function resolveEpistemicAssessments(assessments: readonly EpistemicAssessment[], request: EpistemicResolutionRequest): EpistemicResolution;
