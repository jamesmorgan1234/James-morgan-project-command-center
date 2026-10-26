import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LearningPromotionGovernor, validateLearningPacket } from "../dist/data/index.js";

const NOW = "2026-10-26T02:00:00Z";
const READY = { epistemicsReady: true, evaluatorReady: true, negativeKnowledgeReady: true, traceReady: true, recoveryReady: true };

function packet(overrides = {}) {
  return {
    id: "lrn_books-editing-win", version: 1, sourceBrainId: "brn_books", sourceSystemRef: "command-center", sourceCompanyId: "cmp_books", sourceProjectId: "prj_book-one", sourceRunId: "run_edit-pass", sourceTaskId: "tsk_line-edit", sourceMethodId: "mth_book-editing", sourceMethodVersion: 1, sourceCapabilityKey: "capability:editing", observedAt: "2026-10-26T01:00:00Z", taskClass: "manuscript", domainId: "dom_books", conditionIds: ["cnd_long-form"], constraints: ["preserve-plot"], discovery: "method improved consistency", action: "applied editing method", evidenceIds: ["evd_learning-outcome"], sourceRefs: ["run:edit-pass"], sampleCount: 3, metrics: [{ key: "defect_rate", baseline: 0.08, measured: 0.03, unit: "ratio" }], outcome: "lower defect rate", successCriteria: ["defect_rate_below_baseline"], failureCriteria: ["plot_regression"], confidence: 0.9, calibration: 0.85, reproducibility: 0.8, causalConfidence: 0.7, confounders: ["reviewer-variance"], limitations: ["books-domain-only"], failureConditions: ["unlocked-plot"], prerequisites: ["locked-manuscript"], requiredTools: ["document"], requiredDataClasses: ["manuscript"], resourceImplications: ["low"], latencyImplications: ["moderate"], financialImplications: ["free"], privacy: { ownerId: "owner-1", classification: "ecosystem_shared" }, securityImplications: ["no-secrets"], applicableSystems: ["books"], transferabilityHypothesis: "may transfer to long-form editing", proposedScope: { scope: "domain", ref: "dom_books" }, proposedPromotionClass: "DOMAIN", validationState: "validated", freshUntil: "2026-11-26T01:00:00Z", revalidateAfter: "2026-12-26T01:00:00Z", negativeKnowledge: ["do-not-use-on-unlocked-plot"], recoveryLesson: ["rollback-to-previous-manuscript"], rollbackEvidenceId: "evd_learning-rollback", retractionEvidenceIds: [], provenanceEvidenceIds: ["evd_learning-provenance"], ...overrides
  };
}

test("PIF.4 accepts evidence-rich scoped learning and emits non-executable promotion decisions", () => {
  const governor = new LearningPromotionGovernor(); governor.submit(packet(), NOW);
  const decision = governor.decide("lrn_books-editing-win", "prm_books-editing", READY, ["validator:pif4"], NOW);
  assert.equal(decision.classification, "DOMAIN"); assert.equal(decision.lifecycle, "promoted"); assert.equal(decision.executablePolicy, false);
});

test("PIF.4 never lets private, stale, contradicted, or not-yet-validated learning become global operational truth", () => {
  assert.throws(() => validateLearningPacket(packet({ proposedScope: { scope: "global" }, proposedPromotionClass: "GLOBAL", privacy: { ownerId: "owner-1", classification: "project_private", scopeRef: "prj_book-one" } }), NOW), /Private learning/i);
  const contradicted = new LearningPromotionGovernor(); contradicted.submit(packet({ id: "lrn_contradicted", validationState: "contradicted" }), NOW); assert.equal(contradicted.decide("lrn_contradicted", "prm_contradicted", READY, ["validator:pif4"], NOW).classification, "QUARANTINED");
  assert.throws(() => validateLearningPacket(packet({ id: "lrn_stale", freshUntil: "2026-10-25T01:00:00Z" }), NOW), /Stale learning/i);
});

test("PIF.4 global promotion remains quarantined until downstream epistemic/evaluator/negative/trace/recovery gates are ready", () => {
  const governor = new LearningPromotionGovernor(); governor.submit(packet({ id: "lrn_global-candidate", proposedScope: { scope: "global" }, proposedPromotionClass: "GLOBAL" }), NOW);
  const decision = governor.decide("lrn_global-candidate", "prm_global-candidate", { ...READY, evaluatorReady: false }, ["validator:pif4"], NOW);
  assert.equal(decision.classification, "QUARANTINED"); assert.ok(decision.reasonCodes.includes("global_dependencies_not_ready"));
});

test("PIF.4 promotion is reversible and keeps immutable decision versions", () => {
  const governor = new LearningPromotionGovernor(); governor.submit(packet(), NOW); governor.decide("lrn_books-editing-win", "prm_books-editing", READY, ["validator:pif4"], NOW);
  const retracted = governor.retract("prm_books-editing", "evd_retraction", "2026-10-26T03:00:00Z"); assert.equal(retracted.version, 2); assert.equal(retracted.lifecycle, "retracted"); assert.equal(retracted.classification, "DEPRECATED");
});

test("PIF.4 durable schema stores immutable packet versions and governed decisions without direct policy install", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026021000_pif4_learning_packet_promotion.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_learning_packets/i); assert.match(sql, /command_center_learning_packet_versions/i); assert.match(sql, /command_center_learning_promotion_decisions/i); assert.match(sql, /provenance_evidence_ids/i); assert.match(sql, /rollback_evidence_id/i); assert.match(sql, /validation_state/i); assert.match(sql, /promotion_class/i); assert.match(sql, /executable_policy boolean not null default false/i); assert.doesNotMatch(sql, /executable_policy boolean not null default true/i);
});
