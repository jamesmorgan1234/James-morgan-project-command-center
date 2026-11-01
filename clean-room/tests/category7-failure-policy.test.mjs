import test from "node:test";
import assert from "node:assert/strict";
import {
  assertSideEffectAllowed,
  reserveSideEffect,
  verifySideEffect,
  writeCheckpoint,
  selectNextTask,
  assertAdvanceable,
  assertSkipAllowed,
  recordTaskOutcome,
  retryFingerprint,
  groupSystemicFailures,
  CircuitBreaker,
  QuarantineRegistry
} from "../dist/agency/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const checkpoint = { taskKey: "t1", stateVersion: 3, createdAt: T0 };

test("P7.2 fresh project-lock check precedes an external side effect", () => {
  assert.doesNotThrow(() => assertSideEffectAllowed({ projectLockToken: "fence-1", expectedProjectLockToken: "fence-1", stopOrPauseRequested: false }));
  assert.throws(() => assertSideEffectAllowed({ projectLockToken: "fence-0", expectedProjectLockToken: "fence-1", stopOrPauseRequested: false }), /lock is stale/);
  assert.throws(() => assertSideEffectAllowed({ projectLockToken: null, expectedProjectLockToken: "fence-1", stopOrPauseRequested: false }), /lock is stale/);
});

test("P7.2 fresh stop/pause check precedes an external side effect", () => {
  assert.throws(() => assertSideEffectAllowed({ projectLockToken: "fence-1", expectedProjectLockToken: "fence-1", stopOrPauseRequested: true }), /Stop or pause requested/);
});

test("P7.2 side effects are reserved atomically per key", () => {
  const reserved = new Set();
  reserveSideEffect("send:email:1", reserved);
  assert.throws(() => reserveSideEffect("send:email:1", reserved), /already reserved/);
  assert.doesNotThrow(() => reserveSideEffect("send:email:2", reserved));
});

test("P7.2 post-side-effect canonical verification", () => {
  assert.equal(verifySideEffect("done", "done"), "done");
  assert.throws(() => verifySideEffect("pending", "done"), /verification failed/);
  assert.throws(() => verifySideEffect(null, "done"), /verification failed/);
});

test("P7.2 checkpoint is written only after a meaningful stable state", () => {
  const written = writeCheckpoint({ taskKey: "t1", stable: true, stateVersion: 3 }, T0);
  assert.equal(written.stateVersion, 3);
  assert.throws(() => writeCheckpoint({ taskKey: "t1", stable: false, stateVersion: 3 }, T0), /stable state/);
});

test("P7.2 next-task selection follows a checkpoint", () => {
  assert.equal(selectNextTask(["t2", "t3"], checkpoint), "t2");
  assert.throws(() => selectNextTask(["t2"], null), /requires a checkpoint/);
});

test("P7.2 no task advancement on ambiguous evidence", () => {
  assert.doesNotThrow(() => assertAdvanceable({ ambiguous: false }));
  assert.throws(() => assertAdvanceable({ ambiguous: true }), /ambiguous evidence/);
});

test("P7.2 no automatic task skip without an explicit policy", () => {
  assert.doesNotThrow(() => assertSkipAllowed("explicit_allow"));
  assert.throws(() => assertSkipAllowed("forbid"), /explicit policy/);
});

test("P7.2 skipped task reason is recorded", () => {
  assert.equal(recordTaskOutcome("t1", "skipped", "dependency unavailable").outcome, "skipped");
  assert.throws(() => recordTaskOutcome("t1", "skipped", " "), /recorded reason/);
});

test("P7.2 excluded task reason is recorded", () => {
  assert.equal(recordTaskOutcome("t1", "excluded", "outside owner scope").reason, "outside owner scope");
});

test("P7.2 blocked task reason is recorded", () => {
  assert.equal(recordTaskOutcome("t1", "blocked", "approval required").outcome, "blocked");
});

test("P7.2 failed task reason is recorded", () => {
  assert.equal(recordTaskOutcome("t1", "failed", "executor error").outcome, "failed");
});

test("P7.2 reopened task reason is recorded", () => {
  assert.equal(recordTaskOutcome("t1", "reopened", "verification regressed").outcome, "reopened");
});

test("P7.2 task retry fingerprint is stable and specific", () => {
  assert.equal(retryFingerprint("task", ["p1", "t1"]), retryFingerprint("task", ["p1", "t1"]));
  assert.notEqual(retryFingerprint("task", ["p1", "t1"]), retryFingerprint("task", ["p1", "t2"]));
  assert.throws(() => retryFingerprint("task", []), /nonblank parts/);
});

test("P7.2 run retry fingerprint is stable and specific", () => {
  assert.equal(retryFingerprint("run", ["r1"]), retryFingerprint("run", ["r1"]));
  assert.notEqual(retryFingerprint("run", ["r1"]), retryFingerprint("task", ["r1"]));
});

test("P7.2 provider failure fingerprint is stable and specific", () => {
  assert.notEqual(retryFingerprint("provider", ["timeout"]), retryFingerprint("provider", ["auth"]));
});

test("P7.2 systemic failures group by fingerprint", () => {
  const groups = groupSystemicFailures(["a", "a", "b", "c", "c", "c"]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => [group.fingerprint, group.occurrences]), [["c", 3], ["a", 2]]);
});

test("P7.2 circuit-breaker threshold opens the circuit", () => {
  const breaker = new CircuitBreaker(2, 60000);
  breaker.recordFailure(new Date(T0));
  assert.equal(breaker.open, false);
  breaker.recordFailure(new Date(T0));
  assert.equal(breaker.open, true);
});

test("P7.2 circuit-breaker reset requires the cooldown to elapse", () => {
  const breaker = new CircuitBreaker(1, 60000);
  breaker.recordFailure(new Date("2026-10-31T10:00:00.000Z"));
  assert.equal(breaker.canProceed(new Date("2026-10-31T10:00:30.000Z")), false);
  assert.equal(breaker.canProceed(new Date("2026-10-31T10:01:00.000Z")), true);
});

test("P7.2 manual circuit-breaker reset closes it immediately", () => {
  const breaker = new CircuitBreaker(1, 60000);
  breaker.recordFailure(new Date(T0));
  breaker.manualReset();
  assert.equal(breaker.open, false);
  assert.equal(breaker.canProceed(new Date(T0)), true);
});

test("P7.2 executor is quarantined after repeated malformed results", () => {
  const registry = new QuarantineRegistry();
  assert.equal(registry.recordFailure("executor:x", 3), false);
  assert.equal(registry.recordFailure("executor:x", 3), false);
  assert.equal(registry.recordFailure("executor:x", 3), true);
  assert.throws(() => registry.assertAvailable("executor:x"), /Quarantined/);
});

test("P7.2 tool is quarantined after repeated integrity failures", () => {
  const registry = new QuarantineRegistry();
  registry.recordFailure("tool:browser", 2);
  assert.equal(registry.recordFailure("tool:browser", 2), true);
  assert.equal(registry.isQuarantined("tool:git"), false);
  registry.clear("tool:browser");
  assert.doesNotThrow(() => registry.assertAvailable("tool:browser"));
});
