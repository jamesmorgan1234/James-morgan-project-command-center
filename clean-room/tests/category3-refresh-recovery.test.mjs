import test from "node:test";
import assert from "node:assert/strict";
import { RefreshRecoveryCoordinator } from "../dist/data/index.js";

const T0 = "2026-10-25T08:00:00Z";
const T1 = "2026-10-25T08:01:00Z";
const T2 = "2026-10-25T08:02:00Z";

function checkpoint(overrides = {}) {
  return {
    sourceId: "source:chat-1",
    generation: 4,
    checkpointRef: "checkpoint:source:chat-1:g4",
    classification: "changed",
    successful: true,
    checkedAt: T0,
    ...overrides
  };
}

function expectations() {
  return [
    { derivedId: "derived:summary-1", observationId: "observation:o2", resultingState: "deleted" },
    { derivedId: "derived:index-1", observationId: "observation:o2", resultingState: "restricted" }
  ];
}

function acknowledgement(derivedId, resultingState, overrides = {}) {
  return {
    sourceId: "source:chat-1",
    generation: 4,
    derivedId,
    observationId: "observation:o2",
    resultingState,
    acknowledgedAt: T1,
    evidenceRefs: [`evidence:${derivedId}`],
    ...overrides
  };
}

test("changed refresh cannot complete until every dependent derived invalidation is acknowledged", () => {
  const recovery = new RefreshRecoveryCoordinator();
  recovery.recordCheckpoint(checkpoint());
  recovery.expectDerivedInvalidations("source:chat-1", 4, expectations());

  assert.deepEqual(recovery.evaluate("source:chat-1", 4), {
    sourceId: "source:chat-1",
    requestedGeneration: 4,
    checkpointGeneration: 4,
    checkpointRef: "checkpoint:source:chat-1:g4",
    action: "awaiting_derived_acknowledgements",
    reason: "dependent_derived_invalidation_unacknowledged",
    pendingDerivedIds: ["derived:index-1", "derived:summary-1"]
  });

  recovery.acknowledge(acknowledgement("derived:summary-1", "deleted"));
  assert.deepEqual(recovery.evaluate("source:chat-1", 4).pendingDerivedIds, ["derived:index-1"]);

  recovery.acknowledge(acknowledgement("derived:index-1", "restricted", { acknowledgedAt: T2 }));
  assert.equal(recovery.evaluate("source:chat-1", 4).action, "complete");
});

test("changed or uncertain checkpoint requires an explicit derivative expectation snapshot even when the true set is empty", () => {
  for (const classification of ["changed", "uncertain"]) {
    const recovery = new RefreshRecoveryCoordinator();
    recovery.recordCheckpoint(checkpoint({ classification }));
    const missing = recovery.evaluate("source:chat-1", 4);
    assert.equal(missing.action, "awaiting_derived_expectation_snapshot");
    assert.equal(missing.reason, "dependent_derived_expectation_snapshot_missing");

    recovery.expectDerivedInvalidations("source:chat-1", 4, []);
    assert.equal(recovery.evaluate("source:chat-1", 4).action, "complete");
  }
});

test("worker replacement cannot bypass pending derivative acknowledgements and resumes only after closure", () => {
  const recovery = new RefreshRecoveryCoordinator();
  recovery.recordCheckpoint(checkpoint());
  recovery.expectDerivedInvalidations("source:chat-1", 4, expectations());

  const blocked = recovery.evaluate("source:chat-1", 5);
  assert.equal(blocked.action, "awaiting_derived_acknowledgements");
  assert.deepEqual(blocked.pendingDerivedIds, ["derived:index-1", "derived:summary-1"]);

  recovery.acknowledge(acknowledgement("derived:summary-1", "deleted"));
  recovery.acknowledge(acknowledgement("derived:index-1", "restricted"));
  const resumed = recovery.evaluate("source:chat-1", 5);
  assert.equal(resumed.action, "resume_from_checkpoint");
  assert.equal(resumed.checkpointGeneration, 4);
  assert.equal(resumed.checkpointRef, "checkpoint:source:chat-1:g4");
});

test("derived acknowledgements must match exact expected observation and resulting state", () => {
  const recovery = new RefreshRecoveryCoordinator();
  recovery.recordCheckpoint(checkpoint());
  recovery.expectDerivedInvalidations("source:chat-1", 4, expectations());

  assert.throws(
    () => recovery.acknowledge(acknowledgement("derived:summary-1", "restricted")),
    /does not match expected invalidation/
  );
  assert.throws(
    () => recovery.acknowledge(acknowledgement("derived:summary-1", "deleted", { observationId: "observation:other" })),
    /does not match expected invalidation/
  );
  assert.throws(
    () => recovery.acknowledge(acknowledgement("derived:unknown", "deleted")),
    /Unexpected derived projection acknowledgement/
  );
});

test("acknowledgement evidence is required, unique and cannot predate the source checkpoint", () => {
  const recovery = new RefreshRecoveryCoordinator();
  recovery.recordCheckpoint(checkpoint());
  recovery.expectDerivedInvalidations("source:chat-1", 4, expectations());

  assert.throws(
    () => recovery.acknowledge(acknowledgement("derived:summary-1", "deleted", { evidenceRefs: [] })),
    /evidence must be non-empty and unique/
  );
  assert.throws(
    () => recovery.acknowledge(acknowledgement("derived:summary-1", "deleted", { evidenceRefs: ["same", "same"] })),
    /evidence must be non-empty and unique/
  );
  assert.throws(
    () => recovery.acknowledge(acknowledgement("derived:summary-1", "deleted", { acknowledgedAt: "2026-10-25T07:59:59Z" })),
    /predates checkpoint/
  );
});

test("exact acknowledgement replay is idempotent while conflicting replay is rejected", () => {
  const recovery = new RefreshRecoveryCoordinator();
  recovery.recordCheckpoint(checkpoint());
  recovery.expectDerivedInvalidations("source:chat-1", 4, expectations());

  const ack = acknowledgement("derived:summary-1", "deleted");
  const first = recovery.acknowledge(ack);
  const replay = recovery.acknowledge(ack);
  assert.deepEqual(replay, first);
  assert.throws(
    () => recovery.acknowledge({ ...ack, evidenceRefs: ["evidence:different"] }),
    /Conflicting derived projection acknowledgement/
  );
});

test("missing or unsuccessful checkpoints restart and stale checkpoint generations fail closed", () => {
  const recovery = new RefreshRecoveryCoordinator();
  assert.equal(recovery.evaluate("source:chat-1", 1).action, "restart_source");
  assert.equal(recovery.evaluate("source:chat-1", 1).reason, "checkpoint_missing");

  recovery.recordCheckpoint(checkpoint({ generation: 2, successful: false, checkpointRef: "checkpoint:failed" }));
  assert.equal(recovery.evaluate("source:chat-1", 2).reason, "checkpoint_unsuccessful");
  assert.throws(() => recovery.evaluate("source:chat-1", 1), /requested generation is stale/);
  assert.throws(() => recovery.recordCheckpoint(checkpoint({ generation: 1 })), /Stale refresh checkpoint generation rejected/);
});

test("unchanged checkpoint cannot invent downstream invalidations and exact checkpoint replay is idempotent", () => {
  const recovery = new RefreshRecoveryCoordinator();
  const unchanged = checkpoint({ classification: "unchanged" });
  const first = recovery.recordCheckpoint(unchanged);
  assert.deepEqual(recovery.recordCheckpoint(unchanged), first);
  assert.throws(
    () => recovery.expectDerivedInvalidations("source:chat-1", 4, expectations()),
    /Unchanged refresh checkpoint cannot require derived invalidation acknowledgements/
  );
  assert.equal(recovery.evaluate("source:chat-1", 4).action, "complete");
});

test("checkpoint generation cannot be rewritten with different recovery truth", () => {
  const recovery = new RefreshRecoveryCoordinator();
  recovery.recordCheckpoint(checkpoint());
  assert.throws(
    () => recovery.recordCheckpoint(checkpoint({ checkpointRef: "checkpoint:different" })),
    /already committed with different checkpoint/
  );
});
