import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const artifact = JSON.parse(
  fs.readFileSync(new URL("../evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json", import.meta.url), "utf8")
);
const expectedIds = Array.from({ length: 27 }, (_, index) => `CCR-${String(5826 + index).padStart(5, "0")}`);

test("P15.1 REV3 traceability is explicitly partial and cannot masquerade as full 5,852-row closure", () => {
  assert.equal(artifact.schemaVersion, "cc-p15.1-rev3-traceability-v1");
  assert.equal(artifact.scope, "REV3_ONLY");
  assert.equal(artifact.sourceAuthority.count, 27);
  assert.equal(artifact.baselineAuthority.count, 5825);
  assert.equal(artifact.currentCanonicalRequirementTotal, 5852);
  assert.equal(artifact.fullP15_1ClosureSatisfied, false);
});

test("P15.1 REV3 traceability covers CCR-05826 through CCR-05852 exactly once and in canonical order", () => {
  const ids = artifact.requirements.map((row) => row.id);
  assert.deepEqual(ids, expectedIds);
  assert.equal(new Set(ids).size, expectedIds.length);
});

test("P15.1 REV3 traceability never promotes incomplete categorized evidence", () => {
  let verified = 0;
  let unverified = 0;
  for (const row of artifact.requirements) {
    assert.match(row.owningPhase, /^P\d+\.\d+$/);
    assert.equal(Boolean(row.capability), true, row.id);
    assert.equal(row.implementation.length > 0, true, row.id);
    for (const ref of [...row.implementation, ...row.testEvidence]) {
      assert.equal(typeof artifact.evidenceCatalog[ref], "string", `${row.id}:${ref}`);
    }
    if (row.truthState === "VERIFIED") {
      verified += 1;
      assert.equal(row.blocker, null, row.id);
      assert.equal(row.categorizedTestsComplete, true, row.id);
      assert.equal(row.dependenciesVerified, true, row.id);
      assert.equal(row.testEvidence.length > 0, true, row.id);
    } else {
      unverified += 1;
      assert.equal(row.truthState, "UNVERIFIED", row.id);
      assert.equal(row.categorizedTestsComplete, false, row.id);
      assert.equal(typeof row.blocker, "string", row.id);
      assert.equal(row.blocker.trim().length > 0, true, row.id);
    }
  }
  assert.equal(verified, artifact.closureSummary.verified);
  assert.equal(unverified, artifact.closureSummary.unverified);
  assert.equal(verified + unverified, 27);
});
