import test from "node:test";
import assert from "node:assert/strict";
import {
  RunCoordinator,
  planRevalidation,
  assertExecutorCompatible,
  toolHealthSnapshotAtStart,
  assertFreshOwnerRule,
  acquireProjectLock,
  renewProjectLock,
  TaskClaimStore
} from "../dist/agency/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const T1 = "2026-10-31T11:00:00.000Z";
const T2 = "2026-10-31T12:00:00.000Z";

function command(id, overrides = {}) {
  return { id, kind: "start", runKey: `run-${id}`, taskKey: `task-${id}`, workFingerprint: `work-${id}`, issuedAt: T0, ...overrides };
}

function executor(overrides = {}) {
  return { key: "exec-1", capabilityVersion: 3, permissionVersion: 2, capabilityKeys: ["projects.write"], toolHealth: { git: "healthy", browser: "degraded" }, ...overrides };
}

test("P7.2 project lock renewal extends the lease", () => {
  const store = new TaskClaimStore();
  const claim = acquireProjectLock(store, "p1", "worker-1", T0, T1);
  const renewed = renewProjectLock(store, "p1", "worker-1", claim.fencingToken, "2026-10-31T10:30:00.000Z", T2);
  assert.equal(renewed.expiresAt, T2);
});

test("P7.2 expired project lock cannot commit", () => {
  const store = new TaskClaimStore();
  const claim = acquireProjectLock(store, "p1", "worker-1", T0, T1);
  assert.throws(() => store.assertCommitAllowed("project:p1", "worker-1", claim.fencingToken, T2), /Expired task claim/);
});

test("P7.2 one active project run at a time", () => {
  const coordinator = new RunCoordinator();
  coordinator.startRun("p1", "run-1");
  assert.throws(() => coordinator.startRun("p1", "run-2"), /already has an active run/);
  coordinator.finishRun("p1");
  assert.doesNotThrow(() => coordinator.startRun("p1", "run-2"));
});

test("P7.2 one portfolio lane is active by default", () => {
  const coordinator = new RunCoordinator();
  coordinator.startRun("p1", "run-1", "portfolio");
  assert.throws(() => coordinator.startRun("p2", "run-2", "portfolio"), /lane already active/);
  coordinator.finishRun("p1", "portfolio");
  assert.doesNotThrow(() => coordinator.startRun("p2", "run-2", "portfolio"));
});

test("P7.2 run deduplication rejects a second command for the same run", () => {
  const coordinator = new RunCoordinator();
  coordinator.accept(command("a"));
  const decision = coordinator.accept(command("b", { runKey: "run-a", taskKey: "task-b", workFingerprint: "work-b" }));
  assert.equal(decision.disposition, "duplicate_run");
  assert.equal(decision.duplicateOf, "a");
});

test("P7.2 task deduplication rejects a second command for the same task", () => {
  const coordinator = new RunCoordinator();
  coordinator.accept(command("a"));
  const decision = coordinator.accept(command("b", { runKey: "run-b", taskKey: "task-a", workFingerprint: "work-b" }));
  assert.equal(decision.disposition, "duplicate_task");
  assert.equal(decision.duplicateOf, "a");
});

test("P7.2 equivalent work deduplication rejects a different run with the same work", () => {
  const coordinator = new RunCoordinator();
  coordinator.accept(command("a"));
  const decision = coordinator.accept(command("b", { runKey: "run-b", taskKey: "task-b", workFingerprint: "work-a" }));
  assert.equal(decision.disposition, "equivalent_work");
  assert.equal(decision.duplicateOf, "a");
});

test("P7.2 pending start commands coalesce to the earliest entry", () => {
  const coordinator = new RunCoordinator();
  coordinator.accept(command("late", { issuedAt: T2, workFingerprint: "work-same" }));
  coordinator.accept(command("early", { issuedAt: T0, workFingerprint: "work-same" }));
  coordinator.accept(command("other", { workFingerprint: "work-other" }));
  const coalesced = coordinator.coalesce().filter((entry) => entry.kind === "start");
  assert.equal(coalesced.length, 2);
  assert.equal(coalesced.find((entry) => entry.workFingerprint === "work-same").id, "early");
});

test("P7.2 stop command takes precedence over queued work", () => {
  const coordinator = new RunCoordinator();
  coordinator.accept(command("start", { issuedAt: T0 }));
  coordinator.accept(command("stop", { kind: "stop", issuedAt: T2 }));
  assert.equal(coordinator.next().id, "stop");
});

test("P7.2 pause command takes precedence over the next task", () => {
  const coordinator = new RunCoordinator();
  coordinator.accept(command("start", { issuedAt: T0 }));
  coordinator.accept(command("pause", { kind: "pause", issuedAt: T2 }));
  assert.equal(coordinator.next().id, "pause");
});

test("P7.2 owner scope change invalidates a stale plan", () => {
  const stamp = { scopeVersion: "scope-1", ruleVersion: "rule-1", toolAvailabilityVersion: "tools-1", providerConnected: true };
  assert.equal(planRevalidation(stamp, { ...stamp, scopeVersion: "scope-2" }), "scope_changed");
  assert.equal(planRevalidation(stamp, { ...stamp }), "none");
});

test("P7.2 owner rule change revalidates the plan", () => {
  const stamp = { scopeVersion: "scope-1", ruleVersion: "rule-1", toolAvailabilityVersion: "tools-1", providerConnected: true };
  assert.equal(planRevalidation(stamp, { ...stamp, ruleVersion: "rule-2" }), "rule_changed");
});

test("P7.2 tool availability change revalidates capability", () => {
  const stamp = { scopeVersion: "scope-1", ruleVersion: "rule-1", toolAvailabilityVersion: "tools-1", providerConnected: true };
  assert.equal(planRevalidation(stamp, { ...stamp, toolAvailabilityVersion: "tools-2" }), "tool_availability_changed");
});

test("P7.2 provider disconnection re-evaluates the task", () => {
  const stamp = { scopeVersion: "scope-1", ruleVersion: "rule-1", toolAvailabilityVersion: "tools-1", providerConnected: true };
  assert.equal(planRevalidation(stamp, { ...stamp, providerConnected: false }), "provider_disconnected");
});

test("P7.2 executor compatibility is checked before claim", () => {
  assert.doesNotThrow(() => assertExecutorCompatible(executor(), { capabilityKeys: ["projects.write"], capabilityVersion: 3, permissionVersion: 2 }));
  assert.throws(() => assertExecutorCompatible(executor(), { capabilityKeys: ["projects.delete"], capabilityVersion: 3, permissionVersion: 2 }), /lacks required capability/);
});

test("P7.2 executor capability version is enforced", () => {
  assert.throws(() => assertExecutorCompatible(executor({ capabilityVersion: 2 }), { capabilityKeys: ["projects.write"], capabilityVersion: 3, permissionVersion: 2 }), /capability version is stale/);
});

test("P7.2 executor permission version is enforced", () => {
  assert.throws(() => assertExecutorCompatible(executor({ permissionVersion: 1 }), { capabilityKeys: ["projects.write"], capabilityVersion: 3, permissionVersion: 2 }), /permission version is stale/);
});

test("P7.2 tool-health snapshot is taken at task start", () => {
  const snapshot = toolHealthSnapshotAtStart(executor(), ["git", "browser"]);
  assert.deepEqual(snapshot, { git: "healthy", browser: "degraded" });
  assert.throws(() => toolHealthSnapshotAtStart(executor(), ["missing"]), /does not report tool health/);
});

test("P7.2 owner rules are rechecked before an external side effect", () => {
  assert.doesNotThrow(() => assertFreshOwnerRule("rule-1", "rule-1"));
  assert.throws(() => assertFreshOwnerRule("rule-1", "rule-2"), /revalidate before an external side effect/);
});
