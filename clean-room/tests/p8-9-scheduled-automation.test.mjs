import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AutomationRegistry, planAutomationCatchUp } from "../dist/personal/index.js";

const T0 = "2026-10-26T15:00:00Z";
const authority = { authorizationRef: "auth:auto", issuedAt: "2026-10-26T14:00:00Z", expiresAt: "2026-10-27T14:00:00Z", policyEpoch: 4, currentPolicyEpoch: 4, revocationEpoch: 2, currentRevocationEpoch: 2, revoked: false };

test("P8.9 scheduled occurrence survives restart and cannot duplicate", () => {
  const registry = new AutomationRegistry();
  registry.register({ id: "auto", ownerId: "owner-1", scheduleRef: "daily:08:00", enabled: true, actionPolicy: "notification_only", providerHealth: "available", protectedActionsAuthorized: false });
  const key = registry.begin("auto", "2026-10-27T12:00:00Z", T0, undefined, "agent-step:auto-1");
  const restarted = AutomationRegistry.rehydrate(registry.exportSnapshot());
  assert.equal(restarted.execution(key)?.agencyExecutionRef, "agent-step:auto-1");
  assert.throws(() => restarted.begin("auto", "2026-10-27T12:00:00Z", T0), /Duplicate scheduled execution/i);
});

test("P8.9 safe actions require current unrevoked authorization at effect time", () => {
  const registry = new AutomationRegistry();
  registry.register({ id: "safe", ownerId: "owner-1", scheduleRef: "daily", enabled: true, actionPolicy: "safe_action", providerHealth: "available", protectedActionsAuthorized: false });
  assert.throws(() => registry.begin("safe", "2026-10-27T12:00:00Z", T0), /requires current authorization/i);
  assert.throws(() => registry.begin("safe", "2026-10-27T12:00:00Z", T0, { ...authority, currentPolicyEpoch: 5 }), /authority state is stale/i);
  assert.throws(() => registry.begin("safe", "2026-10-27T12:00:00Z", T0, { ...authority, revoked: true }), /revoked/i);
  assert.doesNotThrow(() => registry.begin("safe", "2026-10-27T12:00:00Z", T0, authority));
});

test("P8.9 catch-up is explicit, deduplicated, ordered, and bounded", () => {
  const planned = planAutomationCatchUp(["2026-10-29T12:00:00Z", "2026-10-27T12:00:00Z", "2026-10-28T12:00:00Z", "2026-10-28T12:00:00Z"], ["2026-10-27T12:00:00Z"], 1);
  assert.deepEqual(planned, ["2026-10-28T12:00:00Z"]);
});

test("P8.9 durable schema references Agency execution and does not create another scheduler authority", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026092000_p8_9_scheduled_automation.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_scheduled_automations/i);
  assert.match(sql, /schedule_ref text not null/i);
  assert.match(sql, /command_center_automation_occurrences/i);
  assert.match(sql, /agency_step_id uuid references public\.agent_steps/i);
  assert.match(sql, /unique\(owner_id,automation_id,scheduled_for\)/i);
  assert.match(sql, /authorization_ref/i);
  assert.match(sql, /policy_epoch/i);
  assert.match(sql, /revocation_epoch/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.doesNotMatch(sql, /create table if not exists public\.[a-z0-9_]*scheduler/i);
});
