import test from "node:test";
import assert from "node:assert/strict";
import {
  ControlledSideEffectExecutor,
  DefinitiveSideEffectFailureError,
  OperationJournal,
  UnknownSideEffectOutcomeError
} from "../dist/kernel/index.js";

const NOW = "2026-10-26T05:00:00Z";
const SCOPE = { ownerId: "owner-1", companyId: "company-1", projectId: "project-1", accountId: "account-1", environment: "staging" };

function operation(overrides = {}) {
  return {
    id: "operation-1",
    idempotencyKey: "idem-1",
    intentBinding: "intent-binding-1",
    scope: SCOPE,
    state: "prepared",
    policyVersion: 1,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  };
}

test("P1 controlled side-effect path journals intent before dispatch and suppresses duplicate real-world execution", async () => {
  const executor = new ControlledSideEffectExecutor();
  let dispatches = 0;
  const first = await executor.execute({
    operation: operation(),
    dispatchedAt: "2026-10-26T05:00:01Z",
    completedAt: "2026-10-26T05:00:02Z",
    dispatch: () => {
      dispatches += 1;
      return { value: { providerId: "external-1" }, providerReceiptRef: "receipt-1" };
    }
  });

  assert.equal(first.replayed, false);
  assert.equal(first.operation.state, "succeeded");
  assert.equal(first.operation.providerReceiptRef, "receipt-1");
  assert.equal(dispatches, 1);

  const replay = await executor.execute({
    operation: operation({ id: "operation-duplicate" }),
    dispatchedAt: "2026-10-26T05:00:03Z",
    completedAt: "2026-10-26T05:00:04Z",
    dispatch: () => {
      dispatches += 1;
      return { value: { providerId: "should-not-run" }, providerReceiptRef: "receipt-2" };
    }
  });

  assert.equal(replay.replayed, true);
  assert.equal(replay.operation.id, "operation-1");
  assert.equal(dispatches, 1);
});

test("P1 side-effect deduplication is scope-bound and operation ids cannot be rebound to a different intent", async () => {
  const journal = new OperationJournal();
  assert.equal(journal.prepare(operation()).id, "operation-1");
  assert.equal(journal.prepare(operation({ id: "operation-duplicate" })).id, "operation-1");
  assert.throws(
    () => journal.prepare(operation({ idempotencyKey: "different-key" })),
    /already bound to a different side-effect intent/
  );

  const otherScope = { ...SCOPE, companyId: "company-2" };
  assert.equal(journal.prepare(operation({ id: "operation-2", scope: otherScope })).id, "operation-2");
});

test("P1 uncertain side-effect outcomes fail closed and cannot be retried before reconciliation", async () => {
  const executor = new ControlledSideEffectExecutor();
  let dispatches = 0;

  await assert.rejects(
    executor.execute({
      operation: operation(),
      dispatchedAt: "2026-10-26T05:00:01Z",
      completedAt: "2026-10-26T05:00:02Z",
      dispatch: () => {
        dispatches += 1;
        throw new Error("connection dropped after provider accepted request");
      }
    }),
    (error) => error instanceof UnknownSideEffectOutcomeError && error.errorCode === "SIDE_EFFECT_OUTCOME_UNKNOWN"
  );
  assert.equal(executor.journal.get("operation-1")?.state, "unknown");

  await assert.rejects(
    executor.execute({
      operation: operation(),
      dispatchedAt: "2026-10-26T05:00:03Z",
      completedAt: "2026-10-26T05:00:04Z",
      dispatch: () => {
        dispatches += 1;
        return { value: "unsafe-retry", providerReceiptRef: "receipt-unsafe" };
      }
    }),
    /must be reconciled before retry/
  );
  assert.equal(dispatches, 1);

  const reconciled = executor.reconcile("operation-1", "2026-10-26T05:00:05Z", "receipt-reconciled");
  assert.equal(reconciled.state, "reconciled");
  assert.equal(reconciled.providerReceiptRef, "receipt-reconciled");
  assert.throws(() => executor.journal.assertRetrySafe("operation-1"), /must not be repeated/);
});

test("P1 missing provider receipt is treated as unknown rather than falsely retryable failure", async () => {
  const executor = new ControlledSideEffectExecutor();
  await assert.rejects(
    executor.execute({
      operation: operation(),
      dispatchedAt: "2026-10-26T05:00:01Z",
      completedAt: "2026-10-26T05:00:02Z",
      dispatch: () => ({ value: "provider-may-have-committed", providerReceiptRef: "" })
    }),
    (error) => error instanceof UnknownSideEffectOutcomeError && error.errorCode === "SIDE_EFFECT_RECEIPT_MISSING"
  );
  assert.equal(executor.journal.get("operation-1")?.state, "unknown");
});

test("P1 only explicit definitive failures are retryable and a later successful retry remains idempotent", async () => {
  const executor = new ControlledSideEffectExecutor();
  let dispatches = 0;

  await assert.rejects(
    executor.execute({
      operation: operation(),
      dispatchedAt: "2026-10-26T05:00:01Z",
      completedAt: "2026-10-26T05:00:02Z",
      dispatch: () => {
        dispatches += 1;
        throw new DefinitiveSideEffectFailureError("PROVIDER_REJECTED_BEFORE_COMMIT");
      }
    }),
    (error) => error instanceof DefinitiveSideEffectFailureError && error.errorCode === "PROVIDER_REJECTED_BEFORE_COMMIT"
  );
  assert.equal(executor.journal.get("operation-1")?.state, "failed");
  assert.doesNotThrow(() => executor.journal.assertRetrySafe("operation-1"));

  const retry = await executor.execute({
    operation: operation(),
    dispatchedAt: "2026-10-26T05:00:03Z",
    completedAt: "2026-10-26T05:00:04Z",
    dispatch: () => {
      dispatches += 1;
      return { value: "committed", providerReceiptRef: "receipt-after-retry" };
    }
  });
  assert.equal(retry.operation.state, "succeeded");
  assert.equal(dispatches, 2);

  const replay = await executor.execute({
    operation: operation({ id: "operation-replay" }),
    dispatchedAt: "2026-10-26T05:00:05Z",
    completedAt: "2026-10-26T05:00:06Z",
    dispatch: () => {
      dispatches += 1;
      return { value: "duplicate", providerReceiptRef: "receipt-duplicate" };
    }
  });
  assert.equal(replay.replayed, true);
  assert.equal(dispatches, 2);
});

test("P1 operation journal rejects invalid lifecycle and temporal regressions", () => {
  const journal = new OperationJournal();
  assert.throws(() => journal.prepare(operation({ state: "dispatched" })), /must start prepared/);
  journal.prepare(operation());
  assert.throws(() => journal.transition("operation-1", "succeeded", "2026-10-26T05:00:01Z"), /Invalid operation transition/);
  journal.transition("operation-1", "dispatched", "2026-10-26T05:00:02Z");
  assert.throws(() => journal.transition("operation-1", "failed", "2026-10-26T05:00:01Z"), /cannot move backward in time/);
});
