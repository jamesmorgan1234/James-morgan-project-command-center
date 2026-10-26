import { assertIdentifierKind } from "../kernel/identifiers.js";

export type EpistemicState =
  | "OWNER_STATED" | "VERIFIED" | "EXTERNALLY_CONFIRMED" | "CALCULATED" | "OBSERVED" | "STRONGLY_SUPPORTED"
  | "INFERRED" | "WEAK_INFERENCE" | "GENERATED" | "HYPOTHESIS" | "PREDICTION" | "ESTIMATE" | "RECOMMENDATION"
  | "ASSUMPTION" | "EXPERIMENTAL_FINDING" | "STALE" | "CONFLICTING" | "SUPERSEDED" | "DISPROVEN" | "UNKNOWN" | "NOT_APPLICABLE";

export interface EpistemicEvidenceContribution {
  readonly evidenceId: string;
  readonly sourceRef: string;
  readonly independenceGroup: string;
  readonly sourceConfidence: number;
  readonly transformationConfidence: number;
}

export interface EpistemicAssessment {
  readonly id: string;
  readonly claimId: string;
  readonly subjectId: string;
  readonly valueFingerprint: string;
  readonly state: EpistemicState;
  readonly authorityRank: number;
  readonly brainId?: string;
  readonly methodId?: string;
  readonly domainId?: string;
  readonly evidence: readonly EpistemicEvidenceContribution[];
  readonly calibrationScore: number;
  readonly confidence: number;
  readonly observedAt: string;
  readonly recordedAt: string;
  readonly staleAfter?: string;
  readonly applicabilityRefs: readonly string[];
  readonly supersedesAssessmentId?: string;
}

export interface EpistemicResolutionRequest {
  readonly subjectId: string;
  readonly applicabilityRefs: readonly string[];
  readonly now: string;
  readonly confidenceHalfLifeMs: number;
  readonly minimumConfidence: number;
  readonly highImpact: boolean;
}

export interface EpistemicResolution {
  readonly status: "resolved" | "abstain" | "unknown";
  readonly selected?: EpistemicAssessment;
  readonly confidence: number;
  readonly visibleAssessmentIds: readonly string[];
  readonly conflictingAssessmentIds: readonly string[];
  readonly reasons: readonly string[];
}

const TERMINAL_NONCURRENT = new Set<EpistemicState>(["STALE", "SUPERSEDED", "DISPROVEN", "NOT_APPLICABLE"]);
const UNCERTAIN = new Set<EpistemicState>(["INFERRED", "WEAK_INFERENCE", "GENERATED", "HYPOTHESIS", "PREDICTION", "ESTIMATE", "RECOMMENDATION", "ASSUMPTION", "EXPERIMENTAL_FINDING", "UNKNOWN", "CONFLICTING"]);

function score(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`);
}
function time(value: string, label: string): number {
  const parsed = Date.parse(value); if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp`); return parsed;
}
function unique(values: readonly string[], label: string): void {
  if (values.some((value) => !value.trim()) || new Set(values).size !== values.length) throw new Error(`${label} must be unique and nonblank`);
}

export function validateEpistemicAssessment(assessment: EpistemicAssessment): EpistemicAssessment {
  if (!assessment.id.trim() || !assessment.claimId.trim() || !assessment.subjectId.trim() || !assessment.valueFingerprint.trim()) throw new Error("Epistemic assessment identity/subject/value are required");
  if (!Number.isFinite(assessment.authorityRank) || assessment.authorityRank < 0) throw new Error("Epistemic authority rank must be non-negative");
  score(assessment.calibrationScore, "Epistemic calibration"); score(assessment.confidence, "Epistemic confidence");
  const observed = time(assessment.observedAt, "Epistemic observedAt"); const recorded = time(assessment.recordedAt, "Epistemic recordedAt");
  if (recorded < observed) throw new Error("Epistemic assessment cannot be recorded before observation");
  if (assessment.staleAfter !== undefined && time(assessment.staleAfter, "Epistemic staleAfter") <= observed) throw new Error("Epistemic staleAfter must follow observation");
  if (assessment.brainId !== undefined) assertIdentifierKind(assessment.brainId, "brain");
  if (assessment.methodId !== undefined) assertIdentifierKind(assessment.methodId, "method");
  if (assessment.domainId !== undefined) assertIdentifierKind(assessment.domainId, "domain");
  unique(assessment.applicabilityRefs, "Epistemic applicability refs");
  const groups = new Set<string>();
  for (const item of assessment.evidence) {
    assertIdentifierKind(item.evidenceId, "evidence");
    if (!item.sourceRef.trim() || !item.independenceGroup.trim()) throw new Error("Epistemic evidence source and independence group are required");
    score(item.sourceConfidence, "Source confidence"); score(item.transformationConfidence, "Transformation confidence"); groups.add(item.independenceGroup);
  }
  if ((assessment.state === "VERIFIED" || assessment.state === "EXTERNALLY_CONFIRMED" || assessment.state === "STRONGLY_SUPPORTED") && groups.size === 0) throw new Error("Strong epistemic states require evidence");
  if (UNCERTAIN.has(assessment.state) && assessment.confidence === 1) throw new Error("Uncertain epistemic states cannot claim certainty");
  return assessment;
}

function correlatedEvidenceConfidence(assessment: EpistemicAssessment): number {
  if (assessment.evidence.length === 0) return assessment.confidence * assessment.calibrationScore;
  const bestByGroup = new Map<string, number>();
  for (const item of assessment.evidence) {
    const contribution = item.sourceConfidence * item.transformationConfidence;
    bestByGroup.set(item.independenceGroup, Math.max(bestByGroup.get(item.independenceGroup) ?? 0, contribution));
  }
  let complement = 1;
  for (const contribution of bestByGroup.values()) complement *= (1 - contribution);
  return Math.min(1, assessment.confidence * assessment.calibrationScore * (1 - complement));
}

export function decayedEpistemicConfidence(assessment: EpistemicAssessment, now: string, halfLifeMs: number): number {
  if (!Number.isFinite(halfLifeMs) || halfLifeMs <= 0) throw new Error("Confidence half-life must be positive");
  const current = time(now, "Epistemic resolution time");
  const observed = time(assessment.observedAt, "Epistemic observedAt");
  const age = Math.max(0, current - observed);
  const stale = assessment.staleAfter !== undefined && current >= time(assessment.staleAfter, "Epistemic staleAfter");
  if (stale || TERMINAL_NONCURRENT.has(assessment.state)) return 0;
  return correlatedEvidenceConfidence(assessment) * Math.pow(0.5, age / halfLifeMs);
}

function applicable(assessment: EpistemicAssessment, required: readonly string[]): boolean {
  return required.every((ref) => assessment.applicabilityRefs.includes(ref));
}

export function resolveEpistemicAssessments(assessments: readonly EpistemicAssessment[], request: EpistemicResolutionRequest): EpistemicResolution {
  score(request.minimumConfidence, "Epistemic minimum confidence");
  const visible = assessments.filter((assessment) => assessment.subjectId === request.subjectId);
  const eligible = visible.filter((assessment) => applicable(assessment, request.applicabilityRefs) && !TERMINAL_NONCURRENT.has(assessment.state));
  if (eligible.length === 0) return Object.freeze({ status: "unknown", confidence: 0, visibleAssessmentIds: Object.freeze(visible.map((item) => item.id)), conflictingAssessmentIds: Object.freeze([]), reasons: Object.freeze(["no_current_applicable_assessment"]) });
  const scored = eligible.map((assessment) => ({ assessment, score: decayedEpistemicConfidence(assessment, request.now, request.confidenceHalfLifeMs) }))
    .sort((a, b) => b.assessment.authorityRank - a.assessment.authorityRank || b.score - a.score || Date.parse(b.assessment.observedAt) - Date.parse(a.assessment.observedAt));
  const top = scored[0]; if (!top) throw new Error("Epistemic resolution invariant failed");
  const sameAuthorityConflicts = scored.filter((item) => item.assessment.id !== top.assessment.id && item.assessment.authorityRank === top.assessment.authorityRank && item.assessment.valueFingerprint !== top.assessment.valueFingerprint && item.score >= Math.max(0.2, top.score * 0.75));
  const explicitConflicts = scored.filter((item) => item.assessment.state === "CONFLICTING" && item.assessment.valueFingerprint !== top.assessment.valueFingerprint);
  const conflicts = [...new Set([...sameAuthorityConflicts, ...explicitConflicts].map((item) => item.assessment.id))];
  const threshold = request.highImpact ? Math.max(request.minimumConfidence, 0.8) : request.minimumConfidence;
  if (conflicts.length > 0) return Object.freeze({ status: "abstain", confidence: top.score, visibleAssessmentIds: Object.freeze(visible.map((item) => item.id)), conflictingAssessmentIds: Object.freeze(conflicts), reasons: Object.freeze(["unresolved_material_disagreement"]) });
  if (top.score < threshold) return Object.freeze({ status: "abstain", confidence: top.score, visibleAssessmentIds: Object.freeze(visible.map((item) => item.id)), conflictingAssessmentIds: Object.freeze([]), reasons: Object.freeze(["confidence_below_threshold"]) });
  return Object.freeze({ status: "resolved", selected: top.assessment, confidence: top.score, visibleAssessmentIds: Object.freeze(visible.map((item) => item.id)), conflictingAssessmentIds: Object.freeze([]), reasons: Object.freeze(["highest_authority_supported_assessment"]) });
}
