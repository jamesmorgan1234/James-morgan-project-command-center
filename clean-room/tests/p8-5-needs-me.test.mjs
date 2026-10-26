import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NeedsMeQueue } from "../dist/personal/index.js";

const T = "2026-10-26T13:30:00Z";

function need(overrides = {}) {
  return {
    id: "need-auth",
    ownerId: "owner-1",
    needKey: "connect:calendar",
    title: "Connect calendar",
    reason: "Calendar actions are blocked",
    urgency: "high",
    requiredEnvironment: "local_browser",
    ownerAction: "Connect the calendar account",
    unlockRefs: ["calendar:read"],
    resumeRefs: ["run:calendar-sync"],
    sourceRefs: ["evidence:calendar-blocked"],
    state: "open",
    ...overrides
  };
}

test("P8.5 one owner action groups all legitimate linked blockers and unlocks", () => {
  const queue = new NeedsMeQueue();
  queue.upsert(need());
  queue.upsert(need({ id: "need-auth-second", unlockRefs: ["calendar:write", "calendar:read"], resumeRefs: ["run:calendar-sync", "run:calendar-create"], sourceRefs: ["evidence:calendar-create-blocked"], urgency: "critical" }));
  const open = queue.open();
  assert.equal(open.length, 1);
  assert.equal(open[0].urgency, "critical");
  assert.deepEqual([...open[0].unlockRefs].sort(), ["calendar:read", "calendar:write"]);
  assert.deepEqual([...open[0].resumeRefs].sort(), ["run:calendar-create", "run:calendar-sync"]);

  const resolution = queue.resolveByKey("owner-1", "connect:calendar", T, ["evidence:owner-connected-calendar"]);
  assert.equal(queue.open().length, 0);
  assert.deepEqual([...resolution.unlockRefs].sort(), ["calendar:read", "calendar:write"]);
});

test("P8.5 resolved needKey survives restart and duplicate blocker cannot reprompt", () => {
  const queue = new NeedsMeQueue();
  queue.upsert(need());
  queue.resolveByKey("owner-1", "connect:calendar", T, ["evidence:owner-connected-calendar"]);
  const restarted = NeedsMeQueue.rehydrate(queue.exportSnapshot());
  restarted.upsert(need({ id: "need-replayed", sourceRefs: ["evidence:stale-replay"] }));
  assert.equal(restarted.open().length, 0);
  assert.equal(restarted.resolution("owner-1", "connect:calendar")?.resolvedNeedId, "need-auth");
});

test("P8.5 same needKey cannot silently combine different owner actions or environments", () => {
  const queue = new NeedsMeQueue();
  queue.upsert(need());
  assert.throws(() => queue.upsert(need({ id: "need-different-action", ownerAction: "Upload a credential" })), /different owner action or environment/i);
  assert.throws(() => queue.upsert(need({ id: "need-different-env", requiredEnvironment: "phone" })), /different owner action or environment/i);
});

test("P8.5 durable schema preserves grouped need, exact action, resume references, and immutable resolution", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026084000_p8_5_needs_me.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_owner_needs/i);
  assert.match(sql, /unique\(owner_id, need_key\)/i);
  assert.match(sql, /required_environment/i);
  assert.match(sql, /owner_action/i);
  assert.match(sql, /unlock_refs text\[\] not null/i);
  assert.match(sql, /resume_refs text\[\] not null/i);
  assert.match(sql, /command_center_need_resolutions/i);
  assert.match(sql, /resolution history is immutable/i);
  assert.match(sql, /command_center_resolve_owner_need/i);
  assert.match(sql, /is_command_center_authorized/i);
});
