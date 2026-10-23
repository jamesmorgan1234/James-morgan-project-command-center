export interface ScenarioInput {
  readonly key: string;
  readonly cents: number;
  readonly source: "verified_current" | "owner_assumption" | "model_assumption";
  readonly evidenceRefs: readonly string[];
}

export interface FinancialScenarioResult {
  readonly name: string;
  readonly resultingCents: number;
  readonly assumptionKeys: readonly string[];
  readonly verifiedInputKeys: readonly string[];
  readonly outcomePromise: false;
}

export function calculateAdditiveScenario(name: string, inputs: readonly ScenarioInput[]): FinancialScenarioResult {
  if (!name.trim() || inputs.length === 0) throw new Error("Financial scenario requires name and inputs");
  let resultingCents = 0;
  const assumptions: string[] = [];
  const verified: string[] = [];
  for (const input of inputs) {
    if (!input.key.trim() || !Number.isSafeInteger(input.cents)) throw new Error("Financial scenario inputs require key and safe cents");
    if (input.source === "verified_current") {
      if (input.evidenceRefs.length === 0) throw new Error(`Verified scenario input requires evidence: ${input.key}`);
      verified.push(input.key);
    } else assumptions.push(input.key);
    resultingCents += input.cents;
  }
  return Object.freeze({ name, resultingCents, assumptionKeys: Object.freeze(assumptions), verifiedInputKeys: Object.freeze(verified), outcomePromise: false as const });
}
