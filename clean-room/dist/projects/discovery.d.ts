export type CandidateDisposition = "add" | "merge" | "park" | "reject" | "research";
export interface ProjectMissionFingerprint {
    readonly projectId: string;
    readonly name: string;
    readonly mission: string;
}
export interface ProjectCandidate {
    readonly id: string;
    readonly proposedName: string;
    readonly mission: string;
    readonly sourceRefs: readonly string[];
}
export interface DuplicateSignal {
    readonly projectId: string;
    readonly score: number;
    readonly reason: string;
}
export declare function missionSimilarity(a: string, b: string): number;
export declare function discoverDuplicateSignals(candidate: ProjectCandidate, projects: readonly ProjectMissionFingerprint[], threshold?: number): readonly DuplicateSignal[];
export interface CandidateDecision {
    readonly candidateId: string;
    readonly disposition: CandidateDisposition;
    readonly ownerDecisionRef: string;
    readonly targetProjectId?: string;
}
export declare function assertOwnerGovernedCandidateDecision(decision: CandidateDecision): void;
