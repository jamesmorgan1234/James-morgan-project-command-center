export type OriginalRecoveryOutcome = "found" | "not_found" | "blocked";
export interface OriginalRecoveryAttempt {
    readonly candidateRef: string;
    readonly outcome: OriginalRecoveryOutcome;
    readonly evidenceRef: string;
    readonly recoveredOriginalRef?: string;
}
export interface ReconstructionRecord {
    readonly label: "RECONSTRUCTION";
    readonly artifactRef: string;
    readonly sourceRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
}
export interface LostArtifactRecoveryPlan {
    readonly missingArtifactRef: string;
    readonly originalSourceCandidates: readonly string[];
    readonly authorizedCandidateRefs: readonly string[];
    readonly attempts: readonly OriginalRecoveryAttempt[];
    readonly reconstruction?: ReconstructionRecord;
}
export type LostArtifactRecoveryDecision = {
    readonly status: "original_recovered";
    readonly originalRef: string;
    readonly evidenceRefs: readonly string[];
} | {
    readonly status: "awaiting_authorization";
    readonly remainingCandidateRefs: readonly string[];
} | {
    readonly status: "original_search_required";
    readonly remainingCandidateRefs: readonly string[];
} | {
    readonly status: "recovery_blocked";
    readonly blockedCandidateRefs: readonly string[];
} | {
    readonly status: "original_exhausted";
} | {
    readonly status: "reconstruction_allowed";
    readonly reconstruction: ReconstructionRecord;
};
export declare function evaluateOriginalFirstRecovery(plan: LostArtifactRecoveryPlan): LostArtifactRecoveryDecision;
