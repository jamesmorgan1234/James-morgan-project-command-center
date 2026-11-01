export interface IntegrationCandidate {
    readonly taskId: string;
    readonly artifactKey: string;
    readonly version: number;
    readonly contentHash: string;
    readonly verificationRefs: readonly string[];
}
export interface IntegrationDecision {
    readonly acceptedTaskIds: readonly string[];
    readonly conflicts: readonly string[];
}
export declare function arbitrateIntegration(candidates: readonly IntegrationCandidate[]): IntegrationDecision;
