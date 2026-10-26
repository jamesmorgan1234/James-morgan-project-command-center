import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const artifact = JSON.parse(
  fs.readFileSync(new URL("../evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json", import.meta.url), "utf8")
);

const verifiedIds = ["CCR-00734", "CCR-05237", "CCR-05608"];
const overrides = artifact.effectiveRowModel.rowOverrides;

test("A00 verified governance rows are explicit canonical requirements with strict traceability", () => {
  assert.deepEqual(Object.keys(overrides).sort(), [...verifiedIds].sort());
  for (const id of verifiedIds) {
    const row = overrides[id];
    assert.equal(row.truthState, "VERIFIED", id);
    assert.equal(typeof row.requirement, "string", id);
    assert.ok(row.requirement.trim().length > 0, id);
    assert.ok(Array.isArray(row.canonicalSourceIds) && row.canonicalSourceIds.length > 0, id);
    assert.ok(Array.isArray(row.canonicalSourceFiles) && row.canonicalSourceFiles.length > 0, id);
    assert.equal(row.classification, "GOVERNANCE / STANDARD", id);
    assert.ok(Array.isArray(row.applicableCompaniesOrCapabilities) && row.applicableCompaniesOrCapabilities.length > 0, id);
    assert.ok(Array.isArray(row.owningPhases) && row.owningPhases.length > 0, id);
    assert.equal(row.dependenciesVerified, true, id);
    assert.ok(Array.isArray(row.implementationLocations) && row.implementationLocations.length > 0, id);
    for (const dimension of ["positive", "negative", "failurePath"]) {
      assert.equal(row.tests[dimension].applicable, true, `${id}:${dimension}`);
      assert.ok(row.tests[dimension].references.length > 0, `${id}:${dimension}`);
    }
    assert.ok(row.evidence.length > 0, id);
    assert.match(row.evidenceVersion, /git:[a-f0-9]{40}/, id);
    assert.ok(row.evidenceEnvironment.includes("build/spec-lock-v2-clean-room"), id);
    assert.equal(row.blocker, null, id);
    assert.equal(row.justification, null, id);
  }
  assert.deepEqual(artifact.closureSummary, { total: 489, verified: 3, unverified: 486, notApplicable: 0 });
  assert.equal(artifact.fullP15_1ClosureSatisfied, false);
});

test("A00 dependency-linting row is owned by P0.7 and does not invent C0 dependencies", () => {
  const row = overrides["CCR-00734"];
  assert.equal(row.requirement, "**Dependency linting.**");
  assert.deepEqual(row.owningPhases, ["P0.7"]);
  assert.deepEqual(row.dependencies, []);
  assert.ok(row.implementationLocations.some((ref) => ref.includes("current-authority-lib.mjs#assertAcyclic")));
});

test("A00 emergency-stop row is bound to P7.19 containment and current C7 dependency authority", () => {
  const row = overrides["CCR-05237"];
  assert.equal(row.requirement, "emergency stop");
  assert.deepEqual(row.owningPhases, ["P7.19"]);
  assert.deepEqual(row.dependencies, ["C1", "C2", "C3", "C5", "C6"]);
  assert.ok(row.implementationLocations.some((ref) => ref.includes("agency/control.ts#requestStop")));
});

test("A00 Work-boundary row spans the Boundary Office and Work ladder without implicit escalation", () => {
  const row = overrides["CCR-05608"];
  assert.equal(row.requirement, "Work is a capability boundary, not an implicit escalation.");
  assert.deepEqual(row.owningPhases, ["P7.11", "P7.12"]);
  assert.deepEqual(row.dependencies, ["C1", "C2", "C3", "C5", "C6"]);
  assert.ok(row.implementationLocations.some((ref) => ref.includes("agency/work-ladder.ts#decideWorkLadder")));
  assert.ok(row.evidence.some((ref) => ref.includes("no automatic Work launch")));
});
