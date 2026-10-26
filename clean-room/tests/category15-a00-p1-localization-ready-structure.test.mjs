import test from "node:test";
import assert from "node:assert/strict";
import { assertStrictVerifiedA00Row, resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

test("A00 P1 localization-ready structure row is strictly verified", () => {
  const row = rows["CCR-05135"];
  assert.ok(row, "CCR-05135 must resolve from the composable A00 traceability fragments");
  assert.equal(assertStrictVerifiedA00Row("CCR-05135", row), true);
  assert.equal(row.requirement, "localization-ready structure");
  assert.deepEqual(row.canonicalSourceIds, ["P2-0041"]);
  assert.deepEqual(row.owningPhases, ["P1.8"]);
  assert.deepEqual(row.dependencies, ["C0"]);
  assert.ok(row.implementationLocations.some((ref) => ref.includes("LocalizationRegistry")));
  assert.ok(row.tests.positive.references.some((ref) => ref.includes("canonicalizes locales and resolves exact catalogs")));
  assert.ok(row.tests.negative.references.some((ref) => ref.includes("deterministic language then default fallbacks")));
  assert.ok(row.tests.failurePath.references.some((ref) => ref.includes("fails closed on invalid catalogs")));

  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 1);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
