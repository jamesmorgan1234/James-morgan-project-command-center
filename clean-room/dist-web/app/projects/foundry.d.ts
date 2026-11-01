export type FoundryStage = "idea" | "research" | "ultimate_spec" | "architecture" | "roadmap" | "owner_authorization" | "agency_execution" | "evidence" | "acceptance" | "post_launch";
export interface FoundrySnapshot {
    readonly projectId: string;
    readonly stage: FoundryStage;
    readonly specVersion: number;
    readonly requirementRefs: readonly string[];
    readonly decisionRefs: readonly string[];
    readonly artifactRefs: readonly string[];
    readonly ownerAuthorizationRef?: string;
}
export declare function advanceFoundry(snapshot: FoundrySnapshot, to: FoundryStage, evidenceRef: string, ownerAuthorizationRef?: string): FoundrySnapshot;
