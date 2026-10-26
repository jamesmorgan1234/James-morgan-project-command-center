import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const artifact = JSON.parse(
  fs.readFileSync(new URL("../evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json", import.meta.url), "utf8")
);

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const resolvedRows = artifact.canonicalIds.map((id) => ({
  id,
  ...structuredClone(artifact.effectiveRowModel.rowDefaults),
  ...(artifact.effectiveRowModel.rowOverrides[id] ?? {})
}));

test("P15.1 A00 progressive traceability is anchored to the recovered canonical authority", () => {
  assert.equal(artifact.schemaVersion, "cc-p15.1-a00-requirement-traceability-v1");
  assert.equal(artifact.scope, "HISTORICAL_A00_ONLY");
  assert.equal(artifact.status, "A00_REQUIREMENT_LEVEL_TRACEABILITY_IN_PROGRESS");
  assert.equal(artifact.architectureBranch, "A00");
  assert.equal(artifact.architectureOwner, "Owner Authority / Governance");
  assert.equal(artifact.sourceAuthority.path, "04_MASTER_RECONCILED_REQUIREMENTS.json");
  assert.equal(artifact.sourceAuthority.sha256, "0df16348d2117b86f8cbe050dc7263e1f965009034c9715cd45f5f2e72b61a2e");
  assert.equal(artifact.sourceAuthority.count, 5825);
  assert.equal(artifact.currentCanonicalRequirementTotal, 5852);
  assert.equal(artifact.fullP15_1ClosureSatisfied, false);
});

test("P15.1 A00 covers the 489 recovered canonical A00 IDs exactly once", () => {
  assert.equal(artifact.canonicalIdCount, 489);
  assert.equal(artifact.canonicalIds.length, 489);
  assert.equal(new Set(artifact.canonicalIds).size, 489);
  const digest = crypto.createHash("sha256").update(artifact.canonicalIds.join("\n")).digest("hex");
  assert.equal(digest, "701fde9bd0808f2e5c4bab7f9498dce128123eb07207375e6a336b2419d848c6");
  assert.equal(digest, artifact.canonicalIdSequenceSha256);
  assert.deepEqual(Object.keys(artifact.effectiveRowModel.rowOverrides).filter((id) => !artifact.canonicalIds.includes(id)), []);
});

test("P15.1 A00 effective rows cannot become VERIFIED without strict row-level closure evidence", () => {
  let verified = 0;
  let unverified = 0;
  let notApplicable = 0;

  for (const row of resolvedRows) {
    assert.equal(nonEmpty(row.id), true);
    assert.equal(nonEmpty(row.authoritativeSource), true, row.id);
    assert.equal(nonEmpty(row.sourceVersion), true, row.id);
    assert.equal(Array.isArray(row.applicableCompaniesOrCapabilities), true, row.id);
    assert.equal(Array.isArray(row.owningPhases), true, row.id);
    assert.equal(Array.isArray(row.dependencies), true, row.id);
    assert.equal(typeof row.dependenciesVerified, "boolean", row.id);
    assert.equal(Array.isArray(row.implementationLocations), true, row.id);
    assert.equal(Array.isArray(row.evidence), true, row.id);

    if (row.truthState === "VERIFIED") {
      verified += 1;
      assert.equal(row.blocker ?? null, null, row.id);
      assert.equal(row.dependenciesVerified, true, row.id);
      assert.equal(row.applicableCompaniesOrCapabilities.length > 0, true, row.id);
      assert.equal(row.owningPhases.length > 0, true, row.id);
      assert.equal(row.implementationLocations.length > 0, true, row.id);
      assert.equal(row.evidence.length > 0, true, row.id);
      assert.equal(nonEmpty(row.evidenceVersion), true, row.id);
      assert.equal(nonEmpty(row.evidenceEnvironment), true, row.id);
      for (const dimension of ["positive", "negative", "failurePath"]) {
        assert.equal(row.tests[dimension].applicable, true, `${row.id}:${dimension}`);
        assert.equal(row.tests[dimension].references.length > 0, true, `${row.id}:${dimension}`);
      }
    } else if (row.truthState === "NOT_APPLICABLE") {
      notApplicable += 1;
      assert.equal(row.blocker ?? null, null, row.id);
      assert.equal(nonEmpty(row.justification), true, row.id);
    } else {
      unverified += 1;
      assert.equal(row.truthState, "UNVERIFIED", row.id);
      assert.equal(nonEmpty(row.blocker), true, row.id);
      assert.equal(row.justification, null, row.id);
    }
  }

  assert.deepEqual(
    { total: resolvedRows.length, verified, unverified, notApplicable },
    artifact.closureSummary
  );
});
