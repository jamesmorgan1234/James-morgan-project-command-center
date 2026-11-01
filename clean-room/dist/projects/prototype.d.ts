export interface PrototypeArtifact {
    readonly id: string;
    readonly projectId: string;
    readonly specVersion: number;
    readonly requirementRefs: readonly string[];
    readonly protectedDesignAssetRefs: readonly string[];
    readonly artifactRef: string;
}
export interface PrototypeFeedback {
    readonly id: string;
    readonly prototypeId: string;
    readonly requirementRefs: readonly string[];
    readonly decisionRef: string;
    readonly changesProtectedDesign: boolean;
    readonly protectedDesignOwnerAuthorizationRef?: string;
}
export declare function validatePrototypeFeedback(prototype: PrototypeArtifact, feedback: PrototypeFeedback): void;
