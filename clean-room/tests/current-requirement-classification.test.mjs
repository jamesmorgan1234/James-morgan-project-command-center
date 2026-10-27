import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  effectiveRequirementIdsForBranch,
  resolveCurrentRequirementClassification,
  validateCurrentRequirementClassificationOverlay
} from "../scripts/current-requirement-classification.mjs";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const repoRoot = resolve(process.cwd(), "..");
const overlay = JSON.parse(readFileSync(resolve(repoRoot, "roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json"), "utf8"));
const recovered = JSON.parse(readFileSync(resolve(process.cwd(), "evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json"), "utf8"));
const historicalCcr1 = {
  id: "CCR-00001",
  requirement: "**Single architecture authority** — one approved architecture document controls the implementation.",
  sourceIds: ["F-0001"],
  sourceFiles: ["Pasted markdown(2).md"],
  architectureBranch: "A06",
  architectureOwner: "Data / Knowledge / Provenance / Assets"
};

test("current classification overlay is pinned to the recovered immutable canonical source", () => {
  assert.equal(validateCurrentRequirementClassificationOverlay(overlay, {
    canonicalJsonSha256: recovered.canonicalJson.sha256,
    canonicalCsvSha256: recovered.canonicalCsv.sha256,
    historicalBaselineCount: recovered.canonicalJson.rowCount
  }), true);
  assert.equal(recovered.canonicalJson.firstId, "CCR-00001");
  assert.equal(recovered.canonicalJson.idContinuityVerified, true);
});

test("CCR-00001 preserves F-0001 and historical A06 while current authority resolves it to A00", () => {
  const resolved = resolveCurrentRequirementClassification(historicalCcr1, overlay);
  assert.equal(resolved.id, "CCR-00001");
  assert.equal(historicalCcr1.sourceIds[0], "F-0001");
  assert.equal(resolved.historicalArchitectureBranch, "A06");
  assert.equal(resolved.historicalArchitectureOwner, "Data / Knowledge / Provenance / Assets");
  assert.equal(resolved.effectiveArchitectureBranch, "A00");
  assert.equal(resolved.effectiveArchitectureOwner, "Owner Authority / Governance");
  assert.equal(resolved.classificationSource, "current-authority-overlay");
});

test("current classification fails closed when historical provenance does not match the immutable overlay anchor", () => {
  assert.throws(() => resolveCurrentRequirementClassification({ ...historicalCcr1, sourceIds: ["F-9999"] }, overlay), /historical source IDs do not match/);
  assert.throws(() => resolveCurrentRequirementClassification({ ...historicalCcr1, architectureBranch: "A00" }, overlay), /historical architecture branch does not match/);
  assert.throws(() => resolveCurrentRequirementClassification({ ...historicalCcr1, requirement: "changed" }, overlay), /historical requirement text does not match/);
});

test("duplicate current classification overrides are rejected", () => {
  const duplicate = { ...overlay, overrides: [...overlay.overrides, { ...overlay.overrides[0] }] };
  assert.throws(() => validateCurrentRequirementClassificationOverlay(duplicate), /duplicate current requirement classification override/);
});

test("effective A00 membership includes CCR-00001 without rewriting the 489-row historical A00 scope", () => {
  const report = resolveA00Traceability();
  assert.equal(report.canonicalIdCount, 489);
  assert.equal(report.closureSummary.total, 489);
  assert.equal(report.currentEffectiveClassification.historicalCanonicalIdCount, 489);
  assert.equal(report.currentEffectiveClassification.canonicalIdCount, 490);
  assert.equal(report.currentEffectiveClassification.canonicalIds[0], "CCR-00001");
  assert.ok(report.currentEffectiveClassification.canonicalIds.includes("CCR-00002"));
  assert.deepEqual(effectiveRequirementIdsForBranch(report.canonicalIds, "A00", overlay), report.currentEffectiveClassification.canonicalIds);
});
