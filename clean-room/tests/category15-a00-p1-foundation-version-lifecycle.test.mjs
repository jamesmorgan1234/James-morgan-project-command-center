import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;
const evidenceVersion = "git:5b22d22cef2e1581553ffd50881578f9cfc3a8e7; ci:40353251285";

const expected = {
  "CCR-05102": { text: "stable typed identifiers", source: "P2-0006", phase: "P1.1" },
  "CCR-05103": { text: "schema versioning", source: "P2-0007", phase: "P1.8" },
  "CCR-05104": { text: "registry versioning", source: "P2-0008", phase: "P1.2" },
  "CCR-05105": { text: "command/event versioning", source: "P2-0009", phase: "P1.4" },
  "CCR-05106": { text: "capability lifecycle states", source: "P2-0010", phase: "P1.1" },
  "CCR-05107": { text: "module lifecycle states", source: "P2-0011", phase: "P1.1" },
  "CCR-05109": { text: "dependency declaration", source: "P2-0013", phase: "P1.3" },
  "CCR-05110": { text: "install/enable/disable/uninstall contracts", source: "P2-0014", phase: "P1.3" }
};

test("A00 P1 foundation version/lifecycle rows are strictly grounded to canonical authority and exact-head evidence", () => {
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
    assert.ok(row.evidenceEnvironment.includes("exact head 5b22d22cef2e1581553ffd50881578f9cfc3a8e7"), id);
    assert.ok(row.evidence.some((entry) => entry.includes("1063/1063 module tests passed")), id);
    assert.equal(row.blocker, null, id);
  }
});

test("connection-gated provider lifecycle remains unpromoted until its activation prerequisite is actually satisfied", () => {
  assert.equal(rows["CCR-05108"], undefined);
});

test("resolved A00 closure retains foundation-contract verification while later clusters remain append-only", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 37);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
