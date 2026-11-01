import test from "node:test";
import assert from "node:assert/strict";
import {
  assertFallbackAllowed,
  defineTaskContract,
  assertContractSatisfied,
  TaskBudgetRunner,
  classifyTask,
  compensationPlan,
  assertEvidenceStrength,
  assertVerificationTimely,
  manualReviewFallback,
  QuarantineRegistry
} from "../dist/agency/index.js";

function contract(overrides = {}) {
  return defineTaskContract({
    preconditions: ["owner-approved"],
    postconditions: ["artifact-written"],
    invariants: ["lock-held"],
    sideEffectBudget: 2,
    externalCallBudget: 3,
    maxDurationMs: 60000,
    cancellationCheckEvery: 2,
    resumable: true,
    atomic: false,
    compensation: "rollback",
    evidenceStrength: "verified",
    verificationTimeoutMs: 30000,
    manualReviewFallback: true,
    ...overrides
  });
}

test("P7.2 provider is quarantined after dangerous inconsistency", () => {
  const registry = new QuarantineRegistry();
  registry.recordFailure("provider:payments", 2);
  assert.equal(registry.recordFailure("provider:payments", 2), true);
  assert.throws(() => registry.assertAvailable("provider:payments"), /Quarantined/);
});

test("P7.2 no fallback to a lower-trust executor for a protected action", () => {
  assert.doesNotThrow(() => assertFallbackAllowed("trusted", "standard", true));
  assert.throws(() => assertFallbackAllowed("untrusted", "trusted", true), /lower-trust executor/);
  assert.doesNotThrow(() => assertFallbackAllowed("untrusted", "trusted", false));
});

test("P7.2 task preconditions are checked", () => {
  const defined = contract();
  assert.doesNotThrow(() => assertContractSatisfied(defined, { preconditions: ["owner-approved"], postconditions: ["artifact-written"], invariants: ["lock-held"] }));
  assert.throws(() => assertContractSatisfied(defined, { preconditions: [], postconditions: ["artifact-written"], invariants: ["lock-held"] }), /preconditions not satisfied/);
});

test("P7.2 task postconditions are checked", () => {
  const defined = contract();
  assert.throws(() => assertContractSatisfied(defined, { preconditions: ["owner-approved"], postconditions: [], invariants: ["lock-held"] }), /postconditions not satisfied/);
});

test("P7.2 task invariants are checked", () => {
  const defined = contract();
  assert.throws(() => assertContractSatisfied(defined, { preconditions: ["owner-approved"], postconditions: ["artifact-written"], invariants: [] }), /invariants not satisfied/);
});

test("P7.2 task side-effect budget is enforced", () => {
  const runner = new TaskBudgetRunner(contract({ sideEffectBudget: 1 }), "2026-10-31T10:00:00.000Z");
  runner.consumeSideEffect();
  assert.throws(() => runner.consumeSideEffect(), /side-effect budget exhausted/);
});

test("P7.2 task external-call budget is enforced", () => {
  const runner = new TaskBudgetRunner(contract({ externalCallBudget: 1 }), "2026-10-31T10:00:00.000Z");
  runner.consumeExternalCall();
  assert.throws(() => runner.consumeExternalCall(), /external-call budget exhausted/);
});

test("P7.2 task maximum duration is enforced", () => {
  const runner = new TaskBudgetRunner(contract({ maxDurationMs: 60000 }), "2026-10-31T10:00:00.000Z");
  assert.doesNotThrow(() => runner.assertWithinDuration("2026-10-31T10:00:59.000Z"));
  assert.throws(() => runner.assertWithinDuration("2026-10-31T10:01:01.000Z"), /maximum duration/);
});

test("P7.2 task cancellation check cadence is honoured", () => {
  const runner = new TaskBudgetRunner(contract({ cancellationCheckEvery: 2 }), "2026-10-31T10:00:00.000Z");
  assert.equal(runner.shouldCheckCancellation(0), true);
  assert.equal(runner.shouldCheckCancellation(1), false);
  assert.equal(runner.shouldCheckCancellation(2), true);
  assert.equal(runner.cancellationChecks, 2);
});

test("P7.2 task resumability classification", () => {
  assert.equal(classifyTask(contract({ resumable: true })).resumability, "resumable");
  assert.equal(classifyTask(contract({ resumable: false })).resumability, "not_resumable");
});

test("P7.2 task atomicity classification", () => {
  assert.equal(classifyTask(contract({ atomic: true, postconditions: ["a"] })).atomicity, "atomic");
  assert.equal(classifyTask(contract({ atomic: false })).atomicity, "compensable");
});

test("P7.2 task compensation strategy is required for non-atomic work", () => {
  assert.deepEqual([...compensationPlan(contract({ atomic: false, compensation: "rollback" }))], ["rollback"]);
  assert.deepEqual([...compensationPlan(contract({ atomic: true, compensation: "none", postconditions: ["a"] }))], ["none"]);
  assert.throws(() => compensationPlan(contract({ atomic: false, compensation: "none" })), /requires a compensation strategy/);
});

test("P7.2 task evidence strength requirement is enforced", () => {
  assert.doesNotThrow(() => assertEvidenceStrength("observed", "verified"));
  assert.throws(() => assertEvidenceStrength("verified", "observed"), /below the required/);
});

test("P7.2 task verification timeout is enforced", () => {
  assert.doesNotThrow(() => assertVerificationTimely(0, 30000, 30000));
  assert.throws(() => assertVerificationTimely(0, 30001, 30000), /timed out/);
});

test("P7.2 task manual-review fallback is available and bounded", () => {
  assert.equal(manualReviewFallback(contract(), "verification impossible").action, "manual_review");
  assert.throws(() => manualReviewFallback(contract({ manualReviewFallback: false }), "x"), /not permitted/);
  assert.throws(() => manualReviewFallback(contract(), " "), /failure reason/);
});
