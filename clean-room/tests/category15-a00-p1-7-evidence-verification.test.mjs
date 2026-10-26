import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

const expected = {
  "CCR-00831": {
    text: "**One verification path for every completion claim.**",
    sources: ["F-0836"],
    files: ["Pasted markdown(2).md"],
    classification: "GOVERNANCE / STANDARD"
  },
  "CCR-00843": {
    text: "**No completion exists without verification.**",
    sources: ["F-0848"],
    files: ["Pasted markdown(2).md"],
    classification: "GOVERNANCE / STANDARD"
  },
  "CCR-01793": {
    text: "**Implemented but unverified never counts complete.**",
    sources: ["F-1799", "P4-0108"],
    files: ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md", "Pasted markdown(2).md"],
    classification: "TEST / EVIDENCE"
  },
  "CCR-01847": {
    text: "**Verified truth beats attractive status text.**",
    sources: ["F-1853"],
    files: ["Pasted markdown(2).md"],
    classification: "GOVERNANCE / STANDARD"
  }
};

test("A00 P1.7 completion-truth cluster is strictly grounded to canonical authority and exact-head evidence", () => {
  for (const [id, expectation] of Object.entries(expected)) {
    const row = rows[id];
    assert.ok(row, id);
    assert.equal(row.requirement, expectation.text, id);
    assert.deepEqual(row.canonicalSourceIds, expectation.sources, id);
    assert.deepEqual(row.canonicalSourceFiles, expectation.files, id);
    assert.equal(row.classification, expectation.classification, id);
    assert.deepEqual(row.owningPhases, ["P1.7"], id);
    assert.deepEqual(row.dependencies, ["C0"], id);
    assert.equal(row.dependenciesVerified, true, id);
    assert.equal(row.truthState, "VERIFIED", id);
    assert.ok(row.implementationLocations.every((ref) => ref.startsWith("clean-room/src/kernel/evidence.ts#")), id);
    for (const dimension of ["positive", "negative", "failurePath"]) {
      assert.equal(row.tests[dimension].applicable, true, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.length > 0, `${id}:${dimension}`);
    }
    assert.equal(row.evidenceVersion, "git:ab531148d1bcac0368fb3a7d1b7796ee73b81594; ci:40343325960", id);
    assert.ok(row.evidenceEnvironment.includes("ubuntu-24.04 / Node 22.23.3"), id);
    assert.ok(row.evidenceEnvironment.includes("exact head ab531148d1bcac0368fb3a7d1b7796ee73b81594"), id);
    assert.equal(row.blocker, null, id);
  }
});

test("resolved A00 closure retains the four evidenced P1.7 rows as later clusters are added", () => {
  assert.equal(report.closureSummary.total, 489);
  assert.ok(report.closureSummary.verified >= 20);
  assert.equal(report.closureSummary.unverified, 489 - report.closureSummary.verified - report.closureSummary.notApplicable);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
