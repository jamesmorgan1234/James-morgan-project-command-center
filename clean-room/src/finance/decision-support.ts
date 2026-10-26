export type FinancialDecisionInputSource = "verified_current" | "owner_assumption" | "model_assumption";

export interface FinancialDecisionInput {
  readonly key: string;
  readonly cents: number;
  readonly source: FinancialDecisionInputSource;
  readonly evidenceRefs: readonly string[];
  readonly sensitivity?: Readonly<{ lowCents: number; highCents: number }> | undefined;
}

export interface FinancialDecisionScenarioInput {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly currency: string;
  readonly goalRefs: readonly string[];
  readonly budgetRefs: readonly string[];
  readonly debtRefs: readonly string[];
  readonly cashflowRefs: readonly string[];
  readonly inputs: readonly FinancialDecisionInput[];
  readonly observedAt: string;
}

export interface FinancialDecisionScenarioResult {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly currency: string;
  readonly resultingCents: number;
  readonly lowSensitivityCents: number;
  readonly highSensitivityCents: number;
  readonly verifiedInputKeys: readonly string[];
  readonly assumptionKeys: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly assumptionRefs: readonly string[];
  readonly goalRefs: readonly string[];
  readonly budgetRefs: readonly string[];
  readonly debtRefs: readonly string[];
  readonly cashflowRefs: readonly string[];
  readonly scoreForecast: null;
  readonly outcomePromise: false;
  readonly protectedActionAuthorized: false;
}

export interface FinancialDecisionRecommendation {
  readonly title: string;
  readonly rationale: string;
  readonly evidenceRefs: readonly string[];
  readonly assumptionRefs: readonly string[];
  readonly scenarioRef: string;
  readonly scoreForecast: null;
  readonly outcomePromise: false;
  readonly protectedActionAuthorized: false;
}

function refs(values: readonly string[], label: string, requireOne = false): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

function safeCents(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must use safe integer cents`);
}

export function evaluateFinancialDecisionScenario(input: FinancialDecisionScenarioInput): FinancialDecisionScenarioResult {
  if (!input.id.trim() || !input.ownerId.trim() || !input.name.trim()) throw new Error("Financial decision scenario identity/owner/name are required");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("Financial decision scenario currency must be three uppercase letters");
  if (!Number.isFinite(Date.parse(input.observedAt))) throw new Error("Financial decision scenario observedAt must be an ISO-compatible timestamp");
  if (!Array.isArray(input.inputs) || input.inputs.length === 0) throw new Error("Financial decision scenario requires inputs");

  const verified: string[] = [];
  const assumptions: string[] = [];
  const evidence = new Set<string>();
  const assumptionRefs = new Set<string>();
  const seen = new Set<string>();
  let resulting = 0;
  let low = 0;
  let high = 0;

  for (const item of input.inputs) {
    if (!item.key.trim() || seen.has(item.key)) throw new Error(`Financial decision input key must be nonblank and unique: ${item.key}`);
    seen.add(item.key);
    safeCents(item.cents, `Financial decision input ${item.key}`);
    const itemRefs = refs(item.evidenceRefs, `Financial decision input evidence ${item.key}`, item.source === "verified_current");
    resulting += item.cents;
    if (item.source === "verified_current") {
      verified.push(item.key);
      itemRefs.forEach((ref) => evidence.add(ref));
      low += item.cents;
      high += item.cents;
      if (item.sensitivity !== undefined) throw new Error(`Verified current input cannot carry sensitivity assumption: ${item.key}`);
    } else {
      assumptions.push(item.key);
      itemRefs.forEach((ref) => assumptionRefs.add(ref));
      if (!item.sensitivity) {
        low += item.cents;
        high += item.cents;
      } else {
        safeCents(item.sensitivity.lowCents, `Sensitivity low ${item.key}`);
        safeCents(item.sensitivity.highCents, `Sensitivity high ${item.key}`);
        if (item.sensitivity.lowCents > item.sensitivity.highCents) throw new Error(`Sensitivity range is inverted: ${item.key}`);
        if (item.cents < item.sensitivity.lowCents || item.cents > item.sensitivity.highCents) throw new Error(`Scenario point is outside sensitivity range: ${item.key}`);
        low += item.sensitivity.lowCents;
        high += item.sensitivity.highCents;
      }
    }
  }

  return Object.freeze({
    id: input.id,
    ownerId: input.ownerId,
    name: input.name,
    currency: input.currency,
    resultingCents: resulting,
    lowSensitivityCents: low,
    highSensitivityCents: high,
    verifiedInputKeys: Object.freeze(verified),
    assumptionKeys: Object.freeze(assumptions),
    evidenceRefs: Object.freeze([...evidence]),
    assumptionRefs: Object.freeze([...assumptionRefs]),
    goalRefs: refs(input.goalRefs, "Financial decision goalRefs"),
    budgetRefs: refs(input.budgetRefs, "Financial decision budgetRefs"),
    debtRefs: refs(input.debtRefs, "Financial decision debtRefs"),
    cashflowRefs: refs(input.cashflowRefs, "Financial decision cashflowRefs"),
    scoreForecast: null,
    outcomePromise: false as const,
    protectedActionAuthorized: false as const
  });
}

export function buildFinancialDecisionRecommendation(title: string, rationale: string, scenario: FinancialDecisionScenarioResult, additionalEvidenceRefs: readonly string[] = []): FinancialDecisionRecommendation {
  if (!title.trim() || !rationale.trim()) throw new Error("Financial recommendation requires title and rationale");
  const evidenceRefs = Object.freeze([...new Set([...scenario.evidenceRefs, ...refs(additionalEvidenceRefs, "Financial recommendation evidence")])]);
  if (evidenceRefs.length === 0) throw new Error("Financial recommendation requires verified evidence");
  return Object.freeze({ title, rationale, evidenceRefs, assumptionRefs: scenario.assumptionRefs, scenarioRef: scenario.id, scoreForecast: null, outcomePromise: false as const, protectedActionAuthorized: false as const });
}
