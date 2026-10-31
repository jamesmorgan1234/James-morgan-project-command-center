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

export type ScenarioTruthClass = "observed_fact" | "assumption" | "simulation" | "counterfactual" | "causal_claim";
export type SensitivityDirection = "increase" | "decrease" | "nonlinear" | "unknown";

export interface ScenarioSensitivity {
  readonly variable: string;
  readonly direction: SensitivityDirection;
  readonly magnitude?: number;
}

export interface ScenarioStatement {
  readonly id: string;
  readonly class: ScenarioTruthClass;
  readonly statement: string;
  readonly evidenceRefs: readonly string[];
  readonly confidence?: number;
  readonly assumptions?: readonly string[];
  readonly sensitivity?: readonly ScenarioSensitivity[];
  readonly causalBasisRefs?: readonly string[];
}

export interface ScenarioAnalysis {
  readonly id: string;
  readonly objective: string;
  readonly statements: readonly ScenarioStatement[];
}

function uniqueNonblank(values: readonly string[] | undefined, label: string, requireOne = false): readonly string[] {
  const actual = values ?? [];
  if (requireOne && actual.length === 0) throw new Error(`${label} requires at least one value`);
  if (actual.some((value) => !value.trim()) || new Set(actual).size !== actual.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze([...actual]);
}

/**
 * P6.5 scenario truth contract. Observations, assumptions, simulations, counterfactuals,
 * and causal claims remain distinct so synthetic reasoning cannot masquerade as observed reality.
 */
export function validateScenarioAnalysis(analysis: ScenarioAnalysis): ScenarioAnalysis {
  if (!analysis.id.trim() || !analysis.objective.trim() || analysis.statements.length === 0) throw new Error("Scenario analysis identity/objective/statements are required");
  const ids = new Set<string>();
  const statements = analysis.statements.map((statement) => {
    if (!statement.id.trim() || !statement.statement.trim() || ids.has(statement.id)) throw new Error("Scenario statements require distinct identity and text");
    ids.add(statement.id);
    const evidenceRefs = uniqueNonblank(statement.evidenceRefs, "Scenario evidence", statement.class === "observed_fact" || statement.class === "causal_claim");
    if (statement.confidence !== undefined && (!Number.isFinite(statement.confidence) || statement.confidence < 0 || statement.confidence > 1)) throw new Error("Scenario confidence must be 0..1");
    if (statement.class !== "observed_fact" && statement.confidence === undefined) throw new Error(`${statement.class} requires explicit confidence`);

    const assumptions = uniqueNonblank(statement.assumptions, "Scenario assumptions", statement.class === "simulation" || statement.class === "counterfactual");
    const causalBasisRefs = uniqueNonblank(statement.causalBasisRefs, "Scenario causal basis", statement.class === "causal_claim");
    const sensitivity = Object.freeze((statement.sensitivity ?? []).map((item) => {
      if (!item.variable.trim() || !["increase", "decrease", "nonlinear", "unknown"].includes(item.direction)) throw new Error("Scenario sensitivity requires variable and direction");
      if (item.magnitude !== undefined && !Number.isFinite(item.magnitude)) throw new Error("Scenario sensitivity magnitude must be finite");
      return Object.freeze({ ...item });
    }));
    if ((statement.class === "simulation" || statement.class === "counterfactual") && sensitivity.length === 0) throw new Error(`${statement.class} requires sensitivity analysis`);
    if (statement.class !== "causal_claim" && causalBasisRefs.length > 0) throw new Error("Only causal claims may carry causal basis references");

    return Object.freeze({
      ...statement,
      evidenceRefs,
      ...(assumptions.length > 0 ? { assumptions } : {}),
      ...(sensitivity.length > 0 ? { sensitivity } : {}),
      ...(causalBasisRefs.length > 0 ? { causalBasisRefs } : {})
    });
  });
  return Object.freeze({ ...analysis, statements: Object.freeze(statements) });
}
