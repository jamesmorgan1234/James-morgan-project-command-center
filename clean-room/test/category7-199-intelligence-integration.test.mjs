import test from "node:test";
import assert from "node:assert/strict";
import {
  AgencyExecutorRegistry,
  agencyIntelligenceReplayChoice,
  evaluateAgencyIntelligenceCanary,
  routeAgencyIntelligence,
  safeStealWithAgencyIntelligence,
  validateAgencyIntelligenceEvaluation,
  validateAgencyIntelligenceRecovery,
  validateAgencySpecialistDelegation
} from "../dist/agency/index.js";
import { SpecialistBrainRegistry } from "../dist/brain/index.js";
import { CapabilityMethodPortfolio } from "../dist/kernel/index.js";

const NOW = "2026-10-31T03:00:00.000Z";
const LATER = "2026-12-01T00:00:00.000Z";

function methodPortfolio() {
  const methods = new CapabilityMethodPortfolio();
  methods.register({
    key: "mth_research",
    version: 1,
    enabled: true,
    capabilityKey: "capability:research",
    implementationVersionRef: "implementation:research@1",
    lifecycle: "active",
    applicabilityScopeKeys: ["global"],
    contraindications: [],
    prerequisites: [],
    qualityScore: 0.94,
    calibrationScore: 0.91,
    latencyMs: 25,
    resourceClass: "low",
    costClass: "free",
    privacyClass: "local",
    maxDataSensitivity: "secret",
    securityAssurance: 0.95,
    reliabilityScore: 0.93,
    benchmarkEvidenceIds: ["evd_p7-method-benchmark"],
    outcomeEvidenceIds: ["evd_p7-method-outcome"],
    provenanceEvidenceIds: ["evd_p7-method-provenance"],
    fallbackMethodIds: [],
    rollbackEvidenceId: "evd_p7-method-rollback",
    revalidatedAt: NOW,
    revalidateAfter: LATER
  });
  return methods;
}

function specialist(key, overrides = {}) {
  const suffix = key.slice(4);
  return {
    key,
    version: 1,
    enabled: true,
    controlPlane: "command_center",
    domain: "research",
    subdomains: [],
    supportedCompanyIds: ["company:p7"],
    supportedProjectIds: ["project:p7"],
    supportedWorkClasses: ["research"],
    strengths: ["evidence-led research"],
    weaknesses: ["requires evidence"],
    capabilityKeys: ["capability:research"],
    methodIds: ["mth_research"],
    permissionKeys: ["repo:read"],
    protectedActionBoundaries: ["owner_approval"],
    dataClasses: ["internal"],
    toolKeys: ["tool:web"],
    providerKeys: ["pvd_local"],
    modelAssignments: [{ providerKey: "pvd_local", modelId: "local-reasoner", versionRef: "v1" }],
    dependencyVersionRefs: ["dependency:research@1"],
    calibrationScore: 0.92,
    evaluationEvidenceIds: [`evd_${suffix}-evaluation`],
    historicalAccuracy: 0.91,
    reliabilityScore: 0.94,
    latencyMs: 20,
    resourceClass: "low",
    costClass: "free",
    failureModes: ["provider_unavailable"],
    degradedModes: ["manual_review"],
    fallbackSpecialistIds: [],
    delegationTargets: [],
    learningEligibility: "promotion_candidate",
    experimentStatus: "stable",
    health: "healthy",
    lifecycle: "active",
    rollbackEvidenceId: `evd_${suffix}-rollback`,
    provenanceEvidenceIds: [`evd_${suffix}-provenance`],
    verificationState: "verified",
    revalidatedAt: NOW,
    revalidateAfter: LATER,
    ...overrides
  };
}

function routingFixture() {
  const executors = new AgencyExecutorRegistry();
  executors.register({
    key: "executor:research-free",
    version: 1,
    enabled: true,
    environments: ["normal_chat", "deterministic"],
    capabilities: ["research"],
    projectTypeKeys: ["software"],
    permissionScopes: ["repo:read"],
    costClass: "free",
    health: "available",
    verificationStrategy: "independent",
    maxRisk: "high"
  });
  executors.register({
    key: "executor:research-paid",
    version: 1,
    enabled: true,
    environments: ["normal_chat"],
    capabilities: ["research"],
    projectTypeKeys: ["software"],
    permissionScopes: ["repo:read"],
    costClass: "paid",
    health: "available",
    verificationStrategy: "independent",
    maxRisk: "high"
  });

  const specialists = new SpecialistBrainRegistry();
  specialists.registerModel(specialist("brn_parent", { delegationTargets: ["brn_child"] }), { actor: "command_center", evidenceIds: ["evd_parent-authority"] });
  specialists.registerModel(specialist("brn_child"), { actor: "command_center", evidenceIds: ["evd_child-authority"] });
  return { executors, methods: methodPortfolio(), specialists };
}

function routeRequest() {
  return {
    executor: { capability: "research", projectTypeKey: "software", environment: "normal_chat", risk: "medium", allowPaid: false },
    method: {
      capabilityKey: "capability:research",
      scopeKeys: ["global"],
      conditions: [],
      availablePrerequisites: [],
      allowPaid: false,
      maxPrivacy: "local",
      dataSensitivity: "internal",
      maxResourceClass: "low",
      allowExperimental: false,
      optimization: "balanced",
      now: NOW
    },
    specialistId: "brn_parent",
    companyId: "company:p7",
    projectId: "project:p7",
    workClasses: ["research"],
    dataClasses: ["internal"],
    permissionKeys: ["repo:read"]
  };
}

function admission(maxConcurrent = 2) {
  return { monetaryBudgetCents: 0, maxConcurrent, maxQueueDepth: 10, maxRetries: 2, maxRuntimeMs: 60000 };
}

function delegationEnvelope(childScopes = ["repo:read"]) {
  return {
    parentTaskId: "task:parent",
    childTaskId: "task:child",
    depth: 1,
    parentScopes: ["repo:read", "repo:write"],
    childScopes,
    capability: "research",
    controllingOrchestrator: "command-center",
    parentSubjectId: "subject:parent",
    childSubjectId: "subject:child",
    parentScope: { ownerId: "owner:p7", projectId: "project:p7", environment: "normal_chat" },
    childScope: { ownerId: "owner:p7", projectId: "project:p7", environment: "normal_chat" },
    parentAdmission: admission(2),
    childAdmission: admission(1),
    parentResourceLimits: { workers: 2, memory: 100 },
    childResourceLimits: { workers: 1, memory: 50 },
    policyVersion: "policy:p7@1",
    currentPolicyVersion: "policy:p7@1",
    issuedAt: "2026-10-31T02:55:00.000Z",
    expiresAt: "2026-10-31T04:00:00.000Z",
    revoked: false,
    evidenceRefs: ["evd_delegation"]
  };
}

function evaluator(ownerRef = "owner:evaluator") {
  return {
    key: "evaluator:p7-independent",
    version: 1,
    ownerRef,
    purpose: "Independent P7 intelligence evaluation",
    biasRisks: ["selection_bias"],
    requiredDataClasses: [],
    prohibitedDataClasses: [],
    applicableDomains: ["research"],
    applicableTaskClasses: ["research"],
    minimumEvidenceClasses: ["replay"],
    repeatCount: 1,
    minimumSampleCount: 1,
    minimumConfidence: 0.8,
    acceptanceAuthority: "command_center",
    calibrationEvidenceRefs: ["evd_evaluator-calibration"],
    active: true
  };
}

function snapshot(overrides = {}) {
  return {
    methodId: "mth_research",
    methodVersion: 1,
    specialistId: "brn_parent",
    specialistVersion: 1,
    evaluatorKey: "evaluator:p7-independent",
    evaluatorVersion: 1,
    stateFingerprint: "sha256:p7-stable-state",
    authorityScopes: ["repo:read", "repo:write"],
    evidenceRefs: ["evd_snapshot"],
    ...overrides
  };
}

test("P7.3/P7.7 Agency routing consumes canonical method/specialist evidence without bypassing executor or safe-steal rules", () => {
  const dependencies = routingFixture();
  const decision = routeAgencyIntelligence(routeRequest(), dependencies);
  assert.ok(decision);
  assert.deepEqual(decision.eligibleExecutors.map((item) => item.key), ["executor:research-free"]);
  assert.equal(decision.method.key, "mth_research");
  assert.equal(decision.specialist.key, "brn_parent");
  assert.ok(decision.evidenceRefs.length >= 7);
  assert.equal(decision.calibratedConfidence, 0.91);
  assert.equal(decision.reliabilityScore, 0.93);

  const candidate = {
    id: "task:p7",
    runId: "run:p7",
    projectId: "project:p7",
    title: "Research",
    state: "ready",
    dependencyIds: [],
    capability: "research",
    risk: "medium",
    preferredEnvironment: "normal_chat",
    evidenceRefs: ["evd_task"],
    idempotencyKey: "idem:p7",
    priority: 1,
    createdSequence: 1,
    affinityKeys: [],
    antiAffinityKeys: ["exclusive:research"]
  };
  assert.equal(safeStealWithAgencyIntelligence(candidate, ["research"], [], decision, "executor:research-free", "brn_parent"), true);
  assert.equal(safeStealWithAgencyIntelligence(candidate, ["research"], ["exclusive:research"], decision, "executor:research-free", "brn_parent"), false);
  assert.equal(safeStealWithAgencyIntelligence(candidate, ["research"], [], decision, "executor:research-paid", "brn_parent"), false);
  assert.equal(routeAgencyIntelligence({ ...routeRequest(), permissionKeys: ["repo:write"] }, dependencies), undefined);
  assert.equal(routeAgencyIntelligence({ ...routeRequest(), method: { ...routeRequest().method, capabilityKey: "capability:build" } }, dependencies), undefined);
});

test("P7.13/P7.15 specialist collaboration composes dynamically while delegated authority only narrows", () => {
  const parent = specialist("brn_parent", { permissionKeys: ["repo:read", "repo:write"], delegationTargets: ["brn_child"] });
  const child = specialist("brn_child", { permissionKeys: ["repo:read"] });
  const request = {
    envelope: delegationEnvelope(),
    parentSpecialist: parent,
    childSpecialist: child,
    childProjection: {
      specialistId: child.key,
      specialistVersion: child.version,
      projectId: "project:p7",
      workClasses: ["research"],
      dataClasses: ["internal"],
      capabilityKeys: ["capability:research"],
      permissionKeys: ["repo:read"]
    },
    maxDepth: 2,
    currentFanOut: 0,
    maxFanOut: 4,
    now: NOW
  };
  const decision = validateAgencySpecialistDelegation(request);
  assert.equal(decision.parentSpecialistId, "brn_parent");
  assert.equal(decision.childSpecialistId, "brn_child");
  assert.deepEqual(decision.permissionKeys, ["repo:read"]);

  const amplifiedChild = specialist("brn_child", { permissionKeys: ["repo:read", "admin:all"] });
  assert.throws(() => validateAgencySpecialistDelegation({
    ...request,
    envelope: delegationEnvelope(["repo:read", "admin:all"]),
    childSpecialist: amplifiedChild,
    childProjection: { ...request.childProjection, permissionKeys: ["admin:all"] }
  }), /amplify authority/);
});

test("P7.16 high-risk learning/transfer/improvement requires independent verifier and evaluator ownership", () => {
  const base = {
    purpose: "transfer",
    verification: { taskId: "task:p7-eval", executorId: "executor:research-free", verifierId: "verifier:p7", risk: "high", evidenceRefs: ["evd_verification"] },
    evaluator: evaluator(),
    candidateOwnerRef: "owner:candidate",
    executorOwnerRef: "owner:executor",
    verifierOwnerRef: "owner:verifier"
  };
  const decision = validateAgencyIntelligenceEvaluation(base);
  assert.equal(decision.independent, true);
  assert.equal(decision.evaluatorKey, "evaluator:p7-independent");
  assert.throws(() => validateAgencyIntelligenceEvaluation({ ...base, evaluator: evaluator("owner:candidate") }), /independent evaluator owner/);
  assert.throws(() => validateAgencyIntelligenceEvaluation({ ...base, verification: { ...base.verification, verifierId: "executor:research-free" } }), /independent verifier/);
});

test("P7.21/P7.22 intelligence snapshots are deterministic replay inputs and canary promotion stays behind existing safety gates", () => {
  const stable = snapshot();
  const candidate = snapshot({ methodVersion: 2, stateFingerprint: "sha256:p7-candidate-state", evidenceRefs: ["evd_candidate-snapshot"] });
  const replay = agencyIntelligenceReplayChoice(stable, 1, "a".repeat(64), "b".repeat(64));
  assert.equal(replay.kind, "policy");
  assert.match(replay.chosenValue, /mth_research@1/);
  assert.match(replay.chosenValue, /brn_parent@1/);
  assert.match(replay.chosenValue, /evaluator:p7-independent@1/);

  const stableMetrics = { successRate: 0.95, verificationFailureRate: 0.02, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 };
  const candidateMetrics = { successRate: 0.96, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 };
  assert.equal(evaluateAgencyIntelligenceCanary(stable, candidate, stableMetrics, candidateMetrics, ["evd_canary-evaluator"]).promote, true);
  assert.equal(evaluateAgencyIntelligenceCanary(stable, candidate, stableMetrics, { ...candidateMetrics, protectedBoundaryViolationCount: 1 }, ["evd_canary-evaluator"]).promote, false);
  assert.throws(() => evaluateAgencyIntelligenceCanary(stable, { ...candidate, authorityScopes: ["repo:read", "repo:write", "admin:all"] }, stableMetrics, candidateMetrics, ["evd_canary-evaluator"]), /amplify authority/);
  assert.throws(() => evaluateAgencyIntelligenceCanary(stable, candidate, stableMetrics, candidateMetrics, []), /evaluator evidence/);
});

test("P7.23/P7.24 recovery and adversarial stress preserve pinned intelligence and never amplify authority", () => {
  const previous = snapshot();
  const recovered = snapshot({ authorityScopes: ["repo:read"], evidenceRefs: ["evd_recovered"] });
  const decision = validateAgencyIntelligenceRecovery(previous, recovered);
  assert.equal(decision.compatible, true);
  assert.equal(decision.authorityNarrowed, true);

  for (let index = 0; index < 64; index += 1) {
    assert.throws(() => validateAgencyIntelligenceRecovery(previous, snapshot({ stateFingerprint: `sha256:drift-${index}` })), /incompatible/);
    assert.throws(() => validateAgencyIntelligenceRecovery(previous, snapshot({ authorityScopes: ["repo:read", "repo:write", `amplified:${index}`] })), /amplify authority/);
  }
});
