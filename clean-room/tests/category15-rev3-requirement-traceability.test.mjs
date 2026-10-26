import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const artifact = JSON.parse(
  fs.readFileSync(new URL("../evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json", import.meta.url), "utf8")
);

const expectedIds = Array.from({ length: 27 }, (_, index) => `CCR-${String(5826 + index).padStart(5, "0")}`);

test("P15.1 REV3 traceability is REV3-complete but cannot masquerade as full 5,852-row closure", () => {
  assert.equal(artifact.schemaVersion, "cc-p15.1-rev3-requirement-traceability-v1");
  assert.equal(artifact.scope, "REV3_ONLY");
  assert.equal(artifact.status, "REV3_REQUIREMENT_LEVEL_CLOSURE_VERIFIED");
  assert.equal(artifact.sourceAuthority.count, 27);
  assert.equal(artifact.baselineAuthority.count, 5825);
  assert.equal(artifact.currentCanonicalRequirementTotal, 5852);
  assert.equal(artifact.fullP15_1ClosureSatisfied, false);
  assert.notEqual("clean-room/evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json", "clean-room/evidence/category15-requirement-traceability.json");
});

test("P15.1 REV3 traceability covers CCR-05826 through CCR-05852 exactly once and in canonical order", () => {
  const ids = artifact.requirements.map((row) => row.id);
  assert.deepEqual(ids, expectedIds);
  assert.equal(new Set(ids).size, expectedIds.length);
});

test("P15.1 REV3 traceability never treats incomplete categorized evidence as VERIFIED", () => {
  let verified = 0;
  let unverified = 0;
  for (const row of artifact.requirements) {
    assert.equal(row.authoritativeSource.path, artifact.sourceAuthority.path);
    assert.equal(row.authoritativeSource.version, `REV3@${artifact.sourceAuthority.blobSha}`);
    assert.equal(row.applicableCompanies.length > 0, true, row.id);
    assert.equal(row.applicableCapabilities.length > 0, true, row.id);
    assert.equal(row.owningPhases.length > 0, true, row.id);
    assert.equal(row.implementationLocations.length > 0, true, row.id);
    assert.equal(row.evidence.length > 0, true, row.id);
    assert.equal(Boolean(row.evidenceVersion), true, row.id);
    assert.equal(Boolean(row.evidenceEnvironment), true, row.id);

    if (row.truthState === "VERIFIED") {
      verified += 1;
      assert.equal(row.blocker, null, row.id);
      assert.equal(row.dependenciesVerified, true, row.id);
      for (const dimension of ["positive", "negative", "failurePath"]) {
        assert.equal(row.tests[dimension].applicable, true, `${row.id}:${dimension}`);
        assert.equal(row.tests[dimension].references.length > 0, true, `${row.id}:${dimension}`);
      }
      continue;
    }

    assert.equal(row.truthState, "UNVERIFIED", row.id);
    unverified += 1;
    assert.equal(typeof row.blocker, "string", row.id);
    assert.equal(row.blocker.trim().length > 0, true, row.id);
    const hasMissingCategorizedEvidence = ["positive", "negative", "failurePath"]
      .some((dimension) => row.tests[dimension].applicable && row.tests[dimension].references.length === 0);
    assert.equal(hasMissingCategorizedEvidence || row.dependenciesVerified === false, true, row.id);
  }

  assert.equal(verified, artifact.closureSummary.verified);
  assert.equal(unverified, artifact.closureSummary.unverified);
  assert.equal(verified, 27);
  assert.equal(unverified, 0);
  assert.equal(artifact.closureSummary.notApplicable, 0);
  assert.equal(verified + unverified, 27);
});
