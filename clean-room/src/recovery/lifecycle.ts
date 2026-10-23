export type LifecycleStage = "birth" | "configure" | "use" | "failure" | "recovery" | "migration" | "disable" | "removal" | "replacement";

export interface LifecycleEvidence {
  readonly subjectKey: string;
  readonly stages: readonly LifecycleStage[];
  readonly evidenceRefs: readonly string[];
  readonly undocumentedManualSurgery: boolean;
  readonly orphanAuthorityOrData: boolean;
}

const REQUIRED: readonly LifecycleStage[] = Object.freeze(["birth", "configure", "use", "failure", "recovery", "migration", "disable", "removal", "replacement"]);

export function validateLongHorizonLifecycle(record: LifecycleEvidence): void {
  if (!record.subjectKey.trim() || record.evidenceRefs.length === 0) throw new Error("lifecycle audit requires identity/evidence");
  if (!REQUIRED.every((stage) => record.stages.includes(stage))) throw new Error("lifecycle audit is incomplete");
  if (record.undocumentedManualSurgery || record.orphanAuthorityOrData) throw new Error("lifecycle leaves hidden manual surgery or orphan state");
}
