export type EvaluationEvidenceClass = "synthetic" | "simulation" | "shadow" | "canary" | "production" | "external" | "owner_verified";
export type EvaluationDecision = "better" | "worse" | "equivalent" | "insufficient_evidence";
export type OutcomeTruth = "observed" | "verified" | "calculated" | "synthetic";

export interface EvaluatorDefinition {
  readonly key: string;
  readonly version: number;
  readonly ownerRef: string;
  readonly purpose: string;
  readonly biasRisks: readonly string[];
  readonly requiredDataClasses: readonly string[];
  readonly prohibitedDataClasses: readonly string[];
  readonly applicableDomains: readonly string[];
  readonly applicableTaskClasses: readonly string[];
  readonly minimumEvidenceClasses: readonly EvaluationEvidenceClass[];
  readonly repeatCount: number;
  readonly minimumSampleCount: number;
  readonly minimumConfidence: number;
  readonly acceptanceAuthority: "command_center" | "owner";
  readonly calibrationEvidenceRefs: readonly string[];
  readonly active: boolean;
}

export interface DecisionTimeSnapshot {
  readonly capturedAt: string;
  readonly candidateRef: string;
  readonly baselineRef: string;
  readonly evaluatorKey: string;
  readonly evaluatorVersion: number;
  readonly inputFingerprint: string;
  readonly environmentFingerprint: string;
  readonly constraintRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface EvaluationObservation {
  readonly runRef: string;
  readonly evidenceClass: EvaluationEvidenceClass;
  readonly sampleCount: number;
  readonly repeatIndex: number;
  readonly baselineScore: number;
  readonly candidateScore: number;
  readonly confidence: number;
  readonly sourceRefs: readonly string[];
  readonly synthetic: boolean;
}

export interface EvaluationResult {
  readonly evaluatorKey: string;
  readonly evaluatorVersion: number;
  readonly decision: EvaluationDecision;
  readonly calibratedConfidence: number;
  readonly meanDelta: number;
  readonly eligibleProductionEvidence: boolean;
  readonly acceptanceEligible: boolean;
  readonly evidenceClasses: readonly EvaluationEvidenceClass[];
  readonly reasonCodes: readonly string[];
}

export interface ActualOutcomeRecord {
  readonly id: string;
  readonly evaluationRunRef: string;
  readonly candidateRef: string;
  readonly observedAt: string;
  readonly truth: OutcomeTruth;
  readonly metricKey: string;
  readonly value: number;
  readonly sourceRefs: readonly string[];
  readonly confounders: readonly string[];
  readonly causalAttribution: "none" | "possible" | "supported";
}

function score(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`);
}
function unique(values: readonly string[], label: string, requireOne = false): void {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  if (values.some((value) => !value.trim()) || new Set(values).size !== values.length) throw new Error(`${label} must be unique and nonblank`);
}
function ts(value: string, label: string): void { if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be a valid timestamp`); }

export function validateEvaluator(definition: EvaluatorDefinition): EvaluatorDefinition {
  if (!definition.key.startsWith("evaluator:") || !definition.ownerRef.trim() || !definition.purpose.trim()) throw new Error("Evaluator identity/owner/purpose are required");
  if (!Number.isInteger(definition.version) || definition.version < 1) throw new Error("Evaluator version must be positive");
  if (!Number.isInteger(definition.repeatCount) || definition.repeatCount < 1 || !Number.isInteger(definition.minimumSampleCount) || definition.minimumSampleCount < 1) throw new Error("Evaluator repeat/sample bounds must be positive integers");
  score(definition.minimumConfidence, "Evaluator minimum confidence");
  unique(definition.biasRisks, "Evaluator bias risks", true); unique(definition.requiredDataClasses, "Evaluator required data"); unique(definition.prohibitedDataClasses, "Evaluator prohibited data");
  unique(definition.applicableDomains, "Evaluator domains", true); unique(definition.applicableTaskClasses, "Evaluator task classes", true); unique(definition.calibrationEvidenceRefs, "Evaluator calibration evidence", true);
  if (definition.minimumEvidenceClasses.length === 0) throw new Error("Evaluator minimum evidence classes are required");
  return Object.freeze({ ...definition, biasRisks: Object.freeze([...definition.biasRisks]), requiredDataClasses: Object.freeze([...definition.requiredDataClasses]), prohibitedDataClasses: Object.freeze([...definition.prohibitedDataClasses]), applicableDomains: Object.freeze([...definition.applicableDomains]), applicableTaskClasses: Object.freeze([...definition.applicableTaskClasses]), minimumEvidenceClasses: Object.freeze([...definition.minimumEvidenceClasses]), calibrationEvidenceRefs: Object.freeze([...definition.calibrationEvidenceRefs]) });
}

export class EvaluatorRegistry {
  readonly #versions = new Map<string, EvaluatorDefinition[]>();
  register(definition: EvaluatorDefinition): EvaluatorDefinition {
    const valid = validateEvaluator(definition); const history = this.#versions.get(valid.key) ?? []; const latest = history.at(-1);
    if (latest && valid.version <= latest.version) throw new Error("Evaluator version must advance");
    this.#versions.set(valid.key, [...history, valid]); return valid;
  }
  get(key: string, version?: number): EvaluatorDefinition | undefined {
    const history = this.#versions.get(key) ?? []; return version === undefined ? history.at(-1) : history.find((item) => item.version === version);
  }
}

export function evaluateCandidate(definition: EvaluatorDefinition, snapshot: DecisionTimeSnapshot, observations: readonly EvaluationObservation[], context: { domain: string; taskClass: string; candidateOwnerRef: string; calibrationScore: number }): EvaluationResult {
  validateEvaluator(definition); score(context.calibrationScore, "Evaluator calibration score"); ts(snapshot.capturedAt, "Decision snapshot time");
  if (snapshot.evaluatorKey !== definition.key || snapshot.evaluatorVersion !== definition.version) throw new Error("Decision snapshot must pin exact evaluator version");
  const reasons: string[] = [];
  if (!definition.active) reasons.push("evaluator_inactive");
  if (!definition.applicableDomains.includes(context.domain)) reasons.push("domain_out_of_scope");
  if (!definition.applicableTaskClasses.includes(context.taskClass)) reasons.push("task_out_of_scope");
  if (observations.length < definition.repeatCount) reasons.push("repeatability_not_met");
  const totalSamples = observations.reduce((sum, item) => sum + item.sampleCount, 0); if (totalSamples < definition.minimumSampleCount) reasons.push("sample_count_not_met");
  const observedClasses = [...new Set(observations.map((item) => item.evidenceClass))];
  if (!definition.minimumEvidenceClasses.every((required) => observedClasses.includes(required))) reasons.push("required_evidence_class_missing");
  const productionEvidence = observations.some((item) => !item.synthetic && (item.evidenceClass === "production" || item.evidenceClass === "external" || item.evidenceClass === "owner_verified"));
  if (!productionEvidence) reasons.push("no_production_grade_outcome_evidence");
  const allSources = observations.flatMap((item) => item.sourceRefs); if (allSources.length === 0 || allSources.some((source) => !source.trim())) reasons.push("provenance_missing");
  const meanDelta = observations.length === 0 ? 0 : observations.reduce((sum, item) => sum + (item.candidateScore - item.baselineScore), 0) / observations.length;
  const rawConfidence = observations.length === 0 ? 0 : observations.reduce((sum, item) => sum + item.confidence, 0) / observations.length;
  const calibratedConfidence = rawConfidence * context.calibrationScore;
  if (calibratedConfidence < definition.minimumConfidence) reasons.push("confidence_below_threshold");
  const selfEvaluator = definition.ownerRef === context.candidateOwnerRef; if (selfEvaluator) reasons.push("self_evaluator_cannot_control_acceptance");
  const evidenceSufficient = reasons.filter((reason) => reason !== "self_evaluator_cannot_control_acceptance").length === 0;
  const decision: EvaluationDecision = !evidenceSufficient ? "insufficient_evidence" : Math.abs(meanDelta) < 1e-9 ? "equivalent" : meanDelta > 0 ? "better" : "worse";
  return Object.freeze({ evaluatorKey: definition.key, evaluatorVersion: definition.version, decision, calibratedConfidence, meanDelta, eligibleProductionEvidence: productionEvidence, acceptanceEligible: evidenceSufficient && !selfEvaluator, evidenceClasses: Object.freeze(observedClasses), reasonCodes: Object.freeze(reasons.length ? reasons : ["eligible_evidence_and_bounds_satisfied"]) });
}

export function validateActualOutcome(outcome: ActualOutcomeRecord): ActualOutcomeRecord {
  if (!outcome.id.trim() || !outcome.evaluationRunRef.trim() || !outcome.candidateRef.trim() || !outcome.metricKey.trim()) throw new Error("Outcome identity/run/candidate/metric are required");
  ts(outcome.observedAt, "Outcome observedAt"); if (!Number.isFinite(outcome.value)) throw new Error("Outcome value must be finite"); unique(outcome.sourceRefs, "Outcome sources", true); unique(outcome.confounders, "Outcome confounders");
  if (outcome.truth === "synthetic" && outcome.causalAttribution !== "none") throw new Error("Synthetic result cannot claim causal production outcome");
  if (outcome.causalAttribution === "supported" && (outcome.truth !== "verified" || outcome.confounders.length > 0)) throw new Error("Supported causality requires verified outcome with resolved confounders");
  return Object.freeze({ ...outcome, sourceRefs: Object.freeze([...outcome.sourceRefs]), confounders: Object.freeze([...outcome.confounders]) });
}
