import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourcePath = "../roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json";
const tracePath = "evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json";
const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const trace = JSON.parse(readFileSync(tracePath, "utf8"));

const expectedIds = Array.from({ length: 27 }, (_, i) => `CCR-${String(5826 + i).padStart(5, "0")}`);
const sourceById = new Map(source.requirements.map((row) => [row.id, row]));
const traceById = new Map(trace.requirements.map((row) => [row.id, row]));

function repoPathExists(path) {
  const relative = path.startsWith("clean-room/") ? path.slice("clean-room/".length) : `../${path}`;
  return existsSync(relative);
}

test("Task 6 preservation: REV3 remains the exact 27-row additive authority CCR-05826 through CCR-05852", () => {
  assert.equal(source.baseline_canonical_requirement_total, 5825);
  assert.equal(source.new_canonical_requirement_count, 27);
  assert.equal(source.owner_review_canonical_requirement_total, 5852);
  assert.equal(source.new_canonical_range, "CCR-05826–CCR-05852");
  assert.equal(source.requirements.length, 27);
  assert.deepEqual(source.requirements.map((row) => row.id), expectedIds);
  assert.equal(new Set(source.requirements.map((row) => row.id)).size, 27);
});

test("Task 6 preservation: all 27 REV3 requirement-level closures remain VERIFIED without downgrade", () => {
  assert.equal(trace.schemaVersion, "cc-p15.1-rev3-requirement-traceability-v1");
  assert.equal(trace.scope, "REV3_ONLY");
  assert.equal(trace.status, "REV3_REQUIREMENT_LEVEL_CLOSURE_VERIFIED");
  assert.equal(trace.sourceAuthority.path, "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json");
  assert.equal(trace.sourceAuthority.blobSha, "95e5bcf6f988373b8b1974d8aa239f9ea1124fff");
  assert.equal(trace.sourceAuthority.count, 27);
  assert.equal(trace.baselineAuthority.count, 5825);
  assert.equal(trace.currentCanonicalRequirementTotal, 5852);
  assert.equal(trace.fullP15_1ClosureSatisfied, false);
  assert.deepEqual(trace.closureSummary, {
    verified: 27,
    unverified: 0,
    notApplicable: 0,
    note: "REV3-only closure is verified at the exact tested head. Full P15.1 remains open for the 5,825-row historical baseline."
  });
  assert.equal(trace.requirements.length, 27);
  assert.deepEqual(trace.requirements.map((row) => row.id), expectedIds);
  assert.equal(new Set(trace.requirements.map((row) => row.id)).size, 27);
  assert.ok(trace.requirements.every((row) => row.truthState === "VERIFIED"));
  assert.ok(trace.requirements.every((row) => row.blocker === null));
  assert.ok(trace.requirements.every((row) => row.justification === null));
});

test("Task 6 preservation: every VERIFIED REV3 row retains requirement-specific implementation, tests, evidence, and source provenance", () => {
  assert.deepEqual([...traceById.keys()], expectedIds);
  assert.deepEqual([...sourceById.keys()], expectedIds);

  for (const id of expectedIds) {
    const authoritative = sourceById.get(id);
    const row = traceById.get(id);
    assert.ok(authoritative, `${id}: authoritative source row missing`);
    assert.ok(row, `${id}: verified traceability row missing`);
    assert.equal(row.truthState, "VERIFIED", `${id}: verification downgraded`);
    assert.equal(row.authoritativeSource.path, "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json", `${id}: source path drifted`);
    assert.equal(row.authoritativeSource.version, "REV3@95e5bcf6f988373b8b1974d8aa239f9ea1124fff", `${id}: source version drifted`);
    assert.equal(row.dependenciesVerified, true, `${id}: dependencies no longer verified`);
    assert.ok(Array.isArray(row.owningPhases) && row.owningPhases.length > 0, `${id}: owning phase missing`);
    assert.ok(Array.isArray(row.implementationLocations) && row.implementationLocations.length > 0, `${id}: implementation evidence missing`);
    assert.ok(row.implementationLocations.every(repoPathExists), `${id}: implementation location no longer exists`);

    for (const kind of ["positive", "negative", "failurePath"]) {
      const testEvidence = row.tests?.[kind];
      assert.equal(testEvidence?.applicable, true, `${id}: ${kind} test applicability lost`);
      assert.ok(Array.isArray(testEvidence.references) && testEvidence.references.length > 0, `${id}: ${kind} test reference missing`);
      for (const ref of testEvidence.references) {
        const [path, anchor] = ref.split("#");
        assert.ok(path && anchor === id, `${id}: ${kind} test reference is not requirement-specific`);
        assert.ok(repoPathExists(path), `${id}: ${kind} test file no longer exists: ${path}`);
      }
    }

    assert.ok(Array.isArray(row.evidence) && row.evidence.length > 0, `${id}: exact evidence missing`);
    assert.match(row.evidenceVersion, /^[a-f0-9]{40}$/, `${id}: evidence version is not immutable commit identity`);
    assert.match(row.evidenceEnvironment, /isolated-nonproduction/, `${id}: evidence environment lost isolation identity`);
  }
});
