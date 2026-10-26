import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;
const evidenceVersion = "git:e1710fcdc2b96349256c4a04d0cfb6ef3c9933d3; ci:40351132976";

const expected = {
  "CCR-00828": { text: "**One controlled path for every important side effect.**", sources: ["F-0833"], files: ["Pasted markdown(2).md"] },
  "CCR-05293": { text: "retry rules", sources: ["P2-0205"], files: ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"] },
  "CCR-05294": { text: "idempotency support", sources: ["P2-0206"], files: ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"] },
  "CCR-05477": { text: "duplicate suppression", sources: ["P2-0427"], files: ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"] },
  "CCR-05617": { text: "transaction idempotency", sources: ["P3-0047"], files: ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"] },
  "CCR-05621": { text: "idempotency and retry policy", sources: ["P3-0051"], files: ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"] }
};

test("A00 P1.4 controlled-side-effect cluster is strictly grounded to canonical authority and exact-head evidence", () => {
  for (const [id, expectation] of Object.entries(expected)) {
    const row = rows[id];
    assert.ok(row, id);
    assert.equal(row.requirement, expectation.text, id);
    assert.deepEqual(row.canonicalSourceIds, expectation.sources, id);
    assert.deepEqual(row.canonicalSourceFiles, expectation.files, id);
    assert.equal(row.classification, "GOVERNANCE / STANDARD", id);
    assert.deepEqual(row.owningPhases, ["P1.4"], id);
    assert.deepEqual(row.dependencies, ["C0"], id);
    assert.equal(row.dependenciesVerified, true, id);
    assert.equal(row.truthState, "VERIFIED", id);
    assert.ok(row.implementationLocations.length > 0, id);
    assert.ok(row.implementationLocations.every((ref) => ref.startsWith("clean-room/src/kernel/operations.ts#")), id);
    for (const dimension of ["positive", "negative", "failurePath"]) {
      assert.equal(row.tests[dimension].applicable, true, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.length > 0, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.every((ref) => ref.startsWith("clean-room/tests/category1-controlled-side-effects.test.mjs :: ")), `${id}:${dimension}`);
    }
    assert.equal(row.evidenceVersion, evidenceVersion, id);
    assert.ok(row.evidenceEnvironment.includes("ubuntu-24.04 / Node 22.23.3"), id);
    assert.ok(row.evidenceEnvironment.includes("exact head e1710fcdc2b96349256c4a04d0cfb6ef3c9933d3"), id);
    assert.ok(row.evidence.some((entry) => entry.includes("1047/1047 module tests passed")), id);
    assert.equal(row.blocker, null, id);
  }
});

test("resolved A00 closure retains controlled-side-effect verification while later clusters remain append-only", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 26);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
