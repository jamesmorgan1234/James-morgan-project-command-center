import test from "node:test";
import assert from "node:assert/strict";
import { assertStrictVerifiedA00Row, resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

test("A00 P1 universal command/action surface row is strictly verified", () => {
  const row = rows["CCR-05140"];
  assert.ok(row, "CCR-05140 must resolve from the composable A00 traceability fragments");
  assert.equal(assertStrictVerifiedA00Row("CCR-05140", row), true);
  assert.equal(row.requirement, "universal command/action surface");
  assert.deepEqual(row.canonicalSourceIds, ["P2-0046"]);
  assert.deepEqual(row.owningPhases, ["P1.4"]);
  assert.deepEqual(row.dependencies, ["C0"]);
  assert.ok(row.implementationLocations.some((ref) => ref.includes("CommandRuntime")));
  assert.ok(row.implementationLocations.some((ref) => ref.includes("assertCommandEnvelope")));
  assert.ok(row.tests.positive.references.some((ref) => ref.includes("multiple registered action families")));
  assert.ok(row.tests.negative.references.some((ref) => ref.includes("malformed commands and unknown action types")));
  assert.ok(row.tests.failurePath.references.some((ref) => ref.includes("correlation or causation lineage")));

  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 1);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
