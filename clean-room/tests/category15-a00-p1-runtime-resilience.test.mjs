import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;
const evidenceVersion = "git:b2476481738d20f0bace99e3d172ac26ac7ba2ee; ci:40355769100";

const expected = {
  "CCR-05113": { text: "optimistic/pessimistic concurrency where appropriate", source: "P2-0017", phase: "P1.4" },
  "CCR-05115": { text: "deterministic retries", source: "P2-0020", phase: "P1.4" },
  "CCR-05118": { text: "transactional boundaries", source: "P2-0023", phase: "P1.4" },
  "CCR-05119": { text: "compensating transactions", source: "P2-0024", phase: "P1.4" },
  "CCR-05122": { text: "feature-flag safety", source: "P2-0027", phase: "P1.8" },
  "CCR-05125": { text: "deprecation windows", source: "P2-0030", phase: "P1.8" },
  "CCR-05288": { text: "deprecation state", source: "P2-0200", phase: "P1.8" }
};

test("A00 P1 runtime resilience rows are strictly grounded to canonical authority and exact-head evidence", () => {
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
    assert.ok(row.evidenceEnvironment.includes("exact head b2476481738d20f0bace99e3d172ac26ac7ba2ee"), id);
    assert.ok(row.evidence.some((entry) => entry.includes("1077/1077 module tests passed")), id);
    assert.ok(row.evidence.some((entry) => entry.includes("final Category15 phase gate remained intentionally open")), id);
    assert.equal(row.blocker, null, id);
  }
});

test("resolved A00 closure retains runtime-resilience verification while later clusters remain append-only", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 44);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
