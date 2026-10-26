import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandPhaseManifest, extractRoadmapPhaseIds } from "../scripts/current-authority-lib.mjs";

const manifestPath = "../roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json";
const currentRoadmapPath = "../roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md";
const historicalRoadmapPath = "../roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md";
const authorityAuditPath = "scripts/current-authority-audit.mjs";
const category15GatePath = "scripts/category15-phase-gate-audit.mjs";

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const currentRoadmap = readFileSync(currentRoadmapPath, "utf8");
const historicalRoadmap = readFileSync(historicalRoadmapPath, "utf8");
const authorityAudit = readFileSync(authorityAuditPath, "utf8");
const category15Gate = readFileSync(category15GatePath, "utf8");
const expanded = expandPhaseManifest(manifest);

const expectedAdditions = [
  "P0.11",
  ...Array.from({ length: 10 }, (_, index) => `PIF.${index + 1}`)
];

function historicalPhaseIds(text) {
  return [...text.matchAll(/^###\s+(P\d+\.\d+)\s+/gm)].map((match) => match[1]);
}

test("Task 8: the machine authority is the current 199-phase roadmap, not the historical 188-phase snapshot", () => {
  assert.equal(manifest.status, "CURRENT_BUILD_AUTHORITY");
  assert.equal(manifest.currentPhaseCount, 199);
  assert.equal(manifest.historicalBaselinePhaseCount, 188);
  assert.equal(manifest.sourceRoadmap, "roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md");
  assert.equal(manifest.historicalBaseline, "roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md");
  assert.match(manifest.supersession.phaseCount, /supersedes/i);
  assert.match(manifest.supersession.historicalIds, /Historical IDs remain immutable/i);
});

test("Task 8: expanding current authority yields exactly 199 unique phase IDs", () => {
  assert.equal(expanded.phaseIds.length, 199);
  assert.equal(new Set(expanded.phaseIds).size, 199);
  assert.equal(manifest.categories.reduce((sum, category) => sum + category.count, 0), 199);
});

test("Task 8: all 188 historical phases are preserved and the only new phase IDs are P0.11 plus PIF.1-PIF.10", () => {
  const historicalIds = historicalPhaseIds(historicalRoadmap);
  const historicalSet = new Set(historicalIds);
  const currentSet = new Set(expanded.phaseIds);

  assert.equal(historicalSet.size, 188);
  for (const id of historicalSet) assert.ok(currentSet.has(id), `historical phase missing from current authority: ${id}`);

  const additions = expanded.phaseIds.filter((id) => !historicalSet.has(id)).sort();
  assert.deepEqual(additions, [...expectedAdditions].sort());
  assert.deepEqual([...manifest.additions].sort(), [...expectedAdditions].sort());
  assert.equal(188 + expectedAdditions.length, 199);
});

test("Task 8: Roadmap 22 is complete for the machine manifest and explicitly derives 199 from 188 + 1 + 10", () => {
  const roadmapIds = extractRoadmapPhaseIds(currentRoadmap);
  const roadmapSet = new Set(roadmapIds);

  assert.equal(roadmapSet.size, 199);
  for (const id of expanded.phaseIds) assert.ok(roadmapSet.has(id), `current roadmap missing machine phase: ${id}`);
  assert.match(currentRoadmap, /Current phase count:\*\* \*\*199\*\*/);
  assert.match(currentRoadmap, /188 \+ 1 \+ 10 = 199 current phases/);
  assert.match(currentRoadmap, /Historical roadmap files remain evidence; this file is the current integrated roadmap view/i);
});

test("Task 8: current authority audit rejects any regression to the 188-phase snapshot", () => {
  assert.match(authorityAudit, /23_CURRENT_199_PHASE_MACHINE_MANIFEST\.json/);
  assert.match(authorityAudit, /22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE\.md/);
  assert.match(authorityAudit, /currentSet\.size !== 199/);
  assert.match(authorityAudit, /historicalSet\.size !== 188/);
  assert.match(authorityAudit, /expectedAdditions = \["P0\.11"/);
});

test("Task 8: Category 15 qualification consumes the current machine authority rather than the historical snapshot", () => {
  assert.match(category15Gate, /23_CURRENT_199_PHASE_MACHINE_MANIFEST\.json/);
  assert.match(category15Gate, /currentPhaseCount: phaseIds\.length/);
  assert.match(category15Gate, /allCategory15DefinitionsPresent/);
  assert.doesNotMatch(category15Gate, /14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN\.md/);
});
