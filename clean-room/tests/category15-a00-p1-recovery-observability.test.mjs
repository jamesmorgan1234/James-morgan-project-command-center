import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;
const evidenceVersion = "git:60312a0bb71fb84304af622ed186e5521e4412c4; ci:40356744383";

const expected = {
  "CCR-05117": { text: "graceful degradation", source: "P2-0022", phase: "P1.9" },
  "CCR-05127": { text: "observability hooks", source: "P2-0032", phase: "P1.9" },
  "CCR-05128": { text: "trace IDs", source: "P2-0034", phase: "P1.4" }
};

test("A00 P1 recovery and observability rows are strictly grounded to canonical authority and exact-head evidence", () => {
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
    assert.ok(row.evidenceEnvironment.includes("exact head 60312a0bb71fb84304af622ed186e5521e4412c4"), id);
    assert.ok(row.evidence.some((entry) => entry.includes("1079/1079 module tests passed")), id);
    assert.ok(row.evidence.some((entry) => entry.includes("final Category15 phase gate remained intentionally open")), id);
    assert.equal(row.blocker, null, id);
  }
});

test("resolved A00 closure retains recovery-observability verification while later clusters remain append-only", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 47);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
