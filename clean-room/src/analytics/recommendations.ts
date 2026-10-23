export type RecommendationStatus = "proposed" | "accepted" | "rejected" | "parked" | "implemented" | "measured";

export interface RecommendationRecord {
  readonly id: string;
  readonly projectId: string | null;
  readonly evidenceRefs: readonly string[];
  readonly confidence: number;
  readonly expectedBenefit: string;
  readonly successCriteria: readonly string[];
  readonly status: RecommendationStatus;
  readonly implementationAuthorized: boolean;
  readonly actualOutcomeRefs: readonly string[];
}

export function validateRecommendation(record: RecommendationRecord): RecommendationRecord {
  if (!record.id.trim() || record.evidenceRefs.length === 0 || record.successCriteria.length === 0 || record.confidence < 0 || record.confidence > 1) throw new Error("recommendation requires evidence/confidence/success criteria");
  if (record.status === "implemented" && !record.implementationAuthorized) throw new Error("recommendation cannot self-install");
  if (record.status === "measured" && record.actualOutcomeRefs.length === 0) throw new Error("measured recommendation requires outcome evidence");
  return Object.freeze({ ...record, evidenceRefs: Object.freeze([...record.evidenceRefs]), successCriteria: Object.freeze([...record.successCriteria]), actualOutcomeRefs: Object.freeze([...record.actualOutcomeRefs]) });
}
