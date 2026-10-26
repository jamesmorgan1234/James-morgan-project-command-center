import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;
const evidenceVersion = "git:875c167b2c781d904155d000cb26da29580048d4; ci:40352417191";

const expected = {
  "CCR-00826": { text: "**One source of truth.**", source: "F-0831" },
  "CCR-00827": { text: "**One architectural owner for every responsibility.**", source: "F-0832" },
  "CCR-00829": { text: "**One defined extension path for every expandable subsystem.**", source: "F-0834" }
};

test("A00 P1.10 architecture ownership and extension rows are strictly grounded to canonical authority and exact-head evidence", () => {
  for (const [id, expectation] of Object.entries(expected)) {
    const row = rows[id];
    assert.ok(row, id);
    assert.equal(row.requirement, expectation.text, id);
    assert.deepEqual(row.canonicalSourceIds, [expectation.source], id);
    assert.deepEqual(row.canonicalSourceFiles, ["Pasted markdown(2).md"], id);
    assert.equal(row.classification, "GOVERNANCE / STANDARD", id);
    assert.deepEqual(row.owningPhases, ["P1.10"], id);
    assert.deepEqual(row.dependencies, ["C0"], id);
    assert.equal(row.dependenciesVerified, true, id);
    assert.equal(row.truthState, "VERIFIED", id);
    assert.ok(row.implementationLocations.length >= 3, id);
    assert.ok(row.implementationLocations.every((ref) => ref.startsWith("clean-room/src/kernel/architecture-contract.ts#")), id);
    for (const dimension of ["positive", "negative", "failurePath"]) {
      assert.equal(row.tests[dimension].applicable, true, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.length > 0, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.every((ref) => ref.startsWith("clean-room/tests/category1-architecture-contract.test.mjs :: ")), `${id}:${dimension}`);
    }
    assert.equal(row.evidenceVersion, evidenceVersion, id);
    assert.ok(row.evidenceEnvironment.includes("ubuntu-24.04 / Node 22.23.3"), id);
    assert.ok(row.evidenceEnvironment.includes("exact head 875c167b2c781d904155d000cb26da29580048d4"), id);
    assert.ok(row.evidence.some((entry) => entry.includes("1054/1054 module tests passed")), id);
    assert.equal(row.blocker, null, id);
  }
});

test("resolved A00 closure retains architecture-contract verification while later clusters remain append-only", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 29);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
