export type ProjectRecoveryMode = "greenfield" | "clean_rebuild" | "rescue" | "migration" | "modernization" | "reality_reconstruction" | "archived_revival" | "retirement";

export interface ProjectRecoveryPlan {
  readonly projectId: string;
  readonly mode: ProjectRecoveryMode;
  readonly lineageRefs: readonly string[];
  readonly assetRefs: readonly string[];
  readonly decisionRefs: readonly string[];
  readonly checkpointRefs: readonly string[];
  readonly ownerReactivationRef?: string;
}

export function validateRecoveryPlan(plan: ProjectRecoveryPlan): void {
  if (!plan.projectId.trim()) throw new Error("Recovery plan projectId is required");
  if (plan.lineageRefs.length === 0 || plan.decisionRefs.length === 0) throw new Error("Recovery plan must preserve lineage and decisions");
  if (plan.mode === "archived_revival" && !plan.ownerReactivationRef?.trim()) throw new Error("Archived project revival requires owner-governed reactivation");
  if (["rescue", "migration", "modernization", "reality_reconstruction", "archived_revival"].includes(plan.mode) && plan.checkpointRefs.length === 0) throw new Error(`${plan.mode} requires a verified checkpoint reference`);
}
