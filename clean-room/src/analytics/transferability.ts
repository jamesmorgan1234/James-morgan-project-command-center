export interface TransferRegime {
  readonly domain?: string;
  readonly companyId?: string;
  readonly taskClass?: string;
  readonly environment?: string;
  readonly provider?: string;
  readonly dataClass?: string;
  readonly resourceClass?: string;
}

export interface NegativeKnowledgeRecord {
  readonly id: string;
  readonly version: number;
  readonly statement: string;
  readonly sourceRegime: TransferRegime;
  readonly contraindication: TransferRegime;
  readonly failureSignature: string;
  readonly recoveryLessons: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly evaluatorEvidenceRefs: readonly string[];
  readonly active: boolean;
  readonly invalidatedByEvidenceRefs: readonly string[];
  readonly recordedAt: string;
  readonly revalidateAfter: string;
}

export interface TransferAssessment {
  readonly id: string;
  readonly version: number;
  readonly sourceRef: string;
  readonly sourceRegime: TransferRegime;
  readonly targetRegime: TransferRegime;
  readonly similarityEvidenceRefs: readonly string[];
  readonly applicabilityEvidenceRefs: readonly string[];
  readonly evaluatorEvidenceRefs: readonly string[];
  readonly negativeKnowledgeRefs: readonly string[];
  readonly alternativeRefs: readonly string[];
  readonly decision: "eligible" | "rejected" | "revoked";
  readonly reasonCodes: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly decidedAt: string;
  readonly expiresAt: string;
}

function time(value: string, label: string): number { const parsed = Date.parse(value); if (!Number.isFinite(parsed)) throw new Error(`${label} must be valid`); return parsed; }
function unique(values: readonly string[], label: string, requireOne = false): void { if (requireOne && values.length === 0) throw new Error(`${label} requires evidence`); if (values.some((value) => !value.trim()) || new Set(values).size !== values.length) throw new Error(`${label} must be unique/nonblank`); }
function sameIfSpecified(constraint: TransferRegime, target: TransferRegime): boolean {
  return Object.entries(constraint).every(([key, value]) => value === undefined || target[key as keyof TransferRegime] === value);
}

export function validateNegativeKnowledge(record: NegativeKnowledgeRecord): NegativeKnowledgeRecord {
  if (!record.id.trim() || !Number.isInteger(record.version) || record.version < 1 || !record.statement.trim() || !record.failureSignature.trim()) throw new Error("Negative knowledge identity/version/statement/failure signature required");
  unique(record.recoveryLessons, "Recovery lessons", true); unique(record.evidenceRefs, "Negative knowledge evidence", true); unique(record.evaluatorEvidenceRefs, "Negative knowledge evaluator evidence", true); unique(record.invalidatedByEvidenceRefs, "Negative knowledge invalidation evidence");
  const recorded = time(record.recordedAt, "Negative knowledge recordedAt"); if (time(record.revalidateAfter, "Negative knowledge revalidateAfter") <= recorded) throw new Error("Negative knowledge revalidation must follow recording");
  if (record.invalidatedByEvidenceRefs.length > 0 && record.active) throw new Error("Invalidated negative knowledge cannot remain active");
  return Object.freeze({ ...record, recoveryLessons: Object.freeze([...record.recoveryLessons]), evidenceRefs: Object.freeze([...record.evidenceRefs]), evaluatorEvidenceRefs: Object.freeze([...record.evaluatorEvidenceRefs]), invalidatedByEvidenceRefs: Object.freeze([...record.invalidatedByEvidenceRefs]), sourceRegime: Object.freeze({ ...record.sourceRegime }), contraindication: Object.freeze({ ...record.contraindication }) });
}

export function assessTransfer(input: Omit<TransferAssessment, "decision" | "reasonCodes">, negativeKnowledge: readonly NegativeKnowledgeRecord[], now: string): TransferAssessment {
  if (!input.id.trim() || !Number.isInteger(input.version) || input.version < 1 || !input.sourceRef.trim()) throw new Error("Transfer identity/version/source required");
  unique(input.evidenceRefs, "Transfer evidence", true); unique(input.similarityEvidenceRefs, "Transfer similarity evidence"); unique(input.applicabilityEvidenceRefs, "Transfer applicability evidence"); unique(input.evaluatorEvidenceRefs, "Transfer evaluator evidence"); unique(input.negativeKnowledgeRefs, "Transfer negative knowledge refs"); unique(input.alternativeRefs, "Transfer alternatives");
  const current = time(now, "Transfer evaluation time"); if (time(input.expiresAt, "Transfer expiresAt") <= time(input.decidedAt, "Transfer decidedAt")) throw new Error("Transfer expiry must follow decision");
  const reasons: string[] = [];
  let decision: TransferAssessment["decision"] = "eligible";
  const referenced = negativeKnowledge.filter((item) => input.negativeKnowledgeRefs.includes(item.id));
  const invalidatedEvidence = referenced.some((item) => item.invalidatedByEvidenceRefs.length > 0);
  if (invalidatedEvidence) { decision = "revoked"; reasons.push("dependent_evidence_invalidated"); }
  const blocking = referenced.find((item) => item.active && sameIfSpecified(item.contraindication, input.targetRegime));
  if (blocking) { decision = "rejected"; reasons.push("known_contraindication"); }
  if (input.applicabilityEvidenceRefs.length === 0) { decision = "rejected"; reasons.push(input.similarityEvidenceRefs.length > 0 ? "similarity_alone_insufficient" : "applicability_not_proven"); }
  if (input.evaluatorEvidenceRefs.length === 0) { decision = "rejected"; reasons.push("evaluator_evidence_missing"); }
  if (current >= time(input.expiresAt, "Transfer expiresAt")) { decision = "revoked"; reasons.push("transfer_expired"); }
  return Object.freeze({ ...input, decision, reasonCodes: Object.freeze(reasons.length ? [...new Set(reasons)] : ["scoped_transfer_eligible"]), sourceRegime: Object.freeze({ ...input.sourceRegime }), targetRegime: Object.freeze({ ...input.targetRegime }), similarityEvidenceRefs: Object.freeze([...input.similarityEvidenceRefs]), applicabilityEvidenceRefs: Object.freeze([...input.applicabilityEvidenceRefs]), evaluatorEvidenceRefs: Object.freeze([...input.evaluatorEvidenceRefs]), negativeKnowledgeRefs: Object.freeze([...input.negativeKnowledgeRefs]), alternativeRefs: Object.freeze([...input.alternativeRefs]), evidenceRefs: Object.freeze([...input.evidenceRefs]) });
}
