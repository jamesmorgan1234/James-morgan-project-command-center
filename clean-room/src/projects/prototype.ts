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

export function validatePrototypeFeedback(prototype: PrototypeArtifact, feedback: PrototypeFeedback): void {
  if (feedback.prototypeId !== prototype.id) throw new Error("Prototype feedback references the wrong prototype");
  if (!feedback.decisionRef.trim() || feedback.requirementRefs.length === 0) throw new Error("Prototype feedback requires decision and requirement lineage");
  if (feedback.changesProtectedDesign && !feedback.protectedDesignOwnerAuthorizationRef?.trim()) throw new Error("Protected visual design cannot be overridden by prototype feedback without owner authorization");
}
