import test from "node:test";
import assert from "node:assert/strict";
import { buildA00CandidateMap, validateCandidateMap } from "../scripts/p15-1-a00-grounded-candidate-map.mjs";

test("P15.1 A00 candidate mapper grounds all 489 source rows without promoting verification truth", () => {
  const report = buildA00CandidateMap();
  assert.equal(validateCandidateMap(report), true);
  assert.equal(report.rows.length, 489);
  assert.equal(report.summary.total, 489);
  assert.equal(report.summary.verified, 0);
  assert.equal(report.summary.unverified, 489);
  assert.ok(report.rows.every((row) => row.truthState === "UNVERIFIED"));
  assert.ok(report.rows.every((row) => row.canonicalSourceIds.length > 0));
  assert.ok(report.rows.every((row) => row.canonicalSourceFiles.length > 0));
  assert.ok(report.semanticTruthBoundary.candidateSimilarityIsNotVerification);
  assert.ok(report.semanticTruthBoundary.noTruthStatePromotion);
});

test("P15.1 A00 candidate mapper produces repository-grounded implementation/test candidate arrays", () => {
  const report = buildA00CandidateMap();
  assert.ok(report.summary.withImplementationCandidates > 0);
  assert.ok(report.summary.withTestCandidates > 0);
  assert.ok(report.summary.withRoadmapCandidates > 0);
  for (const row of report.rows) {
    for (const candidate of [...row.candidateMapping.implementationCandidates, ...row.candidateMapping.testCandidates, ...row.candidateMapping.roadmapCandidates, ...row.candidateMapping.evidenceCandidates]) {
      assert.equal(typeof candidate.path, "string");
      assert.match(candidate.fileSha256, /^[0-9a-f]{64}$/);
      assert.ok(candidate.lexicalScore >= 0.42 && candidate.lexicalScore <= 1);
    }
  }
});
