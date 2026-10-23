export type ClaimClass = "verified_fact" | "owner_decision" | "assumption" | "estimate" | "recommendation";

export interface PlanningClaim {
  readonly id: string;
  readonly class: ClaimClass;
  readonly statement: string;
  readonly evidenceRefs: readonly string[];
  readonly confidence?: number;
}

export interface BrainPlan {
  readonly id: string;
  readonly projectId?: string;
  readonly objective: string;
  readonly claims: readonly PlanningClaim[];
  readonly proposedActions: readonly string[];
  readonly requiresOwnerDecision: boolean;
}

export function validateBrainPlan(plan: BrainPlan): void {
  if (!plan.id.trim() || !plan.objective.trim()) throw new Error("Plan id/objective are required");
  for (const claim of plan.claims) {
    if (!claim.id.trim() || !claim.statement.trim()) throw new Error("Planning claim identity/statement are required");
    if (["verified_fact", "owner_decision"].includes(claim.class) && claim.evidenceRefs.length === 0) throw new Error(`${claim.class} requires evidence`);
    if (["assumption", "estimate", "recommendation"].includes(claim.class) && claim.confidence === undefined) throw new Error(`${claim.class} requires confidence`);
    if (claim.confidence !== undefined && (!Number.isFinite(claim.confidence) || claim.confidence < 0 || claim.confidence > 1)) throw new Error("Claim confidence must be 0..1");
  }
}
