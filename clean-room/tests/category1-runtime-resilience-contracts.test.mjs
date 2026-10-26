import test from "node:test";
import assert from "node:assert/strict";
import {
  BackpressureError,
  BoundedWorkQueue,
  CoherentCache,
  CompensatingTransaction,
  ObservabilityHooks,
  PessimisticLockTable,
  SafeFeatureFlags,
  assertOptimisticVersion,
  deprecationState,
  deterministicRetryDelay,
  gracefulDegradation,
  resolveZonedCivilTime
} from "../dist/kernel/index.js";

test("P1 concurrency contracts support optimistic version checks and exclusive pessimistic locks", () => {
  assert.doesNotThrow(() => assertOptimisticVersion(3, 3, 4));
  assert.throws(() => assertOptimisticVersion(3, 2, 4), /concurrency conflict/);
  assert.throws(() => assertOptimisticVersion(3, 3, 3), /must advance/);
  const locks = new PessimisticLockTable();
  locks.acquire("account:1", "worker-a");
  assert.throws(() => locks.acquire("account:1", "worker-b"), /locked/);
  assert.throws(() => locks.release("account:1", "worker-b"), /Stale or invalid/);
  locks.release("account:1", "worker-a");
  assert.doesNotThrow(() => locks.acquire("account:1", "worker-b"));
});

test("P1 deterministic retry delays are reproducible bounded and fail when retry budget is exhausted", () => {
  const policy = { maxAttempts: 5, baseDelayMs: 100, multiplier: 2, maxDelayMs: 500 };
  assert.deepEqual([1, 2, 3, 4].map((attempt) => deterministicRetryDelay(policy, attempt)), [100, 200, 400, 500]);
  assert.equal(deterministicRetryDelay(policy, 3), deterministicRetryDelay(policy, 3));
  assert.throws(() => deterministicRetryDelay(policy, 5), /Retry budget exhausted/);
});

test("P1 bounded work queue applies explicit backpressure without silently dropping work", () => {
  const queue = new BoundedWorkQueue(2);
  queue.enqueue("a");
  queue.enqueue("b");
  assert.throws(() => queue.enqueue("c"), (error) => error instanceof BackpressureError && error.capacity === 2);
  assert.equal(queue.size, 2);
  assert.equal(queue.dequeue(), "a");
  assert.equal(queue.dequeue(), "b");
});

test("P1 graceful degradation distinguishes healthy degraded and unavailable outcomes", () => {
  assert.deepEqual(gracefulDegradation(() => "primary", () => "fallback", "primary down"), { health: "healthy", value: "primary" });
  assert.deepEqual(gracefulDegradation(() => { throw new Error("down"); }, () => "fallback", "primary down"), { health: "degraded", value: "fallback", reason: "primary down" });
  assert.deepEqual(gracefulDegradation(() => { throw new Error("down"); }, () => { throw new Error("also down"); }, "all down"), { health: "unavailable", reason: "all down" });
});

test("P1 transaction boundary compensates completed steps in reverse order after failure", async () => {
  const events = [];
  const transaction = new CompensatingTransaction([
    { name: "reserve", execute: () => events.push("reserve"), compensate: () => events.push("unreserve") },
    { name: "charge", execute: () => events.push("charge"), compensate: () => events.push("refund") },
    { name: "publish", execute: () => { events.push("publish"); throw new Error("publish failed"); }, compensate: () => events.push("unpublish") }
  ]);
  await assert.rejects(transaction.execute({}), /publish failed/);
  assert.deepEqual(events, ["reserve", "charge", "publish", "refund", "unreserve"]);
});

test("P1 transaction boundary reports incomplete compensation rather than hiding partial rollback", async () => {
  const transaction = new CompensatingTransaction([
    { name: "reserve", execute: () => undefined, compensate: () => { throw new Error("compensation failed"); } },
    { name: "publish", execute: () => { throw new Error("publish failed"); }, compensate: () => undefined }
  ]);
  await assert.rejects(transaction.execute({}), (error) => error instanceof AggregateError && /compensation was incomplete/.test(error.message));
});

test("P1 coherent cache rejects stale writes and never serves a mismatched source version", () => {
  const cache = new CoherentCache();
  cache.set("project", { value: "v3", sourceVersion: 3, cachedAt: "2026-10-26T16:00:00Z" });
  assert.equal(cache.get("project", 3), "v3");
  assert.equal(cache.get("project", 4), undefined);
  assert.throws(() => cache.set("project", { value: "v2", sourceVersion: 2, cachedAt: "2026-10-26T16:01:00Z" }), /Stale cache write/);
  cache.invalidate("project");
  assert.equal(cache.get("project", 3), undefined);
});

test("P1 feature flags default off and unsafe enablement or stale replacement fails closed", () => {
  const flags = new SafeFeatureFlags();
  assert.equal(flags.enabled("unknown"), false);
  assert.throws(() => flags.register({ key: "risky", version: 1, enabled: true, safeToEnable: false }), /Unsafe feature flag/);
  flags.register({ key: "risky", version: 1, enabled: false, safeToEnable: false });
  assert.throws(() => flags.replace({ key: "risky", version: 2, enabled: true, safeToEnable: false }, 1), /Unsafe feature flag/);
  flags.replace({ key: "risky", version: 2, enabled: true, safeToEnable: true }, 1);
  assert.equal(flags.enabled("risky"), true);
  assert.throws(() => flags.replace({ key: "risky", version: 3, enabled: false, safeToEnable: true }, 1), /concurrency conflict/);
});

test("P1 deprecation windows preserve active deprecated and retired states with valid temporal ordering", () => {
  const window = { announcedAt: "2026-11-01T00:00:00Z", sunsetAt: "2027-02-01T00:00:00Z" };
  assert.equal(deprecationState(window, "2026-10-26T00:00:00Z"), "active");
  assert.equal(deprecationState(window, "2026-12-01T00:00:00Z"), "deprecated");
  assert.equal(deprecationState(window, "2027-02-01T00:00:00Z"), "retired");
  assert.throws(() => deprecationState({ announcedAt: window.sunsetAt, sunsetAt: window.announcedAt }, "2026-12-01T00:00:00Z"), /sunset must follow/);
});

test("P1 observability hooks require trace IDs and preserve correlated event evidence", () => {
  const hooks = new ObservabilityHooks();
  hooks.emit({ traceId: "trace-1", hook: "command.accepted", timestamp: "2026-10-26T16:00:00Z", attributes: { sequence: 1 } });
  hooks.emit({ traceId: "trace-2", hook: "command.accepted", timestamp: "2026-10-26T16:00:01Z", attributes: { sequence: 2 } });
  hooks.emit({ traceId: "trace-1", hook: "command.completed", timestamp: "2026-10-26T16:00:02Z", attributes: { ok: true } });
  assert.deepEqual(hooks.byTrace("trace-1").map((event) => event.hook), ["command.accepted", "command.completed"]);
  assert.throws(() => hooks.emit({ traceId: "", hook: "bad", timestamp: "2026-10-26T16:00:00Z", attributes: {} }), /traceId is required/);
});

test("P1 DST-safe scheduling rejects skipped civil time and requires explicit ambiguity resolution", () => {
  assert.throws(() => resolveZonedCivilTime({ year: 2026, month: 3, day: 8, hour: 2, minute: 30, timeZone: "America/New_York" }), /does not exist/);
  assert.throws(() => resolveZonedCivilTime({ year: 2026, month: 11, day: 1, hour: 1, minute: 30, timeZone: "America/New_York" }), /ambiguous/);
  assert.equal(resolveZonedCivilTime({ year: 2026, month: 11, day: 1, hour: 1, minute: 30, timeZone: "America/New_York" }, "earlier"), "2026-11-01T05:30:00.000Z");
  assert.equal(resolveZonedCivilTime({ year: 2026, month: 11, day: 1, hour: 1, minute: 30, timeZone: "America/New_York" }, "later"), "2026-11-01T06:30:00.000Z");
  assert.equal(resolveZonedCivilTime({ year: 2026, month: 10, day: 26, hour: 12, minute: 0, timeZone: "America/New_York" }), "2026-10-26T16:00:00.000Z");
});
