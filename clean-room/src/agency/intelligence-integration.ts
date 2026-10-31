import type { EvaluatorDefinition } from "../analytics/evaluators.js";
import { validateEvaluator } from "../analytics/evaluators.js";
import type { SpecialistModelContract, SpecialistProjectionRequest } from "../brain/specialists.js";
import { SpecialistBrainRegistry, validateSpecialistModel, validateSpecialistProjection } from "../brain/specialists.js";
import type { CapabilityMethodContract, MethodRoutingRequest } from "../kernel/method-portfolio.js";
import { CapabilityMethodPortfolio } from "../kernel/method-portfolio.js";
import type { ScheduledTask } from "./dag.js";
import { safeSteal } from "./dag.js";
import type { DelegatedAuthorityEnvelope } from "./delegation.js";
import { validateDelegatedAuthority } from "./delegation.js";
import type { AgencyExecutor } from "./registry.js";
import { AgencyExecutorRegistry } from "./registry.js";
import type { OrchestrationChoice } from "./replay.js";
import type { CanaryDecision, CanaryMetrics } from "./rollout.js";
import { evaluateCanary } from "./rollout.js";
import type { VerificationRequest } from "./verification.js";
import { validateIndependentVerification } from "./verification.js";

export type AgencyIntelligenceEvaluationPurpose = "routing" | "learning" | "transfer" | "improvement";

export interface AgencyIntelligenceRouteRequest {
  readonly executor: {
    readonly capability: string;
    readonly projectTypeKey: string;
    readonly environment: "normal_chat" | "work" | "deterministic";
    readonly risk: "low" | "medium" | "high" | "critical";
    readonly allowPaid: boolean;
  };
  readonly method: MethodRoutingRequest;
  readonly specialistId: string;
  readonly companyId?: string;
  readonly projectId?: string;
  readonly workClasses: readonly string[];
  readonly dataClasses: readonly string[];
  readonly permissionKeys: readonly string[];
}

export interface AgencyIntelligenceRouteDependencies {
  readonly executors: AgencyExecutorRegistry;
  readonly methods: CapabilityMethodPortfolio;
  readonly specialists: SpecialistBrainRegistry;
}

export interface AgencyIntelligenceRouteDecision {
  readonly eligibleExecutors: readonly AgencyExecutor[];
  readonly method: CapabilityMethodContract;
  readonly specialist: SpecialistModelContract;
  readonly evidenceRefs: readonly string[];
  readonly calibratedConfidence: number;
  readonly reliabilityScore: number;
}

export interface AgencySpecialistDelegationRequest {
  readonly envelope: DelegatedAuthorityEnvelope;
  readonly parentSpecialist: SpecialistModelContract;
  readonly childSpecialist: SpecialistModelContract;
  readonly childProjection: SpecialistProjectionRequest;
  readonly maxDepth: number;
  readonly currentFanOut: number;
  readonly maxFanOut: number;
  readonly now: string;
}

export interface AgencySpecialistDelegationDecision {
  readonly parentSpecialistId: string;
  readonly childSpecialistId: string;
  readonly capabilityKeys: readonly string[];
  readonly permissionKeys: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface AgencyIntelligenceEvaluationRequest {
  readonly purpose: AgencyIntelligenceEvaluationPurpose;
  readonly verification: VerificationRequest;
  readonly evaluator: EvaluatorDefinition;
  readonly candidateOwnerRef: string;
  readonly executorOwnerRef: string;
  readonly verifierOwnerRef: string;
}

export interface AgencyIntelligenceEvaluationDecision {
  readonly evaluatorKey: string;
  readonly evaluatorVersion: number;
  readonly independent: true;
  readonly evidenceRefs: readonly string[];
}

export interface AgencyIntelligenceSnapshot {
  readonly methodId: string;
  readonly methodVersion: number;
  readonly specialistId: string;
  readonly specialistVersion: number;
  readonly evaluatorKey?: string;
  readonly evaluatorVersion?: number;
  readonly stateFingerprint: string;
  readonly authorityScopes: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface AgencyIntelligenceRecoveryDecision {
  readonly compatible: true;
  readonly authorityNarrowed: true;
  readonly evidenceRefs: readonly string[];
}

function uniqueNonBlank(values: readonly string[], label: string, requireOne = false): readonly string[] {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => value.length === 0)) throw new Error(`${label} cannot contain blank values`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique`);
  return Object.freeze([...normalized]);
}

function positiveVersion(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
}

function subset(values: readonly string[], allowed: readonly string[], label: string): void {
  const outside = values.filter((value) => !allowed.includes(value));
  if (outside.length > 0) throw new Error(`${label} would amplify authority: ${outside.join(",")}`);
}

function canonicalCapability(executorCapability: string): string {
  return executorCapability.startsWith("capability:") ? executorCapability : `capability:${executorCapability}`;
}

function evidenceFor(method: CapabilityMethodContract, specialist: SpecialistModelContract): readonly string[] {
  return uniqueNonBlank(
    [
      ...method.benchmarkEvidenceIds,
      ...method.outcomeEvidenceIds,
      ...method.provenanceEvidenceIds,
      method.rollbackEvidenceId,
      ...specialist.evaluationEvidenceIds,
      ...specialist.provenanceEvidenceIds,
      specialist.rollbackEvidenceId
    ],
    "Agency intelligence routing evidence",
    true
  );
}

function specialistProjection(request: AgencyIntelligenceRouteRequest, specialist: SpecialistModelContract, method: CapabilityMethodContract): SpecialistProjectionRequest {
  return {
    specialistId: specialist.key,
    specialistVersion: specialist.version,
    ...(request.companyId === undefined ? {} : { companyId: request.companyId }),
    ...(request.projectId === undefined ? {} : { projectId: request.projectId }),
    workClasses: request.workClasses,
    dataClasses: request.dataClasses,
    capabilityKeys: [method.capabilityKey],
    permissionKeys: request.permissionKeys
  };
}

/** P7.3/P7.7: canonical method/specialist intelligence narrows, but never bypasses, Agency executor eligibility. */
export function routeAgencyIntelligence(
  request: AgencyIntelligenceRouteRequest,
  dependencies: AgencyIntelligenceRouteDependencies
): AgencyIntelligenceRouteDecision | undefined {
  const capabilityKey = canonicalCapability(request.executor.capability);
  if (request.method.capabilityKey !== capabilityKey) return undefined;

  const eligibleExecutors = dependencies.executors.eligible(request.executor)
    .filter((executor) => request.permissionKeys.every((permission) => executor.permissionScopes.includes(permission)));
  if (eligibleExecutors.length === 0) return undefined;

  const method = dependencies.methods.route(request.method);
  if (!method || method.capabilityKey !== capabilityKey) return undefined;

  const specialist = dependencies.specialists.getModel(request.specialistId);
  if (!specialist || !specialist.enabled || specialist.lifecycle !== "active" || specialist.health === "unavailable") return undefined;
  if (!specialist.capabilityKeys.includes(method.capabilityKey) || !specialist.methodIds.includes(method.key)) return undefined;
  if (!request.executor.allowPaid && specialist.costClass === "paid") return undefined;
  if (Date.parse(request.method.now) > Date.parse(specialist.revalidateAfter)) return undefined;

  try {
    dependencies.specialists.validateProjection(specialistProjection(request, specialist, method));
  } catch {
    return undefined;
  }

  const evidenceRefs = evidenceFor(method, specialist);
  const calibratedConfidence = Math.min(method.calibrationScore, specialist.calibrationScore);
  const reliabilityScore = Math.min(method.reliabilityScore, specialist.reliabilityScore);
  return Object.freeze({
    eligibleExecutors: Object.freeze([...eligibleExecutors]),
    method,
    specialist,
    evidenceRefs,
    calibratedConfidence,
    reliabilityScore
  });
}

/** P7.7: work stealing remains subject to the historical DAG capability/anti-affinity guard and the current intelligence route. */
export function safeStealWithAgencyIntelligence(
  candidate: ScheduledTask,
  workerCapabilities: readonly string[],
  heldAntiAffinity: readonly string[],
  decision: AgencyIntelligenceRouteDecision,
  workerExecutorKey: string,
  workerSpecialistId: string
): boolean {
  if (!safeSteal(candidate, workerCapabilities, heldAntiAffinity)) return false;
  if (!decision.eligibleExecutors.some((executor) => executor.key === workerExecutorKey)) return false;
  if (decision.specialist.key !== workerSpecialistId) return false;
  return decision.specialist.capabilityKeys.includes(canonicalCapability(candidate.capability));
}

/** P7.13/P7.15: specialist composition is valid only when delegated authority and the canonical specialist projection both narrow. */
export function validateAgencySpecialistDelegation(request: AgencySpecialistDelegationRequest): AgencySpecialistDelegationDecision {
  validateDelegatedAuthority(request.envelope, request.maxDepth, request.currentFanOut, request.maxFanOut, request.now);
  validateSpecialistModel(request.parentSpecialist);
  validateSpecialistModel(request.childSpecialist);
  validateSpecialistProjection(request.childSpecialist, request.childProjection);

  if (request.childProjection.specialistId !== request.childSpecialist.key || request.childProjection.specialistVersion !== request.childSpecialist.version) {
    throw new Error("Delegated specialist projection must pin the exact child specialist identity/version");
  }
  if (!request.parentSpecialist.delegationTargets.includes(request.childSpecialist.key)) {
    throw new Error("Parent specialist has not authorized this specialist delegation target");
  }
  subset(request.childProjection.capabilityKeys, request.parentSpecialist.capabilityKeys, "Delegated specialist capabilities");
  subset(request.childProjection.permissionKeys, request.parentSpecialist.permissionKeys, "Delegated specialist permissions");
  subset(request.childProjection.permissionKeys, request.envelope.childScopes, "Delegated specialist permission scopes");

  const evidenceRefs = uniqueNonBlank(
    [
      ...request.envelope.evidenceRefs,
      ...request.parentSpecialist.provenanceEvidenceIds,
      ...request.childSpecialist.provenanceEvidenceIds,
      ...request.childSpecialist.evaluationEvidenceIds
    ],
    "Delegated specialist evidence",
    true
  );
  return Object.freeze({
    parentSpecialistId: request.parentSpecialist.key,
    childSpecialistId: request.childSpecialist.key,
    capabilityKeys: Object.freeze([...request.childProjection.capabilityKeys]),
    permissionKeys: Object.freeze([...request.childProjection.permissionKeys]),
    evidenceRefs
  });
}

/** P7.16: high-risk learning/transfer/improvement requires an evaluator independent of candidate, executor and verifier ownership. */
export function validateAgencyIntelligenceEvaluation(request: AgencyIntelligenceEvaluationRequest): AgencyIntelligenceEvaluationDecision {
  validateIndependentVerification(request.verification);
  validateEvaluator(request.evaluator);
  if (!request.evaluator.active) throw new Error("Agency intelligence evaluation requires an active evaluator");
  if (!request.candidateOwnerRef.trim() || !request.executorOwnerRef.trim() || !request.verifierOwnerRef.trim()) throw new Error("Agency intelligence evaluation ownership identities are required");

  const highRisk = request.verification.risk === "high" || request.verification.risk === "critical";
  const independenceRequired = request.purpose === "learning" || request.purpose === "transfer" || request.purpose === "improvement";
  if (highRisk && independenceRequired) {
    const prohibitedOwners = new Set([request.candidateOwnerRef, request.executorOwnerRef, request.verifierOwnerRef]);
    if (prohibitedOwners.has(request.evaluator.ownerRef)) throw new Error("High-risk intelligence evaluation requires an independent evaluator owner");
  }

  const evidenceRefs = uniqueNonBlank(
    [...request.verification.evidenceRefs, ...request.evaluator.calibrationEvidenceRefs],
    "Agency intelligence evaluation evidence",
    true
  );
  return Object.freeze({ evaluatorKey: request.evaluator.key, evaluatorVersion: request.evaluator.version, independent: true, evidenceRefs });
}

export function validateAgencyIntelligenceSnapshot(snapshot: AgencyIntelligenceSnapshot): AgencyIntelligenceSnapshot {
  if (!snapshot.methodId.trim() || !snapshot.specialistId.trim() || !snapshot.stateFingerprint.trim()) throw new Error("Agency intelligence snapshot method/specialist/fingerprint are required");
  positiveVersion(snapshot.methodVersion, "Agency intelligence methodVersion");
  positiveVersion(snapshot.specialistVersion, "Agency intelligence specialistVersion");
  const hasEvaluatorKey = snapshot.evaluatorKey !== undefined;
  const hasEvaluatorVersion = snapshot.evaluatorVersion !== undefined;
  if (hasEvaluatorKey !== hasEvaluatorVersion) throw new Error("Agency intelligence evaluator identity/version must be pinned together");
  if (snapshot.evaluatorKey !== undefined && !snapshot.evaluatorKey.trim()) throw new Error("Agency intelligence evaluatorKey cannot be blank");
  if (snapshot.evaluatorVersion !== undefined) positiveVersion(snapshot.evaluatorVersion, "Agency intelligence evaluatorVersion");
  uniqueNonBlank(snapshot.authorityScopes, "Agency intelligence authority scopes");
  uniqueNonBlank(snapshot.evidenceRefs, "Agency intelligence snapshot evidence", true);
  return snapshot;
}

function replayValue(snapshot: AgencyIntelligenceSnapshot): string {
  const evaluator = snapshot.evaluatorKey === undefined ? "none" : `${snapshot.evaluatorKey}@${snapshot.evaluatorVersion}`;
  return [
    `method=${snapshot.methodId}@${snapshot.methodVersion}`,
    `specialist=${snapshot.specialistId}@${snapshot.specialistVersion}`,
    `evaluator=${evaluator}`,
    `state=${snapshot.stateFingerprint}`,
    `authority=${[...snapshot.authorityScopes].sort().join(",")}`
  ].join("|");
}

/** P7.21: intelligence choices become deterministic replay inputs without creating a second replay engine. */
export function agencyIntelligenceReplayChoice(
  snapshot: AgencyIntelligenceSnapshot,
  sequence: number,
  inputHash: string,
  outputHash: string
): OrchestrationChoice {
  validateAgencyIntelligenceSnapshot(snapshot);
  positiveVersion(sequence, "Replay sequence");
  if (!inputHash.trim() || !outputHash.trim()) throw new Error("Replay choice requires input/output hash");
  return Object.freeze({ sequence, kind: "policy", inputHash, outputHash, chosenValue: replayValue(snapshot) });
}

function samePinnedIntelligence(left: AgencyIntelligenceSnapshot, right: AgencyIntelligenceSnapshot): boolean {
  return left.methodId === right.methodId
    && left.methodVersion === right.methodVersion
    && left.specialistId === right.specialistId
    && left.specialistVersion === right.specialistVersion
    && left.evaluatorKey === right.evaluatorKey
    && left.evaluatorVersion === right.evaluatorVersion
    && left.stateFingerprint === right.stateFingerprint;
}

/** P7.22: routing/method/specialist/improvement canaries reuse the historical safety gate and require evaluator evidence. */
export function evaluateAgencyIntelligenceCanary(
  stableSnapshot: AgencyIntelligenceSnapshot,
  candidateSnapshot: AgencyIntelligenceSnapshot,
  stableMetrics: CanaryMetrics,
  candidateMetrics: CanaryMetrics,
  evaluatorEvidenceRefs: readonly string[],
  maxSuccessRegression = 0.02
): CanaryDecision {
  validateAgencyIntelligenceSnapshot(stableSnapshot);
  validateAgencyIntelligenceSnapshot(candidateSnapshot);
  uniqueNonBlank(evaluatorEvidenceRefs, "Agency intelligence canary evaluator evidence", true);
  subset(candidateSnapshot.authorityScopes, stableSnapshot.authorityScopes, "Canary candidate authority scopes");
  if (samePinnedIntelligence(stableSnapshot, candidateSnapshot)) throw new Error("Agency intelligence canary requires a distinct candidate state");
  return evaluateCanary(stableMetrics, candidateMetrics, maxSuccessRegression);
}

/** P7.23: recovery fails closed on intelligence-state drift and may only preserve or narrow authority. */
export function validateAgencyIntelligenceRecovery(
  previous: AgencyIntelligenceSnapshot,
  recovered: AgencyIntelligenceSnapshot
): AgencyIntelligenceRecoveryDecision {
  validateAgencyIntelligenceSnapshot(previous);
  validateAgencyIntelligenceSnapshot(recovered);
  if (!samePinnedIntelligence(previous, recovered)) throw new Error("Recovered Agency intelligence state is incompatible with the checkpoint");
  subset(recovered.authorityScopes, previous.authorityScopes, "Recovered Agency authority scopes");
  const evidenceRefs = uniqueNonBlank([...previous.evidenceRefs, ...recovered.evidenceRefs], "Agency intelligence recovery evidence", true);
  return Object.freeze({ compatible: true, authorityNarrowed: true, evidenceRefs });
}
