import { parseTimestamp } from "../security/types.js";

export interface CreditScoreFact {
  readonly provider: string;
  readonly model: string;
  readonly score: number;
  readonly reportDate: string;
  readonly sourceRef: string;
}

export interface CreditFactor {
  readonly key: string;
  readonly impact: "positive" | "negative" | "neutral" | "unknown";
  readonly evidenceRef: string;
}

export interface CreditRecommendation {
  readonly title: string;
  readonly rationale: string;
  readonly factorRefs: readonly string[];
  readonly scoreForecast: null;
}

export function validateCreditScoreFact(fact: CreditScoreFact): void {
  if (!fact.provider.trim() || !fact.model.trim() || !fact.sourceRef.trim()) throw new Error("Credit fact provider/model/source are required");
  if (!Number.isSafeInteger(fact.score) || fact.score < 0 || fact.score > 1000) throw new Error("Credit score value is outside supported factual bounds");
  parseTimestamp(`${fact.reportDate}T00:00:00Z`, "reportDate");
}

export function recommendFromFactors(title: string, rationale: string, factors: readonly CreditFactor[]): CreditRecommendation {
  if (!title.trim() || !rationale.trim() || factors.length === 0) throw new Error("Credit recommendation requires title/rationale/factor evidence");
  return Object.freeze({ title, rationale, factorRefs: Object.freeze(factors.map((factor) => factor.evidenceRef)), scoreForecast: null });
}
