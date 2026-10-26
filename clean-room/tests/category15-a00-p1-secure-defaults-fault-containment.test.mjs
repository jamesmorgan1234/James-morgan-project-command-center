import test from "node:test";
import assert from "node:assert/strict";
import { assertStrictVerifiedA00Row, resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

test("A00 P1 secure-defaults and fault-containment rows are strictly verified", () => {
  for (const id of ["CCR-05131", "CCR-05133"]) {
    assert.ok(rows[id], `${id} must resolve from the composable A00 traceability fragments`);
    assert.equal(assertStrictVerifiedA00Row(id, rows[id]), true);
  }

  const secureDefaults = rows["CCR-05131"];
  assert.equal(secureDefaults.requirement, "secure defaults");
  assert.deepEqual(secureDefaults.canonicalSourceIds, ["P2-0037"]);
  assert.deepEqual(secureDefaults.owningPhases, ["P1.8"]);
  assert.ok(secureDefaults.implementationLocations.some((ref) => ref.includes("SafeFeatureFlags")));
  assert.ok(secureDefaults.tests.failurePath.references.some((ref) => ref.includes("fails closed")));

  const containment = rows["CCR-05133"];
  assert.equal(containment.requirement, "fault containment");
  assert.deepEqual(containment.canonicalSourceIds, ["P2-0039"]);
  assert.deepEqual(containment.owningPhases, ["P1.3"]);
  assert.ok(containment.implementationLocations.some((ref) => ref.includes("ModuleRegistry.replace")));
  assert.ok(containment.tests.failurePath.references.some((ref) => ref.includes("preserves the last valid record")));

  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 2);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
