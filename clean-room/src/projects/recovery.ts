import { validateProjectInheritancePlan, type ProjectInheritancePlan } from "./inheritance.js";

export type ProjectRecoveryMode = "greenfield" | "clean_rebuild" | "rescue" | "migration" | "modernization" | "reality_reconstruction" | "archived_revival" | "retirement";

export interface ProjectRecoveryPlan {
  readonly projectId: string;
  readonly mode: ProjectRecoveryMode;
  readonly lineageRefs: readonly string[];
  readonly assetRefs: readonly string[];
  readonly decisionRefs: readonly string[];
  readonly checkpointRefs: readonly string[];
  readonly ownerReactivationRef?: string;
  readonly previousInheritedIntelligenceRefs?: readonly string[];
  readonly inheritancePlan?: ProjectInheritancePlan;
}

function assertRefs(values: readonly string[], label: string, required: boolean): void {
  if (required && values.length === 0) throw new Error(`${label} is required`);
  if (values.some((value) => !value.trim())) throw new Error(`${label} entries cannot be blank`);
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
}

export function validateRecoveryPlan(plan: ProjectRecoveryPlan): void {
  if (!plan.projectId.trim()) throw new Error("Recovery plan projectId is required");
  assertRefs(plan.lineageRefs, "Recovery lineage", true);
  assertRefs(plan.assetRefs, "Recovery assets", false);
  assertRefs(plan.decisionRefs, "Recovery decisions", true);
  assertRefs(plan.checkpointRefs, "Recovery checkpoints", false);
  if (plan.mode === "archived_revival" && !plan.ownerReactivationRef?.trim()) throw new Error("Archived project revival requires owner-governed reactivation");
  if (["rescue", "migration", "modernization", "reality_reconstruction", "archived_revival"].includes(plan.mode) && plan.checkpointRefs.length === 0) throw new Error(`${plan.mode} requires a verified checkpoint reference`);

  const priorInheritance = plan.previousInheritedIntelligenceRefs ?? [];
  assertRefs(priorInheritance, "Recovery inherited intelligence", false);
  if (plan.inheritancePlan) {
    validateProjectInheritancePlan(plan.inheritancePlan);
    if (plan.inheritancePlan.projectId !== plan.projectId) throw new Error("Recovery inheritance project identity mismatch");
  }
  if (priorInheritance.length > 0 && !plan.inheritancePlan) {
    throw new Error("Recovery of inherited intelligence requires explicit applicability revalidation");
  }
  if (plan.inheritancePlan) {
    const considered = new Set(plan.inheritancePlan.candidates.map((candidate) => candidate.canonicalRef));
    for (const ref of priorInheritance) {
      if (!considered.has(ref)) throw new Error(`Recovery inheritance revalidation omitted prior intelligence: ${ref}`);
    }
  }
}
