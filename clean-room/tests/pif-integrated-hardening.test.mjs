import test from "node:test";
import assert from "node:assert/strict";
import {
  SHARED_INTELLIGENCE_CONTRACT_VERSION,
  SHARED_INTELLIGENCE_ONTOLOGY_ID,
  SHARED_INTELLIGENCE_ONTOLOGY_VERSION,
  known,
  validateSharedIntelligenceEnvelope,
  LearningPromotionGovernor
} from "../dist/data/index.js";
import { CapabilityMethodPortfolio } from "../dist/kernel/index.js";
import {
  SpecialistBrainRegistry,
  compileBrainScopedLayeredContext,
  GovernedIntelligenceTraceFabric,
  createImprovementProposal,
  SelfImprovementGovernor,
  assertImprovementRestoreCurrent
} from "../dist/brain/index.js";
import { resolveEpistemicAssessments, evaluateCandidate, assessTransfer } from "../dist/analytics/index.js";

const OWNER = "owner-1";
const PROJECT = "prj_book-one";
const COMPANY = "cmp_books";
const BRAIN = "brn_books";
const METHOD = "mth_book-editing";
const NOW = "2026-10-26T08:00:00Z";
const LATER = "2026-11-26T08:00:00Z";
const READY = { epistemicsReady: true, evaluatorReady: true, negativeKnowledgeReady: true, traceReady: true, recoveryReady: true };

function specialist() {
  return {
    key: BRAIN, version: 1, enabled: true, controlPlane: "command_center", domain: "books", subdomains: ["publishing"],
    supportedCompanyIds: [COMPANY], supportedProjectIds: [PROJECT], supportedWorkClasses: ["editing"], strengths: ["editing"], weaknesses: ["live-market-data"],
    capabilityKeys: ["capability:editing"], methodIds: [METHOD], permissionKeys: ["draft.read"], protectedActionBoundaries: ["publishing_requires_owner"],
    dataClasses: ["manuscript"], toolKeys: ["document"], providerKeys: ["local"], modelAssignments: [{ providerKey: "local", modelId: "local-model", versionRef: "v1" }],
    dependencyVersionRefs: ["pif2@1"], calibrationScore: 0.9, evaluationEvidenceIds: ["evd_specialist-eval"], historicalAccuracy: 0.9, reliabilityScore: 0.95,
    latencyMs: 500, resourceClass: "low", costClass: "free", failureModes: ["provider_unavailable"], degradedModes: ["local_only"], fallbackSpecialistIds: [],
    delegationTargets: [], learningEligibility: "local_only", experimentStatus: "stable", health: "healthy", lifecycle: "active", rollbackEvidenceId: "evd_specialist-rollback",
    provenanceEvidenceIds: ["evd_specialist-provenance"], verificationState: "verified", revalidatedAt: "2026-10-26T07:00:00Z", revalidateAfter: LATER
  };
}

function method() {
  return {
    key: METHOD, version: 1, enabled: true, capabilityKey: "capability:editing", implementationVersionRef: "editing-v1", lifecycle: "active",
    applicabilityScopeKeys: [`project:${PROJECT}`], contraindications: [], prerequisites: ["input:manuscript"], qualityScore: 0.95, calibrationScore: 0.9, latencyMs: 400,
    resourceClass: "low", costClass: "free", privacyClass: "local", maxDataSensitivity: "secret", securityAssurance: 0.95, reliabilityScore: 0.96,
    benchmarkEvidenceIds: ["evd_method-benchmark"], outcomeEvidenceIds: ["evd_method-outcome"], provenanceEvidenceIds: ["evd_method-provenance"], fallbackMethodIds: [],
    rollbackEvidenceId: "evd_method-rollback", revalidatedAt: "2026-10-26T07:00:00Z", revalidateAfter: LATER
  };
}

function learningPacket() {
  return {
    id: "lrn_books-editing-win", version: 1, sourceBrainId: BRAIN, sourceSystemRef: "command-center", sourceCompanyId: COMPANY, sourceProjectId: PROJECT,
    sourceRunId: "run_edit-pass", sourceTaskId: "tsk_line-edit", sourceMethodId: METHOD, sourceMethodVersion: 1, sourceCapabilityKey: "capability:editing",
    observedAt: "2026-10-26T07:30:00Z", taskClass: "editing", domainId: "dom_books", conditionIds: ["cnd_long-form"], constraints: ["preserve-plot"],
    discovery: "method improved consistency", action: "applied editing method", evidenceIds: ["evd_learning-outcome"], sourceRefs: ["run:edit-pass"], sampleCount: 20,
    metrics: [{ key: "quality", baseline: 0.7, measured: 0.86, unit: "ratio" }], outcome: "higher verified quality", successCriteria: ["quality_above_baseline"], failureCriteria: ["plot_regression"],
    confidence: 0.9, calibration: 0.9, reproducibility: 0.9, causalConfidence: 0.8, confounders: [], limitations: ["books-domain-only"], failureConditions: ["unlocked-plot"],
    prerequisites: ["locked-manuscript"], requiredTools: ["document"], requiredDataClasses: ["manuscript"], resourceImplications: ["low"], latencyImplications: ["moderate"], financialImplications: ["free"],
    privacy: { ownerId: OWNER, classification: "ecosystem_shared" }, securityImplications: ["no-secrets"], applicableSystems: ["books"], transferabilityHypothesis: "may transfer to long-form editing",
    proposedScope: { scope: "domain", ref: "dom_books" }, proposedPromotionClass: "DOMAIN", validationState: "validated", freshUntil: LATER, revalidateAfter: "2026-12-26T08:00:00Z",
    negativeKnowledge: ["do-not-use-on-unlocked-plot"], recoveryLesson: ["rollback-to-previous-manuscript"], rollbackEvidenceId: "evd_learning-rollback", retractionEvidenceIds: [], provenanceEvidenceIds: ["evd_learning-provenance"]
  };
}

function authority(now, overrides = {}) { return { policyEpoch: 9, revocationEpoch: 5, invalidatedLearningRefs: [], revokedAuthorizationRefs: [], now, ...overrides }; }

function traceNode(id, kind, privacy = "ecosystem_shared", scopeRef) {
  return { id, kind, version: 1, ownerId: OWNER, privacy, ...(scopeRef ? { scopeRef } : {}), reference: `ref:${id}`, recordedAt: NOW, evidenceRefs: [`evd_${id.replace(/[^a-z0-9]+/gi, "-")}`] };
}
function traceEdge(id, relation, fromId, toId) { return { id, relation, fromId, fromVersion: 1, toId, toVersion: 1, version: 1, recordedAt: NOW, evidenceRefs: [`evd_${id}`] }; }

test("PIF integrated acceptance: scoped intelligence flows through routing, evidence, evaluation, learning, trace and governed improvement", () => {
  const envelope = {
    contractVersion: SHARED_INTELLIGENCE_CONTRACT_VERSION,
    ontology: { id: SHARED_INTELLIGENCE_ONTOLOGY_ID, version: SHARED_INTELLIGENCE_ONTOLOGY_VERSION },
    claim: { id: "knowledge-integrated", subjectId: "cap_shared-learning", version: 1, kind: "verified", state: "current", value: known({ outcome: "improved" }), confidence: 0.9, sourceRefs: ["benchmark:integrated"], observedAt: "2026-10-26T07:00:00Z", recordedAt: "2026-10-26T07:01:00Z" },
    epistemicLabel: "verified", temporalLabel: "current", causalLabel: "not_claimed", applicability: { scope: "project", ref: PROJECT },
    privacy: { ownerId: OWNER, classification: "project_private", scopeRef: PROJECT }, evidenceIds: ["evd_integrated-contract"]
  };
  assert.equal(validateSharedIntelligenceEnvelope(envelope, { ownerId: OWNER, authorizedScopeKeys: [`project:${PROJECT}`], ontologyId: SHARED_INTELLIGENCE_ONTOLOGY_ID, minimumOntologyVersion: 1, maximumOntologyVersion: 1, now: NOW }), envelope);

  const methods = new CapabilityMethodPortfolio(); methods.register(method());
  const selected = methods.route({ capabilityKey: "capability:editing", scopeKeys: [`project:${PROJECT}`], conditions: [], availablePrerequisites: ["input:manuscript"], allowPaid: false, maxPrivacy: "local", dataSensitivity: "protected", maxResourceClass: "low", allowExperimental: false, optimization: "quality", now: NOW });
  assert.equal(selected?.key, METHOD);

  const brains = new SpecialistBrainRegistry(); brains.registerModel(specialist(), { actor: "command_center", evidenceIds: ["evd_cc-authority"] });
  assert.equal(brains.getModel(BRAIN)?.methodIds.includes(selected.key), true);

  const epistemic = resolveEpistemicAssessments([{ id: "epa-integrated", claimId: "claim:integrated", subjectId: METHOD, valueFingerprint: "candidate-better", state: "VERIFIED", authorityRank: 60, evidence: [{ evidenceId: "evd_prod-evidence", sourceRef: "production:eval", independenceGroup: "prod-1", sourceConfidence: 0.95, transformationConfidence: 0.95 }], calibrationScore: 0.95, confidence: 0.95, observedAt: "2026-10-26T07:20:00Z", recordedAt: "2026-10-26T07:21:00Z", applicabilityRefs: [`project:${PROJECT}`] }], { subjectId: METHOD, applicabilityRefs: [`project:${PROJECT}`], now: NOW, confidenceHalfLifeMs: 86_400_000, minimumConfidence: 0.5, highImpact: false });
  assert.equal(epistemic.status, "resolved");

  const context = compileBrainScopedLayeredContext({ ownerId: OWNER, projectId: PROJECT, companyId: COMPANY, brainId: BRAIN, taskClass: "editing", now: NOW, maxSensitivityRank: 2, minRelevance: 0.5, maxItems: 10, maxBudgetUnits: 10 }, [{
    memory: { id: "mem_editing", ownerId: OWNER, projectId: PROJECT, kind: "fact", version: 1, state: "current", value: Object.freeze({ recommendation: METHOD }), confidence: 0.9, sensitivity: "internal", sourceRefs: ["source:verified-editing"], recordedAt: "2026-10-26T07:10:00Z" },
    metadata: { memoryId: "mem_editing", memoryVersion: 1, layer: "specialist_local", companyId: COMPANY, brainId: BRAIN, taskClasses: ["editing"], conditionRefs: [], dependencyRefs: ["epa-integrated"], methodRefs: [METHOD], permissionRefs: ["draft.read"], budgetRefs: ["budget:free-first"], contradictionRefs: [], operationalEligible: true, expiresAt: LATER, revalidateAfter: "2026-11-15T08:00:00Z", invalidationEvidenceRefs: [] }, relevance: 0.95, sensitivityRank: 1, budgetUnits: 1
  }]);
  assert.deepEqual(context.exactVersionRefs, ["mem_editing@1"]); assert.equal(context.brainId, BRAIN);

  const evaluator = { key: "evaluator:quality", version: 1, ownerRef: "brn_quality", purpose: "compare editing quality", biasRisks: ["benchmark-overfit"], requiredDataClasses: ["evaluation"], prohibitedDataClasses: ["secrets"], applicableDomains: ["books"], applicableTaskClasses: ["editing"], minimumEvidenceClasses: ["production"], repeatCount: 2, minimumSampleCount: 20, minimumConfidence: 0.8, acceptanceAuthority: "command_center", calibrationEvidenceRefs: ["evd_eval-calibration"], active: true };
  const observations = [
    { runRef: "eval:1", evidenceClass: "production", sampleCount: 10, repeatIndex: 1, baselineScore: 0.7, candidateScore: 0.85, confidence: 0.95, sourceRefs: ["evd_prod-1"], synthetic: false },
    { runRef: "eval:2", evidenceClass: "production", sampleCount: 10, repeatIndex: 2, baselineScore: 0.72, candidateScore: 0.87, confidence: 0.94, sourceRefs: ["evd_prod-2"], synthetic: false }
  ];
  const evaluation = evaluateCandidate(evaluator, { capturedAt: NOW, candidateRef: METHOD, baselineRef: "mth_book-editing-v0", evaluatorKey: evaluator.key, evaluatorVersion: 1, inputFingerprint: "input-v1", environmentFingerprint: "env-v1", constraintRefs: ["locked-scope"], evidenceRefs: ["evd_snapshot"] }, observations, { domain: "books", taskClass: "editing", candidateOwnerRef: BRAIN, calibrationScore: 0.95 });
  assert.equal(evaluation.decision, "better"); assert.equal(evaluation.acceptanceEligible, true);

  const negative = { id: "negative:provider-timeout", version: 1, statement: "provider-b times out under low resources", sourceRegime: { domain: "books", provider: "provider-b" }, contraindication: { provider: "provider-b", resourceClass: "low" }, failureSignature: "timeout-high", recoveryLessons: ["use-local-fallback"], evidenceRefs: ["evd_failure"], evaluatorEvidenceRefs: ["evd_failure-eval"], active: true, invalidatedByEvidenceRefs: [], recordedAt: "2026-10-26T07:00:00Z", revalidateAfter: LATER };
  const transfer = assessTransfer({ id: "transfer:editing", version: 1, sourceRef: METHOD, sourceRegime: { domain: "books", provider: "local", resourceClass: "low" }, targetRegime: { domain: "books", provider: "provider-c", resourceClass: "low" }, similarityEvidenceRefs: ["evd_similarity"], applicabilityEvidenceRefs: ["evd_applicability"], evaluatorEvidenceRefs: ["evd_transfer-eval"], negativeKnowledgeRefs: [negative.id], alternativeRefs: ["mth_book-editing-alt"], evidenceRefs: ["evd_transfer"], decidedAt: NOW, expiresAt: LATER }, [negative], NOW);
  assert.equal(transfer.decision, "eligible");

  const promotion = new LearningPromotionGovernor(); const packet = learningPacket(); promotion.submit(packet, NOW);
  const promotionDecision = promotion.decide(packet.id, "prm_integrated", READY, ["validator:pif-integrated"], NOW);
  assert.equal(promotionDecision.lifecycle, "promoted"); assert.equal(promotionDecision.executablePolicy, false);

  const trace = new GovernedIntelligenceTraceFabric();
  for (const n of [traceNode("intent:integrated", "intent"), traceNode("context:integrated", "context"), traceNode("policy:integrated", "policy"), traceNode("router:integrated", "router"), traceNode(BRAIN, "specialist"), traceNode(METHOD, "method"), traceNode("tool:document", "tool"), traceNode("evidence:integrated", "evidence"), traceNode(evaluator.key, "evaluator"), traceNode("decision:integrated", "decision"), traceNode("outcome:integrated", "outcome"), traceNode(packet.id, "learning")]) trace.registerNode(n);
  for (const e of [
    traceEdge("i01", "context_for", "intent:integrated", "context:integrated"), traceEdge("i02", "governs", "context:integrated", "policy:integrated"), traceEdge("i03", "routes_to", "policy:integrated", "router:integrated"), traceEdge("i04", "selects", "router:integrated", BRAIN), traceEdge("i05", "selects", BRAIN, METHOD), traceEdge("i06", "invokes", METHOD, "tool:document"), traceEdge("i07", "produces_evidence", "tool:document", "evidence:integrated"), traceEdge("i08", "evaluated_by", "decision:integrated", evaluator.key), traceEdge("i09", "depends_on", "decision:integrated", METHOD), traceEdge("i10", "records_outcome", "decision:integrated", "outcome:integrated"), traceEdge("i11", "produces_learning", "outcome:integrated", packet.id)
  ]) trace.connect(e);
  trace.assertCompatible("decision:integrated", 1, { [METHOD]: 1, [evaluator.key]: 1 });
  assert.ok(trace.explain(packet.id, 1).nodeRefs.includes(`${METHOD}@1`));

  const proposal = createImprovementProposal({ id: "improvement:integrated", area: "quality", title: "Use verified editing routing", evidenceRefs: ["evd_proposal"], confidence: 0.9 });
  const governor = new SelfImprovementGovernor();
  governor.register(proposal, { proposalId: proposal.id, applicabilityRefs: ["dom_books"], requestedPermissionRefs: ["draft.read"], minimumEffectConfidence: 0.8, maximumCanaryFraction: 0.1, rollbackCheckpointRef: "chk_editing-v0", evidenceRefs: ["evd_plan"] }, "command-center", "2026-10-26T08:01:00Z");
  governor.validateEvidence(proposal.id, 1, ["evd_validated"], "validator:pif", "2026-10-26T08:02:00Z");
  governor.confirmScope(proposal.id, 2, ["dom_books"], ["draft.read"], "command-center", "2026-10-26T08:03:00Z", ["evd_scope"]);
  governor.assessRisk(proposal.id, 3, "moderate", "command-center", "2026-10-26T08:04:00Z", ["evd_risk"]);
  governor.recordEvaluation(proposal.id, 4, { evaluatorRef: evaluator.key, evaluatorVersion: 1, acceptanceEligible: evaluation.acceptanceEligible, calibratedConfidence: evaluation.calibratedConfidence, effectsCertain: true, evidenceRefs: ["evd_eval"], evaluatedAt: "2026-10-26T08:05:00Z" }, evaluator.key);
  governor.lockBaseline(proposal.id, 5, { baselineRef: "baseline:editing-v0", acceptanceFingerprint: "sha256:integrated", lockedAt: "2026-10-26T08:06:00Z", evidenceRefs: ["evd_baseline"] }, "command-center");
  const snapshot = { id: "snapshot:integrated", proposalId: proposal.id, capturedAt: "2026-10-26T08:07:00Z", policyEpoch: 9, revocationEpoch: 5, exactVersionRefs: [`${METHOD}@1`, `${evaluator.key}@1`, `memory:mem_editing@1`], learningRefs: [packet.id], permissionRefs: ["draft.read"], traceRef: `${packet.id}@1`, baselineRef: "baseline:editing-v0", acceptanceFingerprint: "sha256:integrated", rollbackCheckpointRef: "chk_editing-v0", evidenceRefs: ["evd_improvement-snapshot"] };
  const auth = { id: "auth:integrated", proposalId: proposal.id, issuerRef: "command-center", policyEpoch: 9, revocationEpoch: 5, permissionRefs: ["draft.read"], maximumCanaryFraction: 0.1, issuedAt: "2026-10-26T08:06:30Z", expiresAt: "2026-10-27T08:06:30Z", evidenceRefs: ["evd_auth"] };
  governor.authorize(proposal.id, 6, auth, snapshot, authority("2026-10-26T08:07:00Z"), "command-center");
  governor.beginShadow(proposal.id, 7, authority("2026-10-26T08:08:00Z"), "command-center", ["evd_shadow"]);
  governor.beginCanary(proposal.id, 8, 0.05, { successRate: 0.95, verificationFailureRate: 0.02, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 }, { successRate: 0.97, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 }, authority("2026-10-26T08:09:00Z"), "command-center", ["evd_canary"]);
  governor.verify(proposal.id, 9, "sha256:integrated", 0.9, true, evaluation.acceptanceEligible, authority("2026-10-26T08:10:00Z"), "verifier:pif", ["evd_verify"]);
  governor.promote(proposal.id, 10, authority("2026-10-26T08:11:00Z"), "command-center", ["evd_promote"]);
  governor.monitor(proposal.id, 11, { id: "monitor:integrated", proposalId: proposal.id, observedAt: "2026-10-26T08:12:00Z", healthy: true, effectConfidence: 0.9, permissionRefs: ["draft.read"], acceptanceFingerprint: "sha256:integrated", evidenceRefs: ["evd_monitor"] }, authority("2026-10-26T08:12:00Z"), "command-center");
  governor.rollback(proposal.id, 12, "chk_editing-v0", authority("2026-10-26T08:13:00Z"), "command-center", ["evd_rollback"]);
  const final = governor.recordLesson(proposal.id, 13, ["lesson:rollback-safe"], "command-center", "2026-10-26T08:14:00Z", ["evd_lesson"]);
  assert.equal(final.stage, "lesson_recorded"); assert.equal(final.proposal.installsAutomatically, false);

  assert.doesNotThrow(() => assertImprovementRestoreCurrent(snapshot, authority("2026-10-26T08:15:00Z"), { now: "2026-10-26T08:15:00Z", authorizationState: "active", authorizationRef: "auth:restore", authorizationExpiresAt: "2026-10-27T08:15:00Z", authorizationPolicyEpoch: 9, currentPolicyEpoch: 9, privacyState: "allowed", keyState: "active", applicationState: "valid", sourceLifecycle: "active", payloadState: "present", purposeAllowed: true, retentionAllowed: true, evidenceRefs: ["evd_restore"] }));

  const retracted = promotion.retract("prm_integrated", "evd_retract", "2026-10-26T08:16:00Z"); assert.equal(retracted.lifecycle, "retracted");
  trace.registerNode({ ...traceNode(packet.id, "learning"), version: 2, reference: `ref:${packet.id}:2`, recordedAt: "2026-10-26T08:16:00Z", evidenceRefs: ["evd_retracted-learning"] });
  const impact = trace.affectedDependents(packet.id, 2);
  assert.ok(impact.staleDependentRefs.includes("outcome:integrated@1"));
});

test("PIF hardening blocks cross-Brain memory leakage and private-trace widening", () => {
  const candidate = (id, brainId) => ({ memory: { id, ownerId: OWNER, projectId: PROJECT, kind: "fact", version: 1, state: "current", value: Object.freeze({ id }), confidence: 0.9, sensitivity: "internal", sourceRefs: [`source:${id}`], recordedAt: "2026-10-26T07:00:00Z" }, metadata: { memoryId: id, memoryVersion: 1, layer: "specialist_local", companyId: COMPANY, brainId, taskClasses: ["editing"], conditionRefs: [], dependencyRefs: [], methodRefs: [METHOD], permissionRefs: ["draft.read"], budgetRefs: ["budget:free"], contradictionRefs: [], operationalEligible: true, expiresAt: LATER, revalidateAfter: "2026-11-15T08:00:00Z", invalidationEvidenceRefs: [] }, relevance: 0.9, sensitivityRank: 1, budgetUnits: 1 });
  const context = compileBrainScopedLayeredContext({ ownerId: OWNER, projectId: PROJECT, companyId: COMPANY, brainId: BRAIN, taskClass: "editing", now: NOW, maxSensitivityRank: 2, minRelevance: 0.5, maxItems: 10, maxBudgetUnits: 10 }, [candidate("mem_books", BRAIN), candidate("mem_other", "brn_other")]);
  assert.deepEqual(context.items.map((item) => item.memoryId), ["mem_books"]);
  assert.equal(context.omitted.find((item) => item.memoryId === "mem_other")?.reason, "brain_boundary");

  const trace = new GovernedIntelligenceTraceFabric();
  trace.registerNode(traceNode("private:project", "context", "project_private", PROJECT));
  trace.registerNode(traceNode("global:learning", "learning", "ecosystem_shared"));
  assert.throws(() => trace.connect(traceEdge("privacy-widen", "produces_learning", "private:project", "global:learning")), /widen privacy boundary/i);
});

test("PIF hardening keeps unrelated dependents valid when a method version changes", () => {
  const trace = new GovernedIntelligenceTraceFabric();
  for (const n of [traceNode("decision:a", "decision"), traceNode("outcome:a", "outcome"), traceNode("method:a", "method"), traceNode("decision:b", "decision"), traceNode("method:b", "method")]) trace.registerNode(n);
  trace.connect(traceEdge("dep-a", "depends_on", "decision:a", "method:a")); trace.connect(traceEdge("flow-a", "records_outcome", "decision:a", "outcome:a")); trace.connect(traceEdge("dep-b", "depends_on", "decision:b", "method:b"));
  const impact = trace.affectedDependents("method:a", 2);
  assert.ok(impact.staleDependentRefs.includes("decision:a@1")); assert.ok(impact.staleDependentRefs.includes("outcome:a@1")); assert.ok(!impact.staleDependentRefs.includes("decision:b@1"));
});
