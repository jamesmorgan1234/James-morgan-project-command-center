import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const artifact = JSON.parse(fs.readFileSync(new URL("../evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json", import.meta.url), "utf8"));
const rows = artifact.effectiveRowModel.rowOverrides;
const expected = {
  "CCR-05221": ["rule IDs", "P2-0129"],
  "CCR-05222": ["rule scope", "P2-0130"],
  "CCR-05223": ["rule source", "P2-0131"],
  "CCR-05224": ["rule precedence", "P2-0132"],
  "CCR-05225": ["rule version", "P2-0133"],
  "CCR-05226": ["rule effective date", "P2-0134"],
  "CCR-05227": ["supersession links", "P2-0135"],
  "CCR-05228": ["conflict detection", "P2-0136"],
  "CCR-05229": ["unresolved-conflict state", "P2-0137"]
};

test("A00 P1.6 governance cluster is grounded to canonical authority", () => {
  for (const [id, [requirement, sourceId]] of Object.entries(expected)) {
    const row = rows[id];
    assert.ok(row, id);
    assert.equal(row.requirement, requirement, id);
    assert.deepEqual(row.canonicalSourceIds, [sourceId], id);
    assert.deepEqual(row.canonicalSourceFiles, ["Command_Center_Passes_2_3_4_Provisional_Master_Roadmap.md"], id);
    assert.deepEqual(row.owningPhases, ["P1.6"], id);
    assert.deepEqual(row.dependencies, ["C0"], id);
    assert.equal(row.dependenciesVerified, true, id);
    assert.equal(row.truthState, "VERIFIED", id);
    assert.ok(row.implementationLocations.some((ref) => ref.includes("clean-room/src/kernel/ledger.ts#")), id);
    for (const dimension of ["positive", "negative", "failurePath"]) {
      assert.equal(row.tests[dimension].applicable, true, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.some((ref) => ref.includes("category1-authority-ledger.test.mjs")), `${id}:${dimension}`);
    }
    assert.equal(row.evidenceVersion, "git:27f4c766d075438050cff30c6769b5722dcc4dba; ci:40321816166", id);
    assert.ok(row.evidenceEnvironment.includes("ubuntu-24.04 / Node 22.23.3"), id);
  }
});

test("A00 P1.6 promotion keeps P15.1 open until all A00 rows close", () => {
  assert.deepEqual(artifact.closureSummary, { total: 489, verified: 12, unverified: 477, notApplicable: 0 });
  assert.equal(artifact.fullP15_1ClosureSatisfied, false);
  assert.equal(artifact.status, "A00_REQUIREMENT_LEVEL_TRACEABILITY_IN_PROGRESS");
});
