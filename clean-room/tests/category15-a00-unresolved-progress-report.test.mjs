import test from "node:test";
import assert from "node:assert/strict";
import { buildA00UnresolvedProgressReport } from "../scripts/p15-1-a00-unresolved-progress-report.mjs";

test("P15.1 A00 unresolved progress report joins exact source grounding to current progressive truth without promotion", () => {
  const report = buildA00UnresolvedProgressReport({ limit: 10 });

  assert.equal(report.schemaVersion, "cc-p15.1-a00-unresolved-progress-report-v1");
  assert.equal(report.status, "SOURCE_GROUNDED_CANDIDATE_DISCOVERY_ONLY");
  assert.equal(report.scope, "HISTORICAL_A00_ONLY");
  assert.equal(report.closureSummary.total, 489);
  assert.equal(
    report.closureSummary.verified + report.closureSummary.unverified + report.closureSummary.notApplicable,
    489
  );
  assert.equal(report.unresolvedCandidateCount, report.closureSummary.unverified);
  assert.equal(report.emittedCandidateCount, Math.min(10, report.unresolvedCandidateCount));
  assert.equal(report.candidates.length, report.emittedCandidateCount);
  assert.ok(report.semanticTruthBoundary.candidateSimilarityIsNotVerification);
  assert.ok(report.semanticTruthBoundary.noTruthStatePromotion);
  assert.ok(report.semanticTruthBoundary.reportDoesNotCloseRequirements);

  for (const row of report.candidates) {
    assert.match(row.id, /^CCR-\d{5}$/);
    assert.ok(String(row.requirement).trim().length > 0);
    assert.ok(Array.isArray(row.canonicalSourceIds) && row.canonicalSourceIds.length > 0);
    assert.ok(Array.isArray(row.canonicalSourceFiles) && row.canonicalSourceFiles.length > 0);
    assert.ok(row.candidatePriorityScore >= 0 && row.candidatePriorityScore <= 1);
  }

  for (let index = 1; index < report.candidates.length; index += 1) {
    assert.ok(
      report.candidates[index - 1].candidatePriorityScore >= report.candidates[index].candidatePriorityScore,
      "candidate priority must be monotonic"
    );
  }
});

test("P15.1 A00 unresolved progress report rejects unsafe or unbounded limits", () => {
  assert.throws(() => buildA00UnresolvedProgressReport({ limit: 0 }), /integer from 1 to 100/);
  assert.throws(() => buildA00UnresolvedProgressReport({ limit: 101 }), /integer from 1 to 100/);
  assert.throws(() => buildA00UnresolvedProgressReport({ limit: "not-a-number" }), /integer from 1 to 100/);
});
