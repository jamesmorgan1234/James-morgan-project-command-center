import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const recovered = JSON.parse(readFileSync("evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json", "utf8"));
const rev3 = JSON.parse(readFileSync("../roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json", "utf8"));
const rev3Trace = JSON.parse(readFileSync("evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json", "utf8"));
const spec = readFileSync("../roadmap/master-build-plan-owner-review/17_SPECIFICATION_LOCK_V2_1.md", "utf8");
const gate = readFileSync("scripts/category15-phase-gate-audit.mjs", "utf8");

const EXPECTED = Object.freeze({
  baseline: 5825,
  additions: 27,
  current: 5852,
  baselineFirstId: "CCR-00001",
  baselineLastId: "CCR-05825",
  rev3FirstId: "CCR-05826",
  rev3LastId: "CCR-05852"
});

const numericId = (id) => Number.parseInt(id.slice("CCR-".length), 10);
const expectedRev3Ids = Array.from(
  { length: EXPECTED.additions },
  (_, index) => `CCR-${String(EXPECTED.baseline + index + 1).padStart(5, "0")}`
);

test("Task 7: the current canonical requirement authority remains exactly 5,852", () => {
  assert.equal(EXPECTED.baseline + EXPECTED.additions, EXPECTED.current);

  assert.equal(recovered.canonicalCsv.rowCount, EXPECTED.baseline);
  assert.equal(recovered.canonicalJson.rowCount, EXPECTED.baseline);
  assert.equal(recovered.reconciliation.canonicalCount, EXPECTED.baseline);
  assert.equal(recovered.currentRequirementAuthority.historicalBaselineCount, EXPECTED.baseline);
  assert.equal(recovered.currentRequirementAuthority.rev3AdditionCount, EXPECTED.additions);
  assert.equal(recovered.currentRequirementAuthority.currentCanonicalCount, EXPECTED.current);

  assert.equal(rev3.baseline_canonical_requirement_total, EXPECTED.baseline);
  assert.equal(rev3.new_canonical_requirement_count, EXPECTED.additions);
  assert.equal(rev3.owner_review_canonical_requirement_total, EXPECTED.current);

  assert.equal(rev3Trace.baselineAuthority.count, EXPECTED.baseline);
  assert.equal(rev3Trace.sourceAuthority.count, EXPECTED.additions);
  assert.equal(rev3Trace.currentCanonicalRequirementTotal, EXPECTED.current);
});

test("Task 7: the 5,852 authority is continuous with no gap, overlap, duplicate REV3 ID, or hidden extra row", () => {
  assert.equal(recovered.canonicalCsv.firstId, EXPECTED.baselineFirstId);
  assert.equal(recovered.canonicalCsv.lastId, EXPECTED.baselineLastId);
  assert.equal(recovered.canonicalJson.firstId, EXPECTED.baselineFirstId);
  assert.equal(recovered.canonicalJson.lastId, EXPECTED.baselineLastId);
  assert.equal(recovered.canonicalCsv.idContinuityVerified, true);
  assert.equal(recovered.canonicalJson.idContinuityVerified, true);

  const rev3Ids = rev3.requirements.map((row) => row.id);
  assert.equal(rev3Ids.length, EXPECTED.additions);
  assert.equal(new Set(rev3Ids).size, EXPECTED.additions);
  assert.deepEqual(rev3Ids, expectedRev3Ids);
  assert.equal(rev3Ids[0], EXPECTED.rev3FirstId);
  assert.equal(rev3Ids.at(-1), EXPECTED.rev3LastId);
  assert.equal(numericId(EXPECTED.baselineLastId) + 1, numericId(EXPECTED.rev3FirstId));
  assert.equal(numericId(EXPECTED.rev3LastId), EXPECTED.current);

  const tracedIds = rev3Trace.requirements.map((row) => row.id);
  assert.deepEqual(tracedIds, expectedRev3Ids);
  assert.equal(new Set(tracedIds).size, EXPECTED.additions);
});

test("Task 7: specification and Category 15 gate remain locked to the 5,852 total", () => {
  assert.match(spec, /Historical canonical requirement total:\*\* \*\*5,852\*\*/);
  assert.match(spec, /immutable historical 5,852-requirement \/ 188-phase baseline/);

  assert.match(gate, /const canonicalTotalsValid = \/5,852\//);
  assert.match(gate, /rev3\.baseline_canonical_requirement_total === 5825/);
  assert.match(gate, /rev3\.new_canonical_requirement_count === 27/);
  assert.match(gate, /rev3\.owner_review_canonical_requirement_total === 5852/);
  assert.match(gate, /current\.historicalBaselineCount === 5825 && current\.rev3AdditionCount === 27 && current\.currentCanonicalCount === 5852/);
  assert.match(gate, /lockedCanonicalRequirementCount: 5852/);
  assert.match(gate, /lockedBaselineRequirementCount: 5825/);
  assert.match(gate, /lockedRev3RequirementCount: 27/);
});

test("Task 7: preserving the 5,852 count never falsely closes P15.1", () => {
  assert.equal(recovered.truth.fullRequirementToImplementationEvidenceClosureComplete, false);
  assert.equal(rev3Trace.fullP15_1ClosureSatisfied, false);
  assert.match(recovered.truth.note, /all 5,852 requirements/);
  assert.match(gate, /canonicalRequirementAuthoritySatisfied && requirementTraceabilityClosureComplete/);
  assert.match(gate, /all 5,852 requirement-level implementation\/test\/evidence closure rows/);
});
