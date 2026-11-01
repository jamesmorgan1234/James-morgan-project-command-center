import test from "node:test";
import assert from "node:assert/strict";
import { validateCutoverPlan, assertDependenciesFresh } from "../dist/agency/index.js";

function plan(overrides = {}) {
  return {
    fullReplacement: true,
    partialCutover: false,
    stagingMatchesProduction: true,
    productionDataReadOnlyInStaging: true,
    syntheticFixtures: true,
    checklist: ["verify backups", "verify DNS"],
    dryRunCompleted: true,
    expectedDurationMinutes: 90,
    order: { frontend: 1, serviceWorker: 2, featureFlags: 3, validation: 4 },
    smokeTest: ["sign-in", "load home"],
    featureExpansionAllowed: false,
    changeFreeze: true,
    productionBranchProtected: true,
    ...overrides
  };
}

test("P7.2 cutover ships a full replacement developed off production", () => {
  assert.doesNotThrow(() => validateCutoverPlan(plan()));
  assert.throws(() => validateCutoverPlan(plan({ fullReplacement: false })), /full replacement/);
});

test("P7.2 no partial cutover", () => {
  assert.throws(() => validateCutoverPlan(plan({ partialCutover: true })), /Partial cutover/);
});

test("P7.2 staging matches the production architecture", () => {
  assert.throws(() => validateCutoverPlan(plan({ stagingMatchesProduction: false })), /match the production architecture/);
});

test("P7.2 production data in staging is read-only", () => {
  assert.throws(() => validateCutoverPlan(plan({ productionDataReadOnlyInStaging: false })), /read-only/);
});

test("P7.2 staging uses synthetic fixtures", () => {
  assert.throws(() => validateCutoverPlan(plan({ syntheticFixtures: false })), /synthetic test fixtures/);
});

test("P7.2 cutover checklist is required", () => {
  assert.throws(() => validateCutoverPlan(plan({ checklist: [] })), /requires a checklist/);
});

test("P7.2 cutover dry run is required", () => {
  assert.throws(() => validateCutoverPlan(plan({ dryRunCompleted: false })), /completed dry run/);
});

test("P7.2 cutover duration expectation is documented", () => {
  assert.throws(() => validateCutoverPlan(plan({ expectedDurationMinutes: 0 })), /duration expectation/);
});

test("P7.2 cutover dependencies are verified immediately beforehand", () => {
  assert.doesNotThrow(() => assertDependenciesFresh("2026-10-31T10:00:00.000Z", "2026-10-31T10:30:00.000Z", 60));
  assert.throws(() => assertDependenciesFresh("2026-10-31T08:00:00.000Z", "2026-10-31T10:30:00.000Z", 60), /immediately beforehand/);
  assert.throws(() => assertDependenciesFresh("2026-10-31T11:00:00.000Z", "2026-10-31T10:30:00.000Z", 60), /after cutover/);
});

test("P7.2 frontend release order is locked", () => {
  assert.throws(() => validateCutoverPlan(plan({ order: { frontend: 5, serviceWorker: 2, featureFlags: 3, validation: 4 } })), /Frontend release/);
});

test("P7.2 service-worker release order is locked", () => {
  assert.throws(() => validateCutoverPlan(plan({ order: { frontend: 1, serviceWorker: 9, featureFlags: 3, validation: 4 } })), /Service-worker release/);
});

test("P7.2 feature-flag activation order is locked", () => {
  assert.throws(() => validateCutoverPlan(plan({ order: { frontend: 1, serviceWorker: 2, featureFlags: 8, validation: 4 } })), /Feature-flag activation/);
});

test("P7.2 post-cutover validation sequence is locked", () => {
  assert.throws(() => validateCutoverPlan(plan({ order: { frontend: 1, serviceWorker: 2, featureFlags: 3, validation: 0 } })), /post-cutover validation/);
});

test("P7.2 critical-path smoke test follows cutover", () => {
  assert.throws(() => validateCutoverPlan(plan({ smokeTest: [] })), /smoke test/);
});

test("P7.2 no feature expansion during the cutover window", () => {
  assert.throws(() => validateCutoverPlan(plan({ featureExpansionAllowed: true })), /Feature expansion/);
});

test("P7.2 cutover freeze applies to unrelated changes", () => {
  assert.throws(() => validateCutoverPlan(plan({ changeFreeze: false })), /frozen/);
});

test("P7.2 production branch is protected", () => {
  assert.throws(() => validateCutoverPlan(plan({ productionBranchProtected: false })), /must be protected/);
});
