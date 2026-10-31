import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AiRouteRegistry,
  SpecialistBrainRegistry,
  createImprovementProposal,
  projectGovernedCrossBrainLearning,
  routeBrainIntelligence,
  validateScenarioAnalysis
} from "../dist/brain/index.js";
import { CapabilityMethodPortfolio } from "../dist/kernel/index.js";
import { assessTransfer } from "../dist/analytics/index.js";

const memorySource = readFileSync(new URL("../src/brain/memory.ts", import.meta.url), "utf8");
const contextSource = readFileSync(new URL("../src/brain/context-builder.ts", import.meta.url), "utf8");
const evaluatorSource = readFileSync(new URL("../src/analytics/evaluators.ts", import.meta.url), "utf8");

const NOW = "2026-10-31T00:00:00.000Z";
const LATER = "2026-12-01T00:00:00.000Z";

function specialist(key, overrides = {}) {
  return {
    key,
    version: 1,
    enabled: true,
    controlPlane: "command_center",
    domain: "research",
    subdomains: [],
    supportedCompanyIds: [],
    supportedProjectIds: [],
    supportedWorkClasses: ["research"],
    strengths: ["evidence-led research"],
    weaknesses: ["requires evidence"],
    capabilityKeys: ["capability:research"],
    methodIds: ["mth_research"],
    permissionKeys: [],
    protectedActionBoundaries: ["owner_approval"],
    dataClasses: ["internal"],
    toolKeys: ["tool:web"],
    providerKeys: ["pvd_local"],
    modelAssignments: [{ providerKey: "pvd_local", modelId: "local-reasoner", versionRef: "v1", routeKey: "ai-route:local" }],
    dependencyVersionRefs: ["dependency:research@1"],
    calibrationScore: 0.9,
    evaluationEvidenceIds: [`evd_${key.slice(4)}-evaluation`],
    historicalAccuracy: 0.9,
    reliabilityScore: 0.9,
    latencyMs: 10,
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
    rollbackEvidenceId: `evd_${key.slice(4)}-rollback`,
    provenanceEvidenceIds: [`evd_${key.slice(4)}-provenance`],
    verificationState: "verified",
    revalidatedAt: NOW,
    revalidateAfter: LATER,
    ...overrides
  };
}

function registerRoutingFixture() {
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
    qualityScore: 0.9,
    calibrationScore: 0.9,
    latencyMs: 10,
    resourceClass: "low",
    costClass: "free",
    privacyClass: "local",
    maxDataSensitivity: "secret",
    securityAssurance: 0.9,
    reliabilityScore: 0.9,
    benchmarkEvidenceIds: ["evd_method-benchmark"],
    outcomeEvidenceIds: ["evd_method-outcome"],
    provenanceEvidenceIds: ["evd_method-provenance"],
    fallbackMethodIds: [],
    rollbackEvidenceId: "evd_method-rollback",
    revalidatedAt: NOW,
    revalidateAfter: LATER
  });

  const specialists = new SpecialistBrainRegistry();
  specialists.registerModel(specialist("brn_source"), { actor: "command_center", evidenceIds: ["evd_control-authority"] });

  const routes = new AiRouteRegistry();
  routes.register({
    key: "ai-route:local",
    providerKey: "pvd_local",
    modelId: "local-reasoner",
    versionRef: "v1",
    executionMode: "local",
    enabled: true,
    capabilities: ["reason"],
    cost: "free",
    privacy: "local",
    health: "available",
    qualityRank: 10,
    latencyRank: 1,
    quotaAvailable: true,
    contextWindowTokens: 32768,
    brainKeys: ["brn_source"],
    methodIds: ["mth_research"],
    toolKeys: ["tool:web"],
    policyRefs: ["policy:p6-routing"],
    evidenceRefs: ["evd_route-evidence"],
    calibrationScore: 0.9
  });
  return { methods, specialists, routes };
}

function routingRequest(minimumCalibration = 0.8) {
  return {
    brainId: "brn_source",
    capabilityKey: "capability:research",
    aiCapability: "reason",
    toolKey: "tool:web",
    requiredPolicyRefs: ["policy:p6-routing"],
    minimumCalibration,
    method: {
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
    ai: { allowPaid: false, maxPrivacy: "local", preferQuality: true, minimumContextTokens: 8192 }
  };
}

test("P6.2 composes Brain, method, tool, provider/model, policy, evidence and calibration without a competing registry", () => {
  const dependencies = registerRoutingFixture();
  const decision = routeBrainIntelligence(routingRequest(), dependencies);
  assert.equal(decision?.brain.key, "brn_source");
  assert.equal(decision?.method.key, "mth_research");
  assert.equal(decision?.route.key, "ai-route:local");
  assert.equal(decision?.toolKey, "tool:web");
  assert.deepEqual(decision?.policyRefs, ["policy:p6-routing"]);
  assert.ok((decision?.evidenceRefs.length ?? 0) >= 6);
  assert.equal(decision?.calibratedConfidence, 0.9);

  assert.equal(routeBrainIntelligence(routingRequest(0.95), dependencies), undefined);
  assert.equal(routeBrainIntelligence({ ...routingRequest(), toolKey: "tool:unauthorized" }, dependencies), undefined);
});

test("P6.3 and P6.4 preserve layered memory, negative/quarantined knowledge, freshness and Context Compiler omissions", () => {
  assert.match(memorySource, /"procedural"/);
  assert.match(memorySource, /"negative"/);
  assert.match(memorySource, /"quarantined"/);
  assert.match(memorySource, /revalidateAfter/);
  assert.match(memorySource, /invalidatedAt/);
  assert.match(contextSource, /compileLayeredBrainContext/);
  assert.match(contextSource, /dependencyRefs/);
  assert.match(contextSource, /methodRefs/);
  assert.match(contextSource, /permissionRefs/);
  assert.match(contextSource, /omitted/);
});

test("P6.5 keeps observed facts, assumptions, simulations, counterfactuals and causal claims explicitly separated", () => {
  const valid = validateScenarioAnalysis({
    id: "scenario:decision",
    objective: "Compare a bounded decision",
    statements: [
      { id: "observed", class: "observed_fact", statement: "Observed baseline", evidenceRefs: ["evd_observed"] },
      { id: "assumption", class: "assumption", statement: "Demand remains stable", evidenceRefs: [], confidence: 0.6 },
      { id: "simulation", class: "simulation", statement: "Simulated improvement", evidenceRefs: [], confidence: 0.7, assumptions: ["Demand stable"], sensitivity: [{ variable: "demand", direction: "increase", magnitude: 0.2 }] },
      { id: "counterfactual", class: "counterfactual", statement: "Without change", evidenceRefs: [], confidence: 0.5, assumptions: ["No intervention"], sensitivity: [{ variable: "intervention", direction: "decrease" }] },
      { id: "causal", class: "causal_claim", statement: "Intervention caused change", evidenceRefs: ["evd_causal"], confidence: 0.8, causalBasisRefs: ["evd_causal-basis"] }
    ]
  });
  assert.equal(valid.statements.length, 5);
  assert.throws(() => validateScenarioAnalysis({ id: "scenario:bad", objective: "Bad simulation", statements: [{ id: "simulation", class: "simulation", statement: "Synthetic result", evidenceRefs: [], confidence: 0.7, assumptions: ["Assumption"] }] }), /sensitivity analysis/);
  assert.throws(() => validateScenarioAnalysis({ id: "scenario:bad-causal", objective: "Bad causal claim", statements: [{ id: "causal", class: "causal_claim", statement: "Cause", evidenceRefs: [], confidence: 0.8, causalBasisRefs: [] }] }), /Scenario evidence|causal basis/);
});

test("P6.6 cross-Brain learning requires validated scoped promotion and eligible transfer and remains non-executable", () => {
  const source = specialist("brn_source");
  const target = specialist("brn_target");
  const packet = {
    id: "lrn_research-pattern",
    version: 1,
    sourceBrainId: source.key,
    sourceMethodId: "mth_research",
    sourceCapabilityKey: "capability:research",
    taskClass: "research",
    validationState: "validated",
    evidenceIds: ["evd_packet"],
    provenanceEvidenceIds: ["evd_packet-provenance"]
  };
  const promotion = {
    id: "prm_research-pattern",
    version: 1,
    packetId: packet.id,
    packetVersion: packet.version,
    lifecycle: "promoted",
    applicability: { scope: "brain", ref: target.key },
    evidenceIds: ["evd_promotion"],
    executablePolicy: false
  };
  const transfer = {
    id: "transfer:research-pattern",
    version: 1,
    sourceRef: `${packet.id}@${packet.version}`,
    decision: "eligible",
    evidenceRefs: ["evd_transfer"],
    applicabilityEvidenceRefs: ["evd_transfer-applicability"],
    evaluatorEvidenceRefs: ["evd_transfer-evaluator"]
  };
  const projection = projectGovernedCrossBrainLearning({ source, target, packet, promotion, transfer });
  assert.equal(projection.sourceBrainId, source.key);
  assert.equal(projection.targetBrainId, target.key);
  assert.equal(projection.executablePolicy, false);
  assert.ok(projection.evidenceRefs.length >= 6);
  assert.throws(() => projectGovernedCrossBrainLearning({ source, target, packet, promotion: { ...promotion, applicability: { scope: "brain", ref: "brn_other" } }, transfer }), /target Brain/);
});

test("P6.13 recommendations remain proposals and never self-install", () => {
  const proposal = createImprovementProposal({ id: "improvement:p6", area: "quality", title: "Improve routing evaluation", evidenceRefs: ["evd_improvement"], confidence: 0.8 });
  assert.equal(proposal.installsAutomatically, false);
});

test("P6.15 calibration, independent evaluation evidence and transferability fail closed", () => {
  const transfer = assessTransfer({
    id: "transfer:similarity-only",
    version: 1,
    sourceRef: "lrn_similarity@1",
    sourceRegime: { domain: "research" },
    targetRegime: { domain: "research" },
    similarityEvidenceRefs: ["evd_similarity"],
    applicabilityEvidenceRefs: [],
    evaluatorEvidenceRefs: [],
    negativeKnowledgeRefs: [],
    alternativeRefs: [],
    evidenceRefs: ["evd_transfer-proof"],
    decidedAt: NOW,
    expiresAt: LATER
  }, [], NOW);
  assert.equal(transfer.decision, "rejected");
  assert.ok(transfer.reasonCodes.includes("similarity_alone_insufficient"));
  assert.ok(transfer.reasonCodes.includes("evaluator_evidence_missing"));
  assert.match(evaluatorSource, /Duplicate evaluator run\/repeat/);
  assert.match(evaluatorSource, /self_evaluator_cannot_control_acceptance/);
  assert.match(evaluatorSource, /no_production_grade_outcome_evidence/);
});
