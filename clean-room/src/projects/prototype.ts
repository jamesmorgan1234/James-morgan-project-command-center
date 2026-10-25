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

function assertNonblankUnique(values: readonly string[], label: string, required = true): void {
  if (required && values.length === 0) throw new Error(`${label} is required`);
  if (values.some((value) => !value.trim())) throw new Error(`${label} entries cannot be blank`);
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
}

export function validatePrototypeFeedback(prototype: PrototypeArtifact, feedback: PrototypeFeedback): void {
  if (!prototype.id.trim() || !prototype.projectId.trim() || !prototype.artifactRef.trim()) throw new Error("Prototype identity, project, and artifact reference are required");
  if (!Number.isSafeInteger(prototype.specVersion) || prototype.specVersion < 1) throw new Error("Prototype spec version must be a positive safe integer");
  assertNonblankUnique(prototype.requirementRefs, "Prototype requirement lineage");
  assertNonblankUnique(prototype.protectedDesignAssetRefs, "Protected design asset references", false);

  if (!feedback.id.trim()) throw new Error("Prototype feedback identity is required");
  if (feedback.prototypeId !== prototype.id) throw new Error("Prototype feedback references the wrong prototype");
  if (!feedback.decisionRef.trim()) throw new Error("Prototype feedback requires decision lineage");
  assertNonblankUnique(feedback.requirementRefs, "Prototype feedback requirement lineage");
  const prototypeRequirements = new Set(prototype.requirementRefs);
  for (const requirementRef of feedback.requirementRefs) {
    if (!prototypeRequirements.has(requirementRef)) throw new Error(`Prototype feedback references requirement outside prototype lineage: ${requirementRef}`);
  }
  if (feedback.changesProtectedDesign && !feedback.protectedDesignOwnerAuthorizationRef?.trim()) throw new Error("Protected visual design cannot be overridden by prototype feedback without owner authorization");
}
