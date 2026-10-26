import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateWatch, nextWatchBackoffUntil } from "../dist/personal/index.js";

const baseWatch = { id: "watch", ownerId: "owner-1", conditionKey: "reply-arrived", cadenceRef: "hourly", actionPolicy: "notification_only", protectedActionsAuthorized: false, priorVerifiedState: false, lastObservationId: "obs-1", lastVerifiedObservedAt: "2026-10-26T15:00:00Z" };

test("P8.10 duplicate and stale verified observations cannot trigger effects", () => {
  assert.deepEqual(evaluateWatch(baseWatch, { watchId: "watch", conditionMet: true, verified: true, observationId: "obs-1", observedAt: "2026-10-26T15:01:00Z", sourceRefs: ["mail"] }), { fire: false, reason: "duplicate_observation", protectedActionAuthorized: false });
  assert.deepEqual(evaluateWatch(baseWatch, { watchId: "watch", conditionMet: true, verified: true, observationId: "obs-old", observedAt: "2026-10-26T14:59:59Z", sourceRefs: ["mail"] }), { fire: false, reason: "stale_observation", protectedActionAuthorized: false });
});

test("P8.10 backoff suppresses verified transitions until its bound expires", () => {
  const watch = { ...baseWatch, lastObservationId: undefined, backoffUntil: "2026-10-26T16:00:00Z" };
  assert.equal(evaluateWatch(watch, { watchId: "watch", conditionMet: true, verified: true, observationId: "obs-2", observedAt: "2026-10-26T15:30:00Z", sourceRefs: ["mail"] }).reason, "backoff_active");
  assert.equal(evaluateWatch(watch, { watchId: "watch", conditionMet: true, verified: true, observationId: "obs-3", observedAt: "2026-10-26T16:00:00Z", sourceRefs: ["mail"] }).fire, true);
  assert.equal(nextWatchBackoffUntil("2026-10-26T15:00:00Z", 1, 60, 300), "2026-10-26T15:01:00.000Z");
  assert.equal(nextWatchBackoffUntil("2026-10-26T15:00:00Z", 10, 60, 300), "2026-10-26T15:05:00.000Z");
});

test("P8.10 safe-action policy still cannot authorize a protected action", () => {
  const decision = evaluateWatch({ ...baseWatch, lastObservationId: undefined, actionPolicy: "safe_action" }, { watchId: "watch", conditionMet: true, verified: true, observationId: "obs-2", observedAt: "2026-10-26T15:01:00Z", sourceRefs: ["verified:provider"] });
  assert.equal(decision.fire, true);
  assert.equal(decision.protectedActionAuthorized, false);
});

test("P8.10 durable schema versions observations/transitions and persists bounded backoff without effect authority", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026093000_p8_10_condition_watches.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_condition_watches/i);
  assert.match(sql, /backoff_until timestamptz/i);
  assert.match(sql, /command_center_watch_observations/i);
  assert.match(sql, /unique\(owner_id,watch_id,observation_id\)/i);
  assert.match(sql, /observed_at timestamptz not null/i);
  assert.match(sql, /command_center_watch_transitions/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
  assert.match(sql, /is_command_center_authorized/i);
});
