import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EvaluatorRegistry, evaluateCandidate, validateActualOutcome } from "../dist/analytics/index.js";

const evaluator = {
  key: "evaluator:quality", version: 1, ownerRef: "brn_quality", purpose: "compare candidate quality", biasRisks: ["benchmark-overfit"], requiredDataClasses: ["evaluation"], prohibitedDataClasses: ["secrets"], applicableDomains: ["books"], applicableTaskClasses: ["editing"], minimumEvidenceClasses: ["production"], repeatCount: 2, minimumSampleCount: 20, minimumConfidence: 0.8, acceptanceAuthority: "command_center", calibrationEvidenceRefs: ["evd_eval-calibration"], active: true
};
const snapshot = { capturedAt: "2026-10-26T02:00:00Z", candidateRef: "mth_candidate", baselineRef: "mth_baseline", evaluatorKey: "evaluator:quality", evaluatorVersion: 1, inputFingerprint: "input-v1", environmentFingerprint: "env-v1", constraintRefs: ["locked-scope"], evidenceRefs: ["evd_decision-snapshot"] };
const production = [
  { runRef: "eval:1", evidenceClass: "production", sampleCount: 10, repeatIndex: 1, baselineScore: 0.7, candidateScore: 0.85, confidence: 0.95, sourceRefs: ["evd_prod-1"], synthetic: false },
  { runRef: "eval:2", evidenceClass: "production", sampleCount: 10, repeatIndex: 2, baselineScore: 0.72, candidateScore: 0.86, confidence: 0.94, sourceRefs: ["evd_prod-2"], synthetic: false }
];

test("PIF.7 evaluates an exact immutable evaluator version and compares baseline/candidate", () => {
  const registry = new EvaluatorRegistry(); registry.register(evaluator); assert.equal(registry.get("evaluator:quality", 1).version, 1);
  const result = evaluateCandidate(evaluator, snapshot, production, { domain: "books", taskClass: "editing", candidateOwnerRef: "brn_books", calibrationScore: 0.95 });
  assert.equal(result.decision, "better"); assert.equal(result.acceptanceEligible, true); assert.ok(result.meanDelta > 0);
});

test("PIF.7 synthetic result cannot become production outcome or acceptance evidence", () => {
  const synthetic = production.map((item, index) => ({ ...item, runRef: `eval:s${index}`, evidenceClass: "synthetic", synthetic: true }));
  const result = evaluateCandidate(evaluator, snapshot, synthetic, { domain: "books", taskClass: "editing", candidateOwnerRef: "brn_books", calibrationScore: 1 });
  assert.equal(result.decision, "insufficient_evidence"); assert.equal(result.eligibleProductionEvidence, false); assert.equal(result.acceptanceEligible, false);
  assert.throws(() => validateActualOutcome({ id: "outcome:synthetic", evaluationRunRef: "eval:s1", candidateRef: "mth_candidate", observedAt: "2026-10-26T03:00:00Z", truth: "synthetic", metricKey: "quality", value: 1, sourceRefs: ["evd_synth"], confounders: [], causalAttribution: "supported" }), /Synthetic result/i);
});

test("PIF.7 self-evaluator cannot silently control acceptance", () => {
  const result = evaluateCandidate(evaluator, snapshot, production, { domain: "books", taskClass: "editing", candidateOwnerRef: "brn_quality", calibrationScore: 1 });
  assert.equal(result.decision, "better"); assert.equal(result.acceptanceEligible, false); assert.ok(result.reasonCodes.includes("self_evaluator_cannot_control_acceptance"));
});

test("PIF.7 lucky outcome with unresolved confounders cannot prove causal/process quality", () => {
  assert.throws(() => validateActualOutcome({ id: "outcome:lucky", evaluationRunRef: "eval:1", candidateRef: "mth_candidate", observedAt: "2026-10-26T03:00:00Z", truth: "verified", metricKey: "quality", value: 1, sourceRefs: ["evd_outcome"], confounders: ["traffic-spike"], causalAttribution: "supported" }), /resolved confounders/i);
});

test("PIF.7 durable schema keeps evaluator versions, runs, decision snapshots, and outcomes immutable", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026030000_pif7_evaluator_outcomes.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_evaluators/i); assert.match(sql, /command_center_evaluator_versions/i); assert.match(sql, /command_center_evaluation_runs/i); assert.match(sql, /command_center_evaluation_outcomes/i); assert.match(sql, /decision_snapshot/i); assert.match(sql, /confounders/i); assert.match(sql, /evidence_class/i); assert.match(sql, /acceptance_authority/i);
});
