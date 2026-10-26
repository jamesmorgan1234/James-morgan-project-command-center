import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  deriveAtomicRequirements,
  extractAmendmentSections,
  expandPhaseManifest,
  validateSectionCoverage
} from "../scripts/current-authority-lib.mjs";

const amendmentPath = "../roadmap/master-build-plan-owner-review/20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT.md";
const ownershipPath = "../roadmap/master-build-plan-owner-review/24_AMENDMENT20_REQUIREMENT_OWNERSHIP.json";
const manifestPath = "../roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json";
const roadmapPath = "../roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md";
const authorityAuditPath = "scripts/current-authority-audit.mjs";

const amendment = readFileSync(amendmentPath, "utf8");
const ownership = JSON.parse(readFileSync(ownershipPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const roadmap = readFileSync(roadmapPath, "utf8");
const authorityAudit = readFileSync(authorityAuditPath, "utf8");

const sections = extractAmendmentSections(amendment);
const expanded = expandPhaseManifest(manifest);
const atomicRequirements = sections.flatMap((section) =>
  deriveAtomicRequirements(section).map((atom) => ({
    ...atom,
    section: section.number,
    owners: ownership.sections?.[String(section.number)]?.owners ?? [],
    testClasses: ownership.sections?.[String(section.number)]?.testClasses ?? []
  }))
);

test("Task 9: Amendment 20 remains the current controlling architecture amendment", () => {
  assert.match(amendment, /Status:\*\* CURRENT CONTROLLING ARCHITECTURE AMENDMENT/);
  assert.match(amendment, /THE ENTIRE ECOSYSTEM LEARNS\. COMMAND CENTER LEARNS FROM THE ENTIRE ECOSYSTEM\. COMMAND CENTER REMAINS IN CONTROL\./);
  assert.match(roadmap, /20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT\.md/);
  assert.match(roadmap, /Current phase count:\*\* \*\*199\*\*/);
  assert.equal(manifest.currentPhaseCount, 199);
});

test("Task 9: Amendment 20 preserves exactly 45 numbered sections", () => {
  assert.equal(sections.length, 45);
  assert.deepEqual(sections.map((section) => section.number), Array.from({ length: 45 }, (_, index) => index + 1));
  assert.doesNotThrow(() => validateSectionCoverage(sections, ownership));
  assert.equal(Object.keys(ownership.sections ?? {}).length, 45);
});

test("Task 9: Amendment 20 derives exactly 520 stable atomic requirements", () => {
  assert.equal(atomicRequirements.length, 520);
  assert.equal(new Set(atomicRequirements.map((item) => item.id)).size, 520);
  assert.ok(atomicRequirements.every((item) => /^A20-S\d{2}-R\d{3}$/.test(item.id)));
  assert.ok(atomicRequirements.every((item) => typeof item.text === "string" && item.text.length > 2));
});

test("Task 9: every Amendment 20 atomic requirement remains owned and test-classified by current phases", () => {
  const currentPhases = new Set(expanded.phaseIds);
  for (const item of atomicRequirements) {
    assert.ok(item.owners.length > 0, `${item.id}: no owner`);
    assert.ok(item.testClasses.length > 0, `${item.id}: no test class`);
    for (const owner of item.owners) assert.ok(currentPhases.has(owner), `${item.id}: owner ${owner} is not in current 199-phase authority`);
  }
});

test("Task 9: the live authority audit permanently enforces Amendment 20 section, atomic, ownership, and 199-phase linkage", () => {
  assert.match(authorityAudit, /20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT\.md/);
  assert.match(authorityAudit, /24_AMENDMENT20_REQUIREMENT_OWNERSHIP\.json/);
  assert.match(authorityAudit, /validateSectionCoverage\(sections, ownership\)/);
  assert.match(authorityAudit, /deriveAtomicRequirements\(section\)/);
  assert.match(authorityAudit, /amendment20SectionCount: sections\.length/);
  assert.match(authorityAudit, /amendment20AtomicRequirementCount: atomicRequirements\.length/);
  assert.match(authorityAudit, /owner .* is not a current phase/);
});
