import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const recovered = JSON.parse(readFileSync("evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json", "utf8"));
const rev3 = JSON.parse(readFileSync("../roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json", "utf8"));
const gate = readFileSync("scripts/category15-phase-gate-audit.mjs", "utf8");

const EXPECTED = Object.freeze({
  historicalPackageSha256: "fa9d8e57ba595f5ba507074c7eb0d2bc8840ad16b3750f47b6679ff146c6cc8a",
  canonicalCsvSha256: "1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2",
  canonicalJsonSha256: "0df16348d2117b86f8cbe050dc7263e1f965009034c9715cd45f5f2e72b61a2e",
  baselineCount: 5825,
  firstId: "CCR-00001",
  lastId: "CCR-05825",
  rev3Count: 27,
  currentCount: 5852,
  rev3FirstId: "CCR-05826",
  rev3LastId: "CCR-05852"
});

test("Task 5: recovered historical authority identity is immutable", () => {
  assert.equal(recovered.status, "RECOVERED_ORIGINAL_VERIFIED");
  assert.equal(recovered.historicalPackage.sha256, EXPECTED.historicalPackageSha256);
  assert.equal(recovered.canonicalCsv.sha256, EXPECTED.canonicalCsvSha256);
  assert.equal(recovered.canonicalJson.sha256, EXPECTED.canonicalJsonSha256);
});

test("Task 5: the recovered original ledger remains exactly CCR-00001 through CCR-05825", () => {
  for (const source of [recovered.canonicalCsv, recovered.canonicalJson]) {
    assert.equal(source.rowCount, EXPECTED.baselineCount);
    assert.equal(source.firstId, EXPECTED.firstId);
    assert.equal(source.lastId, EXPECTED.lastId);
    assert.equal(source.idContinuityVerified, true);
  }
  assert.equal(recovered.reconciliation.canonicalCount, EXPECTED.baselineCount);
  assert.equal(recovered.reconciliation.reversibleSourceLineageVerified, true);
});

test("Task 5: REV3 additions remain separate from and additive to the 5,825 historical baseline", () => {
  assert.equal(recovered.currentRequirementAuthority.historicalBaselineCount, EXPECTED.baselineCount);
  assert.equal(recovered.currentRequirementAuthority.rev3AdditionCount, EXPECTED.rev3Count);
  assert.equal(recovered.currentRequirementAuthority.currentCanonicalCount, EXPECTED.currentCount);
  assert.equal(rev3.baseline_canonical_requirement_total, EXPECTED.baselineCount);
  assert.equal(rev3.new_canonical_requirement_count, EXPECTED.rev3Count);
  assert.equal(rev3.owner_review_canonical_requirement_total, EXPECTED.currentCount);

  const ids = rev3.requirements.map((item) => item.id);
  assert.equal(ids.length, EXPECTED.rev3Count);
  assert.equal(ids[0], EXPECTED.rev3FirstId);
  assert.equal(ids.at(-1), EXPECTED.rev3LastId);
  assert.deepEqual(ids, Array.from({ length: EXPECTED.rev3Count }, (_, index) => `CCR-${String(5826 + index).padStart(5, "0")}`));
});

test("Task 5: Category 15 gate rejects drift in the recovered original authority", () => {
  assert.match(gate, /historicalPackage\?\.sha256 === "fa9d8e57ba595f5ba507074c7eb0d2bc8840ad16b3750f47b6679ff146c6cc8a"/);
  assert.match(gate, /csv\.sha256 === "1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2"/);
  assert.match(gate, /json\.sha256 === "0df16348d2117b86f8cbe050dc7263e1f965009034c9715cd45f5f2e72b61a2e"/);
  assert.match(gate, /csv\.rowCount === 5825 && json\.rowCount === 5825/);
  assert.match(gate, /csv\.firstId === "CCR-00001" && csv\.lastId === "CCR-05825"/);
  assert.match(gate, /current\.historicalBaselineCount === 5825 && current\.rev3AdditionCount === 27 && current\.currentCanonicalCount === 5852/);
});

test("Task 5: source recovery never falsely closes P15.1", () => {
  assert.equal(recovered.truth.originalSourceArtifactBlockerResolved, true);
  assert.equal(recovered.truth.fullRequirementToImplementationEvidenceClosureComplete, false);
  assert.match(gate, /canonicalRequirementAuthoritySatisfied && requirementTraceabilityClosureComplete/);
});
