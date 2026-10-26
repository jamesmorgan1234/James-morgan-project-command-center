import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;
const evidenceVersion = "git:22a788909a5f46971b8d2bd14a83b80e809e781f; ci:40359580425";

const expected = {
  "CCR-05124": { text: "compatibility windows", source: "P2-0029", phase: "P1.8" },
  "CCR-05132": { text: "module isolation", source: "P2-0038", phase: "P1.3" },
  "CCR-05240": { text: "no silent policy broadening", source: "P2-0150", phase: "P1.5" }
};

test("A00 compatibility, module-isolation and anti-policy-broadening rows are strictly grounded", () => {
  for (const [id, expectation] of Object.entries(expected)) {
    const row = rows[id];
    assert.ok(row, id);
    assert.equal(row.requirement, expectation.text, id);
    assert.deepEqual(row.canonicalSourceIds, [expectation.source], id);
    assert.deepEqual(row.canonicalSourceFiles, ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"], id);
    assert.equal(row.classification, "GOVERNANCE / STANDARD", id);
    assert.deepEqual(row.owningPhases, [expectation.phase], id);
    assert.deepEqual(row.dependencies, ["C0"], id);
    assert.equal(row.dependenciesVerified, true, id);
    assert.equal(row.truthState, "VERIFIED", id);
    assert.ok(row.implementationLocations.length >= 2, id);
    for (const dimension of ["positive", "negative", "failurePath"]) {
      assert.equal(row.tests[dimension].applicable, true, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.length > 0, `${id}:${dimension}`);
    }
    assert.equal(row.evidenceVersion, evidenceVersion, id);
    assert.ok(row.evidenceEnvironment.includes("ubuntu-24.04 / Node 22.23.3"), id);
    assert.ok(row.evidenceEnvironment.includes("exact head 22a788909a5f46971b8d2bd14a83b80e809e781f"), id);
    assert.ok(row.evidence.some((entry) => entry.includes("1089/1089 module tests passed")), id);
    assert.ok(row.evidence.some((entry) => entry.includes("final Category15 phase gate remained intentionally open")), id);
    assert.equal(row.blocker, null, id);
  }
});

test("resolved A00 closure retains compatibility-isolation-policy verification while later clusters remain append-only", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 53);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
