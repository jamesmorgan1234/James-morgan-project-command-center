import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decayedEpistemicConfidence, resolveEpistemicAssessments, validateEpistemicAssessment } from "../dist/data/index.js";

const NOW = "2026-10-26T02:00:00Z";
const BASE = {
  id: "epa-owner", claimId: "claim:1", subjectId: "subject:1", valueFingerprint: "A", state: "OWNER_STATED", authorityRank: 100,
  evidence: [{ evidenceId: "evd_owner-statement", sourceRef: "owner", independenceGroup: "owner", sourceConfidence: 1, transformationConfidence: 1 }],
  calibrationScore: 1, confidence: 0.95, observedAt: "2026-10-26T01:00:00Z", recordedAt: "2026-10-26T01:01:00Z", applicabilityRefs: ["project:cc"]
};

test("PIF.5 newer low-authority evidence cannot erase higher-authority knowledge", () => {
  const lower = { ...BASE, id: "epa-lower", valueFingerprint: "B", state: "VERIFIED", authorityRank: 20, observedAt: "2026-10-26T01:55:00Z", evidence: [{ evidenceId: "evd_external", sourceRef: "source:new", independenceGroup: "external-1", sourceConfidence: 1, transformationConfidence: 1 }] };
  const result = resolveEpistemicAssessments([BASE, lower], { subjectId: "subject:1", applicabilityRefs: ["project:cc"], now: NOW, confidenceHalfLifeMs: 86_400_000, minimumConfidence: 0.5, highImpact: false });
  assert.equal(result.status, "resolved"); assert.equal(result.selected.id, "epa-owner"); assert.deepEqual([...result.visibleAssessmentIds].sort(), ["epa-lower", "epa-owner"]);
});

test("PIF.5 correlated agreement is discounted instead of counted as independent support", () => {
  const correlated = { ...BASE, id: "epa-correlated", state: "STRONGLY_SUPPORTED", authorityRank: 50, confidence: 1, calibrationScore: 1, evidence: [
    { evidenceId: "evd_corr-one", sourceRef: "mirror:1", independenceGroup: "same-origin", sourceConfidence: 0.7, transformationConfidence: 1 },
    { evidenceId: "evd_corr-two", sourceRef: "mirror:2", independenceGroup: "same-origin", sourceConfidence: 0.7, transformationConfidence: 1 }
  ] };
  const independent = { ...correlated, id: "epa-independent", evidence: [
    { evidenceId: "evd_ind-one", sourceRef: "source:1", independenceGroup: "origin-1", sourceConfidence: 0.7, transformationConfidence: 1 },
    { evidenceId: "evd_ind-two", sourceRef: "source:2", independenceGroup: "origin-2", sourceConfidence: 0.7, transformationConfidence: 1 }
  ] };
  assert.ok(decayedEpistemicConfidence(independent, NOW, 86_400_000) > decayedEpistemicConfidence(correlated, NOW, 86_400_000));
});

test("PIF.5 material same-authority disagreement abstains and preserves conflicting evidence", () => {
  const a = { ...BASE, id: "epa-a", state: "VERIFIED", authorityRank: 50, confidence: 0.95 };
  const b = { ...BASE, id: "epa-b", valueFingerprint: "B", state: "CONFLICTING", authorityRank: 50, confidence: 0.9, evidence: [{ evidenceId: "evd_conflict", sourceRef: "source:b", independenceGroup: "b", sourceConfidence: 1, transformationConfidence: 1 }] };
  const result = resolveEpistemicAssessments([a, b], { subjectId: "subject:1", applicabilityRefs: ["project:cc"], now: NOW, confidenceHalfLifeMs: 86_400_000, minimumConfidence: 0.5, highImpact: true });
  assert.equal(result.status, "abstain"); assert.ok(result.conflictingAssessmentIds.includes("epa-b")); assert.equal(result.visibleAssessmentIds.length, 2);
});

test("PIF.5 stale evidence decays out of routing but remains visible", () => {
  const stale = { ...BASE, id: "epa-stale", state: "VERIFIED", staleAfter: "2026-10-26T01:30:00Z" };
  const result = resolveEpistemicAssessments([stale], { subjectId: "subject:1", applicabilityRefs: ["project:cc"], now: NOW, confidenceHalfLifeMs: 86_400_000, minimumConfidence: 0.5, highImpact: false });
  assert.equal(result.status, "abstain"); assert.deepEqual(result.visibleAssessmentIds, ["epa-stale"]); assert.equal(result.confidence, 0);
});

test("PIF.5 uncertain states cannot manufacture certainty and high-impact routing raises threshold", () => {
  assert.throws(() => validateEpistemicAssessment({ ...BASE, id: "epa-inferred", state: "INFERRED", confidence: 1 }), /cannot claim certainty/i);
  const weak = { ...BASE, id: "epa-weak", state: "VERIFIED", authorityRank: 50, confidence: 0.75, calibrationScore: 1, evidence: [{ evidenceId: "evd_weak", sourceRef: "source:weak", independenceGroup: "weak", sourceConfidence: 1, transformationConfidence: 1 }] };
  const result = resolveEpistemicAssessments([weak], { subjectId: "subject:1", applicabilityRefs: ["project:cc"], now: "2026-10-26T01:00:00Z", confidenceHalfLifeMs: 86_400_000, minimumConfidence: 0.5, highImpact: true });
  assert.equal(result.status, "abstain"); assert.ok(result.reasons.includes("confidence_below_threshold"));
});

test("PIF.5 durable schema is an epistemic companion to canonical knowledge, with immutable versions and contradiction records", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026023000_pif5_epistemics.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_epistemic_assessments/i); assert.match(sql, /command_center_epistemic_assessment_versions/i); assert.match(sql, /command_center_epistemic_contradictions/i); assert.match(sql, /independence_group/i); assert.match(sql, /source_confidence/i); assert.match(sql, /transformation_confidence/i); assert.match(sql, /calibration_score/i); assert.match(sql, /authority_rank/i); assert.match(sql, /stale_after/i); assert.doesNotMatch(sql, /create table if not exists public\.command_center_knowledge_claims/i);
});
