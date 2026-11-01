import test from "node:test";
import assert from "node:assert/strict";
import { DispatchQueue, acquireProjectLock, renewProjectLock } from "../dist/agency/index.js";
import { TaskClaimStore } from "../dist/agency/index.js";

const NOW = "2026-10-31T12:00:00.000Z";
const LATER = "2026-10-31T13:00:00.000Z";

function command(id, priority = "normal", issuedAt = NOW) {
  return { id, ownerId: "owner-1", projectId: "p1", issuedAt, priority };
}

test("P7.2 command acceptance is separate from an execution claim", () => {
  const queue = new DispatchQueue();
  const accepted = queue.accept(command("cmd-1"));
  assert.equal(accepted.state, "accepted");
  assert.equal(accepted.executionClaimedAt, undefined);
  assert.throws(() => queue.assertExecutionAllowed("cmd-1"), /requires an explicit claim/);
  const claimed = queue.claim("cmd-1", "worker-1", LATER);
  assert.equal(claimed.state, "claimed");
  assert.equal(claimed.workerId, "worker-1");
  assert.doesNotThrow(() => queue.assertExecutionAllowed("cmd-1"));
});

test("P7.2 owner command signals dispatch immediately on acceptance", () => {
  const queue = new DispatchQueue();
  queue.accept(command("cmd-1"));
  const signalled = queue.signal("cmd-1");
  assert.equal(signalled.state, "dispatched");
  assert.equal(signalled.dispatchedAt, NOW);
  assert.throws(() => queue.signal("missing"), /Unknown dispatch command/);
});

test("P7.2 dispatch queue survives restart through snapshot and restore", () => {
  const queue = new DispatchQueue();
  queue.accept(command("cmd-1"));
  queue.accept(command("cmd-2", "critical", LATER));
  const restored = DispatchQueue.restore(queue.snapshot());
  assert.deepEqual(restored.snapshot().map((entry) => entry.commandId), ["cmd-1", "cmd-2"]);
  assert.equal(restored.pending()[0].commandId, "cmd-2");
});

test("P7.2 dispatch priority orders critical before normal before low", () => {
  const queue = new DispatchQueue();
  queue.accept(command("low", "low"));
  queue.accept(command("normal", "normal"));
  queue.accept(command("critical", "critical"));
  assert.deepEqual(queue.pending().map((entry) => entry.commandId), ["critical", "normal", "low"]);
  assert.throws(() => queue.accept(command("bad", "urgent")), /Unsupported dispatch priority/);
});

test("P7.2 project lock acquisition uses a fenced claim", () => {
  const store = new TaskClaimStore();
  const claim = acquireProjectLock(store, "p1", "worker-1", NOW, LATER);
  assert.equal(claim.taskId, "project:p1");
  assert.equal(claim.fencingToken, 1);
  assert.throws(() => acquireProjectLock(store, "p1", "worker-2", NOW, LATER), /already claimed/);
  assert.throws(() => acquireProjectLock(store, " ", "worker-1", NOW, LATER), /requires a project reference/);
});

test("P7.2 project lock is a lease that renews and rejects stale holders", () => {
  const store = new TaskClaimStore();
  const claim = acquireProjectLock(store, "p1", "worker-1", NOW, LATER);
  const renewed = renewProjectLock(store, "p1", "worker-1", claim.fencingToken, "2026-10-31T12:30:00.000Z", "2026-10-31T14:00:00.000Z");
  assert.equal(renewed.expiresAt, "2026-10-31T14:00:00.000Z");
  assert.throws(() => renewProjectLock(store, "p1", "worker-2", 99, "2026-10-31T12:30:00.000Z", "2026-10-31T14:00:00.000Z"), /Stale worker fencing token/);
});
