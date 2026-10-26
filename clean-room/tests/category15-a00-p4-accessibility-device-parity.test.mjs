import test from "node:test";
import assert from "node:assert/strict";
import { assertStrictVerifiedA00Row, resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

const expected = {
  "CCR-05134": { requirement: "accessibility foundations", source: "P2-0040" },
  "CCR-05142": { requirement: "phone/desktop parity rules", source: "P2-0048" },
  "CCR-05154": { requirement: "accessibility and reduced-motion behavior", source: "P2-0060" }
};

test("A00 P4 accessibility/device-parity rows are strictly verified", () => {
  for (const [id, authority] of Object.entries(expected)) {
    const row = rows[id];
    assert.ok(row, `${id} must resolve from the composable A00 traceability fragments`);
    assert.equal(assertStrictVerifiedA00Row(id, row), true);
    assert.equal(row.requirement, authority.requirement);
    assert.deepEqual(row.canonicalSourceIds, [authority.source]);
    assert.deepEqual(row.owningPhases, ["P4.7"]);
    assert.deepEqual(row.dependencies, ["C1", "C2", "C3"]);
    assert.ok(row.implementationLocations.some((ref) => ref.includes("clean-room/src/ui/device.ts") || ref.includes("clean-room/public/")));
    assert.ok(row.tests.positive.references.length > 0);
    assert.ok(row.tests.negative.references.length > 0);
    assert.ok(row.tests.failurePath.references.length > 0);
    assert.match(row.evidenceVersion, /^git:[a-f0-9]{40}; ci:[0-9]+$/);
    assert.match(row.evidenceEnvironment, /build\/spec-lock-v2-clean-room/);
    assert.equal(row.blocker, null);
  }

  assert.equal(report.closureSummary.total, 489);
  assert.equal(
    report.closureSummary.verified + report.closureSummary.unverified + report.closureSummary.notApplicable,
    report.closureSummary.total
  );
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
