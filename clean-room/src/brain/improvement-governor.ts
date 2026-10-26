import { evaluateCanary, type CanaryMetrics } from "../agency/rollout.js";
import { evaluateRestoreRevalidation, type RestoreRevalidationInput } from "../data/recovery.js";
import { parseTimestamp } from "../security/types.js";
import type { ImprovementProposal } from "./improvements.js";

export type ImprovementLifecycleStage =
  | "proposed"
  | "evidence_validated"
  | "scoped"
  | "risk_assessed"
  | "evaluated"
  | "baseline_locked"
  | "authorized"
  | "shadow"
  | "canary"
  | "verified"
  | "promoted"
  | "monitoring"
  | "rolled_back"
  | "lesson_recorded"
  | "rejected";

export type ImprovementRiskClass = "low" | "moderate" | "high" | "critical";

export interface ImprovementGovernancePlan {
  readonly proposalId: string;
  readonly applicabilityRefs: readonly string[];
  readonly requestedPermissionRefs: readonly string[];
  readonly minimumEffectConfidence: number;
  readonly maximumCanaryFraction: number;
  readonly rollbackCheckpointRef: string;
  readonly evidenceRefs: readonly string[];
}

export interface ImprovementEvaluationRecord {
  readonly evaluatorRef: string;
  readonly evaluatorVersion: number;
  readonly acceptanceEligible: boolean;
  readonly calibratedConfidence: number;
  readonly effectsCertain: boolean;
  readonly evidenceRefs: readonly string[];
  readonly evaluatedAt: string;
}

export interface ImprovementBaseline {
  readonly baselineRef: string;
  readonly acceptanceFingerprint: string;
  readonly lockedAt: string;
  readonly evidenceRefs: readonly string[];
}

export interface ImprovementAuthorization {
  readonly id: string;
  readonly proposalId: string;
  readonly issuerRef: string;
  readonly policyEpoch: number;
  readonly revocationEpoch: number;
  readonly permissionRefs: readonly string[];
  readonly maximumCanaryFraction: number;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly evidenceRefs: readonly string[];
}

export interface ImprovementIntelligenceSnapshot {
  readonly id: string;
  readonly proposalId: string;
  readonly capturedAt: string;
  readonly policyEpoch: number;
  readonly revocationEpoch: number;
  readonly exactVersionRefs: readonly string[];
  readonly learningRefs: readonly string[];
  readonly permissionRefs: readonly string[];
  readonly traceRef: string;
  readonly baselineRef: string;
  readonly acceptanceFingerprint: string;
  readonly rollbackCheckpointRef: string;
  readonly evidenceRefs: readonly string[];
}

export interface ImprovementMonitoringObservation {
  readonly id: string;
  readonly proposalId: string;
  readonly observedAt: string;
  readonly healthy: boolean;
  readonly effectConfidence: number;
  readonly permissionRefs: readonly string[];
  readonly acceptanceFingerprint: string;
  readonly evidenceRefs: readonly string[];
}

export interface ImprovementTransition {
  readonly proposalId: string;
  readonly version: number;
  readonly sequence: number;
  readonly from: ImprovementLifecycleStage | null;
  readonly to: ImprovementLifecycleStage;
  readonly occurredAt: string;
  readonly actorRef: string;
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
  readonly snapshotRef?: string;
  readonly authorizationRef?: string;
}

export interface ImprovementLifecycleView {
  readonly proposal: ImprovementProposal;
  readonly plan: ImprovementGovernancePlan;
  readonly stage: ImprovementLifecycleStage;
  readonly version: number;
  readonly riskClass?: ImprovementRiskClass;
  readonly evaluation?: ImprovementEvaluationRecord;
  readonly baseline?: ImprovementBaseline;
  readonly authorization?: ImprovementAuthorization;
  readonly snapshot?: ImprovementIntelligenceSnapshot;
  readonly transitions: readonly ImprovementTransition[];
  readonly monitoring: readonly ImprovementMonitoringObservation[];
}

export interface ImprovementCurrentAuthority {
  readonly policyEpoch: number;
  readonly revocationEpoch: number;
  readonly invalidatedLearningRefs: readonly string[];
  readonly revokedAuthorizationRefs: readonly string[];
  readonly now: string;
}

interface MutableLifecycle {
  proposal: ImprovementProposal;
  plan: ImprovementGovernancePlan;
  stage: ImprovementLifecycleStage;
  version: number;
  riskClass?: ImprovementRiskClass;
  evaluation?: ImprovementEvaluationRecord;
  baseline?: ImprovementBaseline;
  authorization?: ImprovementAuthorization;
  snapshot?: ImprovementIntelligenceSnapshot;
  transitions: ImprovementTransition[];
  monitoring: ImprovementMonitoringObservation[];
}

const ALLOWED: Readonly<Record<ImprovementLifecycleStage, readonly ImprovementLifecycleStage[]>> = Object.freeze({
  proposed: ["evidence_validated", "rejected"],
  evidence_validated: ["scoped", "rejected"],
  scoped: ["risk_assessed", "rejected"],
  risk_assessed: ["evaluated", "rejected"],
  evaluated: ["baseline_locked", "rejected"],
  baseline_locked: ["authorized", "rejected"],
  authorized: ["shadow", "rejected"],
  shadow: ["canary", "rolled_back", "rejected"],
  canary: ["verified", "rolled_back", "rejected"],
  verified: ["promoted", "rolled_back", "rejected"],
  promoted: ["monitoring", "rolled_back"],
  monitoring: ["monitoring", "rolled_back", "lesson_recorded"],
  rolled_back: ["lesson_recorded"],
  lesson_recorded: [],
  rejected: []
});

function score(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`);
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
}

function unique(values: readonly string[], label: string, requireOne = false): readonly string[] {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

function isSubset(values: readonly string[], allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return values.every((value) => allowedSet.has(value));
}

function freezePlan(plan: ImprovementGovernancePlan): ImprovementGovernancePlan {
  if (!plan.proposalId.trim() || !plan.rollbackCheckpointRef.trim()) throw new Error("Improvement plan identity/rollback checkpoint are required");
  score(plan.minimumEffectConfidence, "Minimum effect confidence"); score(plan.maximumCanaryFraction, "Maximum canary fraction");
  if (plan.maximumCanaryFraction <= 0) throw new Error("Maximum canary fraction must be greater than zero");
  return Object.freeze({
    ...plan,
    applicabilityRefs: unique(plan.applicabilityRefs, "Improvement applicability", true),
    requestedPermissionRefs: unique(plan.requestedPermissionRefs, "Improvement requested permissions"),
    evidenceRefs: unique(plan.evidenceRefs, "Improvement plan evidence", true)
  });
}

export function validateImprovementAuthorization(authorization: ImprovementAuthorization): ImprovementAuthorization {
  if (!authorization.id.trim() || !authorization.proposalId.trim() || !authorization.issuerRef.trim()) throw new Error("Improvement authorization identity/proposal/issuer are required");
  positiveInteger(authorization.policyEpoch, "Authorization policyEpoch"); positiveInteger(authorization.revocationEpoch, "Authorization revocationEpoch");
  score(authorization.maximumCanaryFraction, "Authorization maximum canary fraction");
  if (authorization.maximumCanaryFraction <= 0) throw new Error("Authorization maximum canary fraction must be greater than zero");
  const issued = parseTimestamp(authorization.issuedAt, "Improvement authorization issuedAt");
  const expires = parseTimestamp(authorization.expiresAt, "Improvement authorization expiresAt");
  if (expires <= issued) throw new Error("Improvement authorization expiry must follow issuance");
  if (authorization.revokedAt) parseTimestamp(authorization.revokedAt, "Improvement authorization revokedAt");
  return Object.freeze({ ...authorization, permissionRefs: unique(authorization.permissionRefs, "Improvement authorization permissions"), evidenceRefs: unique(authorization.evidenceRefs, "Improvement authorization evidence", true) });
}

export function validateImprovementSnapshot(snapshot: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority): ImprovementIntelligenceSnapshot {
  if (!snapshot.id.trim() || !snapshot.proposalId.trim() || !snapshot.traceRef.trim() || !snapshot.baselineRef.trim() || !snapshot.acceptanceFingerprint.trim() || !snapshot.rollbackCheckpointRef.trim()) throw new Error("Improvement intelligence snapshot is incomplete");
  parseTimestamp(snapshot.capturedAt, "Improvement snapshot capturedAt"); parseTimestamp(authority.now, "Improvement current authority now");
  positiveInteger(snapshot.policyEpoch, "Snapshot policyEpoch"); positiveInteger(snapshot.revocationEpoch, "Snapshot revocationEpoch");
  positiveInteger(authority.policyEpoch, "Current policyEpoch"); positiveInteger(authority.revocationEpoch, "Current revocationEpoch");
  if (snapshot.policyEpoch !== authority.policyEpoch) throw new Error("Improvement snapshot policy is stale");
  if (snapshot.revocationEpoch !== authority.revocationEpoch) throw new Error("Improvement snapshot revocation state is stale");
  const invalidated = new Set(authority.invalidatedLearningRefs);
  if (snapshot.learningRefs.some((ref) => invalidated.has(ref))) throw new Error("Improvement snapshot depends on invalidated learning");
  return Object.freeze({
    ...snapshot,
    exactVersionRefs: unique(snapshot.exactVersionRefs, "Improvement snapshot exact versions", true),
    learningRefs: unique(snapshot.learningRefs, "Improvement snapshot learning refs"),
    permissionRefs: unique(snapshot.permissionRefs, "Improvement snapshot permissions"),
    evidenceRefs: unique(snapshot.evidenceRefs, "Improvement snapshot evidence", true)
  });
}

export function assertImprovementRestoreCurrent(snapshot: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority, restore: RestoreRevalidationInput): void {
  validateImprovementSnapshot(snapshot, authority);
  const decision = evaluateRestoreRevalidation(restore);
  if (decision.status !== "active") throw new Error(`Improvement restore blocked: ${decision.reason}`);
  if (decision.currentPolicyEpoch !== snapshot.policyEpoch) throw new Error("Improvement restore policy epoch does not match snapshot");
}

export class SelfImprovementGovernor {
  readonly #records = new Map<string, MutableLifecycle>();

  register(proposal: ImprovementProposal, planInput: ImprovementGovernancePlan, actorRef: string, occurredAt: string): ImprovementLifecycleView {
    if (proposal.installsAutomatically !== false) throw new Error("Improvement proposals cannot self-install");
    if (!proposal.id.trim() || !actorRef.trim()) throw new Error("Improvement proposal/actor identity are required");
    if (this.#records.has(proposal.id)) throw new Error(`Improvement proposal already registered: ${proposal.id}`);
    parseTimestamp(occurredAt, "Improvement proposal occurredAt");
    const plan = freezePlan(planInput);
    if (plan.proposalId !== proposal.id) throw new Error("Improvement plan must target proposal");
    const transition: ImprovementTransition = Object.freeze({ proposalId: proposal.id, version: 1, sequence: 1, from: null, to: "proposed", occurredAt, actorRef, reason: "proposal_registered", evidenceRefs: unique([...proposal.evidenceRefs, ...plan.evidenceRefs], "Proposal registration evidence", true) });
    const record: MutableLifecycle = { proposal: Object.freeze({ ...proposal, evidenceRefs: Object.freeze([...proposal.evidenceRefs]) }), plan, stage: "proposed", version: 1, transitions: [transition], monitoring: [] };
    this.#records.set(proposal.id, record);
    return this.#view(record);
  }

  validateEvidence(proposalId: string, expectedVersion: number, evidenceRefs: readonly string[], actorRef: string, occurredAt: string): ImprovementLifecycleView {
    return this.#advance(proposalId, expectedVersion, "evidence_validated", actorRef, occurredAt, "evidence_validated", evidenceRefs);
  }

  confirmScope(proposalId: string, expectedVersion: number, applicabilityRefs: readonly string[], requestedPermissionRefs: readonly string[], actorRef: string, occurredAt: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId);
    const applicability = unique(applicabilityRefs, "Scoped applicability", true);
    const permissions = unique(requestedPermissionRefs, "Scoped permissions");
    if (applicability.some((ref) => !record.plan.applicabilityRefs.includes(ref))) throw new Error("Improvement scope expansion is not allowed");
    if (!isSubset(permissions, record.plan.requestedPermissionRefs)) throw new Error("Improvement permission expansion is not allowed");
    return this.#advance(proposalId, expectedVersion, "scoped", actorRef, occurredAt, "scope_confirmed", evidenceRefs);
  }

  assessRisk(proposalId: string, expectedVersion: number, riskClass: ImprovementRiskClass, actorRef: string, occurredAt: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId);
    this.#assertExpected(record, expectedVersion);
    record.riskClass = riskClass;
    return this.#advance(proposalId, expectedVersion, "risk_assessed", actorRef, occurredAt, `risk_${riskClass}`, evidenceRefs);
  }

  recordEvaluation(proposalId: string, expectedVersion: number, evaluationInput: ImprovementEvaluationRecord, actorRef: string): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    if (!evaluationInput.evaluatorRef.trim()) throw new Error("Improvement evaluation requires evaluator reference");
    if (!Number.isInteger(evaluationInput.evaluatorVersion) || evaluationInput.evaluatorVersion < 1) throw new Error("Improvement evaluator version must be positive");
    score(evaluationInput.calibratedConfidence, "Improvement calibrated confidence"); parseTimestamp(evaluationInput.evaluatedAt, "Improvement evaluatedAt");
    const evaluation = Object.freeze({ ...evaluationInput, evidenceRefs: unique(evaluationInput.evidenceRefs, "Improvement evaluation evidence", true) });
    record.evaluation = evaluation;
    return this.#advance(proposalId, expectedVersion, "evaluated", actorRef, evaluation.evaluatedAt, "evaluation_recorded", evaluation.evidenceRefs);
  }

  lockBaseline(proposalId: string, expectedVersion: number, baselineInput: ImprovementBaseline, actorRef: string): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    if (!baselineInput.baselineRef.trim() || !baselineInput.acceptanceFingerprint.trim()) throw new Error("Improvement baseline reference/fingerprint are required");
    parseTimestamp(baselineInput.lockedAt, "Improvement baseline lockedAt");
    const baseline = Object.freeze({ ...baselineInput, evidenceRefs: unique(baselineInput.evidenceRefs, "Improvement baseline evidence", true) });
    record.baseline = baseline;
    return this.#advance(proposalId, expectedVersion, "baseline_locked", actorRef, baseline.lockedAt, "baseline_locked", baseline.evidenceRefs);
  }

  authorize(proposalId: string, expectedVersion: number, authorizationInput: ImprovementAuthorization, snapshotInput: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority, actorRef: string): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    const baseline = this.#baseline(record); const authorization = validateImprovementAuthorization(authorizationInput);
    if (authorization.proposalId !== proposalId) throw new Error("Improvement authorization targets another proposal");
    if (authority.revokedAuthorizationRefs.includes(authorization.id) || authorization.revokedAt) throw new Error("Improvement authorization is revoked");
    const now = parseTimestamp(authority.now, "Improvement authorization now");
    if (now < parseTimestamp(authorization.issuedAt, "Improvement authorization issuedAt") || now >= parseTimestamp(authorization.expiresAt, "Improvement authorization expiresAt")) throw new Error("Improvement authorization is not currently valid");
    if (authorization.policyEpoch !== authority.policyEpoch || authorization.revocationEpoch !== authority.revocationEpoch) throw new Error("Improvement authorization authority state is stale");
    if (!isSubset(authorization.permissionRefs, record.plan.requestedPermissionRefs)) throw new Error("Improvement authorization expands permissions");
    if (authorization.maximumCanaryFraction > record.plan.maximumCanaryFraction) throw new Error("Improvement authorization expands canary scope");
    const snapshot = validateImprovementSnapshot(snapshotInput, authority);
    if (snapshot.proposalId !== proposalId || snapshot.baselineRef !== baseline.baselineRef || snapshot.acceptanceFingerprint !== baseline.acceptanceFingerprint) throw new Error("Improvement snapshot does not match locked baseline");
    if (!isSubset(snapshot.permissionRefs, authorization.permissionRefs)) throw new Error("Improvement snapshot expands authorized permissions");
    if (snapshot.rollbackCheckpointRef !== record.plan.rollbackCheckpointRef) throw new Error("Improvement snapshot rollback checkpoint mismatch");
    record.authorization = authorization; record.snapshot = snapshot;
    return this.#advance(proposalId, expectedVersion, "authorized", actorRef, authority.now, "explicit_authorization_recorded", [...authorization.evidenceRefs, ...snapshot.evidenceRefs], snapshot.id, authorization.id);
  }

  beginShadow(proposalId: string, expectedVersion: number, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertCurrentAuthority(record, authority);
    return this.#advance(proposalId, expectedVersion, "shadow", actorRef, authority.now, "shadow_rollout_started", evidenceRefs, record.snapshot?.id, record.authorization?.id);
  }

  beginCanary(proposalId: string, expectedVersion: number, fraction: number, stable: CanaryMetrics, candidate: CanaryMetrics, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion); this.#assertCurrentAuthority(record, authority);
    score(fraction, "Improvement canary fraction"); if (fraction <= 0) throw new Error("Improvement canary fraction must be greater than zero");
    const authorization = this.#authorization(record);
    if (fraction > record.plan.maximumCanaryFraction || fraction > authorization.maximumCanaryFraction) throw new Error("Improvement canary exceeds authorized limited rollout");
    const canary = evaluateCanary(stable, candidate, 0.02);
    if (!canary.promote) throw new Error(`Improvement canary failed closed: ${canary.reason}`);
    return this.#advance(proposalId, expectedVersion, "canary", actorRef, authority.now, "limited_canary_passed", evidenceRefs, record.snapshot?.id, authorization.id);
  }

  verify(proposalId: string, expectedVersion: number, observedAcceptanceFingerprint: string, effectConfidence: number, effectsCertain: boolean, evaluatorAcceptanceEligible: boolean, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion); this.#assertCurrentAuthority(record, authority);
    const baseline = this.#baseline(record); const evaluation = this.#evaluation(record);
    score(effectConfidence, "Improvement effect confidence");
    if (observedAcceptanceFingerprint !== baseline.acceptanceFingerprint) throw new Error("Improvement acceptance criteria were tampered with after baseline lock");
    if (!effectsCertain || !evaluation.effectsCertain) throw new Error("Improvement effects are uncertain");
    if (!evaluatorAcceptanceEligible || !evaluation.acceptanceEligible) throw new Error("Improvement evaluator evidence is not acceptance eligible");
    if (effectConfidence < record.plan.minimumEffectConfidence || evaluation.calibratedConfidence < record.plan.minimumEffectConfidence) throw new Error("Improvement effect confidence is below governed threshold");
    return this.#advance(proposalId, expectedVersion, "verified", actorRef, authority.now, "verification_passed", evidenceRefs, record.snapshot?.id, record.authorization?.id);
  }

  promote(proposalId: string, expectedVersion: number, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion); this.#assertCurrentAuthority(record, authority);
    this.#baseline(record); this.#evaluation(record); this.#authorization(record); this.#snapshot(record);
    return this.#advance(proposalId, expectedVersion, "promoted", actorRef, authority.now, "governed_promotion_recorded", evidenceRefs, record.snapshot?.id, record.authorization?.id);
  }

  monitor(proposalId: string, expectedVersion: number, observationInput: ImprovementMonitoringObservation, authority: ImprovementCurrentAuthority, actorRef: string): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion); this.#assertCurrentAuthority(record, authority);
    const baseline = this.#baseline(record); const authorization = this.#authorization(record);
    if (observationInput.proposalId !== proposalId || !observationInput.id.trim()) throw new Error("Improvement monitoring identity/proposal are required");
    parseTimestamp(observationInput.observedAt, "Improvement monitoring observedAt"); score(observationInput.effectConfidence, "Improvement monitoring effect confidence");
    if (observationInput.acceptanceFingerprint !== baseline.acceptanceFingerprint) throw new Error("Improvement monitoring detected acceptance tampering");
    const permissions = unique(observationInput.permissionRefs, "Improvement monitoring permissions");
    if (!isSubset(permissions, authorization.permissionRefs)) throw new Error("Improvement monitoring detected permission expansion");
    const observation = Object.freeze({ ...observationInput, permissionRefs: permissions, evidenceRefs: unique(observationInput.evidenceRefs, "Improvement monitoring evidence", true) });
    record.monitoring.push(observation);
    if (!observation.healthy || observation.effectConfidence < record.plan.minimumEffectConfidence) throw new Error("Improvement monitoring requires governed rollback");
    return this.#advance(proposalId, expectedVersion, "monitoring", actorRef, observation.observedAt, "monitoring_healthy", observation.evidenceRefs, record.snapshot?.id, authorization.id);
  }

  rollback(proposalId: string, expectedVersion: number, rollbackCheckpointRef: string, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    if (!["shadow", "canary", "verified", "promoted", "monitoring"].includes(record.stage)) throw new Error(`Improvement rollback is not valid from ${record.stage}`);
    this.#assertCurrentAuthority(record, authority);
    if (rollbackCheckpointRef !== record.plan.rollbackCheckpointRef) throw new Error("Improvement rollback checkpoint is not the governed known-good checkpoint");
    return this.#advance(proposalId, expectedVersion, "rolled_back", actorRef, authority.now, "governed_rollback_recorded", evidenceRefs, record.snapshot?.id, record.authorization?.id);
  }

  recordLesson(proposalId: string, expectedVersion: number, lessonRefs: readonly string[], actorRef: string, occurredAt: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    unique(lessonRefs, "Improvement lessons", true);
    return this.#advance(proposalId, expectedVersion, "lesson_recorded", actorRef, occurredAt, `lesson_recorded:${lessonRefs.join(",")}`, evidenceRefs, record.snapshot?.id, record.authorization?.id);
  }

  reject(proposalId: string, expectedVersion: number, actorRef: string, occurredAt: string, reason: string, evidenceRefs: readonly string[]): ImprovementLifecycleView {
    if (!reason.trim()) throw new Error("Improvement rejection reason is required");
    return this.#advance(proposalId, expectedVersion, "rejected", actorRef, occurredAt, reason, evidenceRefs);
  }

  restoreSnapshot(proposalId: string, expectedVersion: number, snapshot: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority, restore: RestoreRevalidationInput): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    if (snapshot.proposalId !== proposalId) throw new Error("Improvement restore snapshot targets another proposal");
    assertImprovementRestoreCurrent(snapshot, authority, restore);
    if (record.baseline && (snapshot.baselineRef !== record.baseline.baselineRef || snapshot.acceptanceFingerprint !== record.baseline.acceptanceFingerprint)) throw new Error("Improvement restore snapshot conflicts with current baseline");
    if (record.authorization && !isSubset(snapshot.permissionRefs, record.authorization.permissionRefs)) throw new Error("Improvement restore snapshot expands current authorization permissions");
    record.snapshot = validateImprovementSnapshot(snapshot, authority);
    return this.#view(record);
  }

  get(proposalId: string): ImprovementLifecycleView | undefined {
    const record = this.#records.get(proposalId); return record ? this.#view(record) : undefined;
  }

  #advance(proposalId: string, expectedVersion: number, to: ImprovementLifecycleStage, actorRef: string, occurredAt: string, reason: string, evidenceRefs: readonly string[], snapshotRef?: string, authorizationRef?: string): ImprovementLifecycleView {
    const record = this.#required(proposalId); this.#assertExpected(record, expectedVersion);
    if (!actorRef.trim() || !reason.trim()) throw new Error("Improvement transition actor/reason are required"); parseTimestamp(occurredAt, "Improvement transition occurredAt");
    if (!ALLOWED[record.stage].includes(to)) throw new Error(`Illegal improvement transition: ${record.stage} -> ${to}`);
    const version = record.version + 1;
    const transition: ImprovementTransition = Object.freeze({ proposalId, version, sequence: record.transitions.length + 1, from: record.stage, to, occurredAt, actorRef, reason, evidenceRefs: unique(evidenceRefs, "Improvement transition evidence", true), ...(snapshotRef !== undefined ? { snapshotRef } : {}), ...(authorizationRef !== undefined ? { authorizationRef } : {}) });
    record.stage = to; record.version = version; record.transitions.push(transition);
    return this.#view(record);
  }

  #assertCurrentAuthority(record: MutableLifecycle, authority: ImprovementCurrentAuthority): void {
    parseTimestamp(authority.now, "Improvement current authority now");
    const authorization = this.#authorization(record); const snapshot = this.#snapshot(record);
    if (authority.revokedAuthorizationRefs.includes(authorization.id) || authorization.revokedAt) throw new Error("Improvement authorization is revoked");
    if (authorization.policyEpoch !== authority.policyEpoch || authorization.revocationEpoch !== authority.revocationEpoch) throw new Error("Improvement authorization authority state is stale");
    const now = parseTimestamp(authority.now, "Improvement current authority now");
    if (now >= parseTimestamp(authorization.expiresAt, "Improvement authorization expiresAt")) throw new Error("Improvement authorization expired");
    validateImprovementSnapshot(snapshot, authority);
    if (!isSubset(snapshot.permissionRefs, authorization.permissionRefs)) throw new Error("Improvement snapshot expands authorized permissions");
    const invalidated = new Set(authority.invalidatedLearningRefs);
    if (snapshot.learningRefs.some((ref) => invalidated.has(ref))) throw new Error("Improvement lifecycle depends on invalidated learning");
  }

  #assertExpected(record: MutableLifecycle, expectedVersion: number): void {
    if (record.version !== expectedVersion) throw new Error(`Improvement lifecycle version mismatch: expected ${expectedVersion}, current ${record.version}`);
  }

  #required(proposalId: string): MutableLifecycle {
    const record = this.#records.get(proposalId); if (!record) throw new Error(`Unknown improvement proposal: ${proposalId}`); return record;
  }

  #authorization(record: MutableLifecycle): ImprovementAuthorization {
    if (!record.authorization) throw new Error("Improvement requires explicit authorization"); return record.authorization;
  }

  #snapshot(record: MutableLifecycle): ImprovementIntelligenceSnapshot {
    if (!record.snapshot) throw new Error("Improvement requires current intelligence snapshot"); return record.snapshot;
  }

  #baseline(record: MutableLifecycle): ImprovementBaseline {
    if (!record.baseline) throw new Error("Improvement requires locked baseline"); return record.baseline;
  }

  #evaluation(record: MutableLifecycle): ImprovementEvaluationRecord {
    if (!record.evaluation) throw new Error("Improvement requires evaluation"); return record.evaluation;
  }

  #view(record: MutableLifecycle): ImprovementLifecycleView {
    return Object.freeze({
      proposal: record.proposal,
      plan: record.plan,
      stage: record.stage,
      version: record.version,
      ...(record.riskClass !== undefined ? { riskClass: record.riskClass } : {}),
      ...(record.evaluation !== undefined ? { evaluation: record.evaluation } : {}),
      ...(record.baseline !== undefined ? { baseline: record.baseline } : {}),
      ...(record.authorization !== undefined ? { authorization: record.authorization } : {}),
      ...(record.snapshot !== undefined ? { snapshot: record.snapshot } : {}),
      transitions: Object.freeze([...record.transitions]),
      monitoring: Object.freeze([...record.monitoring])
    });
  }
}
