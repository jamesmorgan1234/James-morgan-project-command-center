export type FoundryStage = "idea" | "research" | "ultimate_spec" | "architecture" | "roadmap" | "owner_authorization" | "agency_execution" | "evidence" | "acceptance" | "post_launch";

const NEXT = {
  idea: ["research"],
  research: ["ultimate_spec"],
  ultimate_spec: ["architecture"],
  architecture: ["roadmap"],
  roadmap: ["owner_authorization"],
  owner_authorization: ["agency_execution"],
  agency_execution: ["evidence"],
  evidence: ["acceptance"],
  acceptance: ["post_launch"],
  post_launch: []
} as const satisfies Readonly<Record<FoundryStage, readonly FoundryStage[]>>;

export interface FoundrySnapshot {
  readonly projectId: string;
  readonly stage: FoundryStage;
  readonly specVersion: number;
  readonly requirementRefs: readonly string[];
  readonly decisionRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly ownerAuthorizationRef?: string;
}

export function advanceFoundry(snapshot: FoundrySnapshot, to: FoundryStage, evidenceRef: string, ownerAuthorizationRef?: string): FoundrySnapshot {
  if (!(NEXT[snapshot.stage] as readonly FoundryStage[]).includes(to)) throw new Error(`Invalid Foundry transition: ${snapshot.stage} -> ${to}`);
  if (!evidenceRef.trim()) throw new Error("Foundry transition requires evidence");
  let authorization = snapshot.ownerAuthorizationRef;
  if (to === "agency_execution") {
    authorization = ownerAuthorizationRef ?? snapshot.ownerAuthorizationRef;
    if (!authorization?.trim()) throw new Error("Agency execution requires exact owner authorization reference");
  }
  return Object.freeze({ ...snapshot, stage: to, artifactRefs: Object.freeze([...snapshot.artifactRefs, evidenceRef]), ...(authorization ? { ownerAuthorizationRef: authorization } : {}) });
}
