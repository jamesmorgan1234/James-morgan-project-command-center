import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertAcyclic,
  assertResumeState,
  deriveAtomicRequirements,
  expandPhaseManifest,
  extractAmendmentSections,
  validateEvidenceReceipt,
  validateSectionCoverage
} from "../scripts/current-authority-lib.mjs";

const repoRoot = resolve(process.cwd(), "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));
const read = (path) => readFileSync(resolve(repoRoot, path), "utf8");

test("current 199-phase manifest expands uniquely and preserves explicit PIF order", () => {
  const manifest = readJson("roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json");
  const expanded = expandPhaseManifest(manifest);
  assert.equal(expanded.phaseIds.length, 199);
  assert.equal(new Set(expanded.phaseIds).size, 199);
  assert.deepEqual(manifest.pif.executionOrder, ["PIF.1","PIF.2","PIF.3","PIF.5","PIF.7","PIF.8","PIF.4","PIF.6","PIF.9","PIF.10"]);
  assertAcyclic(Object.keys(manifest.pif.edges), manifest.pif.edges, "PIF fixture");
});

test("duplicate or missing phase definitions fail closed", () => {
  const duplicate = { currentPhaseCount: 2, categories: [
    { id: "A", count: 1, phaseSpec: { prefix: "P1.", start: 1, end: 1 } },
    { id: "B", count: 1, phaseSpec: { prefix: "P1.", start: 1, end: 1 } }
  ] };
  assert.throws(() => expandPhaseManifest(duplicate), /duplicate phase id/);
  const missing = { currentPhaseCount: 2, categories: [{ id: "A", count: 1, phaseSpec: { prefix: "P1.", start: 1, end: 1 } }] };
  assert.throws(() => expandPhaseManifest(missing), /phase total mismatch/);
});

test("dependency cycles and dangling dependencies fail closed", () => {
  assert.throws(() => assertAcyclic(["A","B"], { A:["B"], B:["A"] }, "test"), /cycle/);
  assert.throws(() => assertAcyclic(["A"], { A:["MISSING"] }, "test"), /unknown/);
});

test("Amendment 20 sections derive stable atomic identities with complete ownership", () => {
  const amendment = read("roadmap/master-build-plan-owner-review/20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT.md");
  const mapping = readJson("roadmap/master-build-plan-owner-review/24_AMENDMENT20_REQUIREMENT_OWNERSHIP.json");
  const sections = extractAmendmentSections(amendment);
  assert.equal(sections.length, 45);
  assert.equal(validateSectionCoverage(sections, mapping), true);
  const first = deriveAtomicRequirements(sections[0]);
  assert.ok(first.length >= 5);
  assert.equal(first[0].id, "A20-S01-R001");
});

test("evidence receipts require exact phase, exact head, verified status and evidence", () => {
  const receipt = { phaseId: "P15.3", gitSha: "a".repeat(40), status: "VERIFIED_COMPLETE", evidence: ["run:1"] };
  assert.equal(validateEvidenceReceipt(receipt, { phaseId: "P15.3", headSha: "a".repeat(40) }), true);
  assert.equal(validateEvidenceReceipt(receipt, { phaseId: "P15.4", headSha: "a".repeat(40) }), false);
  assert.equal(validateEvidenceReceipt(receipt, { phaseId: "P15.3", headSha: "b".repeat(40) }), false);
  assert.equal(validateEvidenceReceipt({ ...receipt, evidence: [] }, { phaseId: "P15.3", headSha: "a".repeat(40) }), false);
});

test("current resume authority must record resumed R1 state and reject stale pause text", () => {
  assert.equal(assertResumeState("STATUS BUILD RESUMED / R1 ACTIVE"), true);
  assert.throws(() => assertResumeState("BUILD PAUSED. DO NOT RESUME BUILD EXECUTION. R1 ACTIVE"));
});
