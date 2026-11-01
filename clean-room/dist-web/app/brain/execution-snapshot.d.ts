export interface ExecutableProposal {
    readonly id: string;
    readonly projectId: string;
    readonly version: number;
    readonly title: string;
    readonly decisionRefs: readonly string[];
    readonly requirementRefs: readonly string[];
    readonly actionRefs: readonly string[];
}
export interface ExecutionSnapshot {
    readonly id: string;
    readonly projectId: string;
    readonly proposalId: string;
    readonly proposalVersion: number;
    readonly authorizationRef: string;
    readonly decisionRefs: readonly string[];
    readonly requirementRefs: readonly string[];
    readonly actionRefs: readonly string[];
}
export declare function freezeExecutionSnapshot(proposal: ExecutableProposal, authorizationRef: string, snapshotId: string): ExecutionSnapshot;
export declare function resolveReferent(referenceText: string, currentProposal: ExecutableProposal | undefined, candidates: readonly ExecutableProposal[]): ExecutableProposal;
