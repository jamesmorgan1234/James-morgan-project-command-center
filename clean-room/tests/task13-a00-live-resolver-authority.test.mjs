import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";
import { buildA00UnresolvedProgressReport } from "../scripts/p15-1-a00-unresolved-progress-report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = resolve(here, "../evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json");

function countResolvedRows(rows) {
  const verified = rows.filter((row) => row.truthState === "VERIFIED").length;
  const notApplicable = rows.filter((row) => row.truthState === "NOT_APPLICABLE").length;
  return {
    total: rows.length,
    verified,
    unverified: rows.length - verified - notApplicable,
    notApplicable
  };
}

test("Task 13: live A00 resolver is authoritative for effective closure counts", () => {
  const immutableBaseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const live = resolveA00Traceability();
  const recomputed = countResolvedRows(live.resolvedRows);

  assert.ok(live.traceabilityFragments.length > 0, "live A00 truth must include progressive override fragments");
  assert.deepEqual(live.closureSummary, recomputed, "resolver summary must be derived from the resolved rows");
  assert.equal(live.closureSummary.total, live.canonicalIdCount);
  assert.equal(live.resolvedRows.length, live.canonicalIdCount);
  assert.notDeepEqual(
    live.closureSummary,
    immutableBaseline.closureSummary,
    "effective A00 counts must not fall back to the immutable baseline's stale historical summary"
  );
});

test("Task 13: unresolved A00 reporting consumes live resolver truth, not stale baseline counts", () => {
  const live = resolveA00Traceability();
  const report = buildA00UnresolvedProgressReport({ limit: 15 });

  assert.deepEqual(report.closureSummary, live.closureSummary);
  assert.deepEqual(report.traceabilityFragments, live.traceabilityFragments);
  assert.equal(report.unresolvedCandidateCount, live.closureSummary.unverified);
  assert.equal(
    report.closureSummary.verified + report.closureSummary.unverified + report.closureSummary.notApplicable,
    report.closureSummary.total
  );
});
