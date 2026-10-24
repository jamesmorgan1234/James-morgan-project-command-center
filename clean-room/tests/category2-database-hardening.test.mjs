import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function migration(name) {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

test("service-only Agent auto-state helper is removed from browser roles", () => {
  const sql = migration("20261024093000_category2_service_get_auto_acl_hardening.sql");
  assert.match(sql, /revoke execute on function public\.command_center_agent_service_get_auto\(uuid\) from authenticated;/i);
  assert.match(sql, /revoke execute on function public\.command_center_agent_service_get_auto\(uuid\) from anon;/i);
  assert.match(sql, /grant execute on function public\.command_center_agent_service_get_auto\(uuid\) to service_role;/i);
});

test("protected-action authorization requires recent signed AMR verification and bounded expiry", () => {
  const sql = migration("20261024094500_category2_fresh_verification_gate.sql");
  assert.match(sql, /auth\.jwt\(\)->'amr'/i);
  assert.match(sql, /entry->>'method' not in[\s\S]*'token_refresh'/i);
  assert.match(sql, /Fresh owner verification required/i);
  assert.match(sql, /when 'critical' then interval '5 minutes'/i);
  assert.match(sql, /when 'high' then interval '10 minutes'/i);
  assert.match(sql, /interval '15 minutes'/i);
  assert.match(sql, /Authorization expiry exceeds fresh-verification window/i);
  assert.match(sql, /where status='authorized'/i);
  assert.match(sql, /set status='revoked'/i);
});

test("owner session and device inventory is owner-scoped and revocation is canonical", () => {
  const sql = migration("20261024102000_category2_session_device_inventory.sql");
  assert.match(sql, /create table if not exists public\.command_center_owner_devices/i);
  assert.match(sql, /create table if not exists public\.command_center_owner_sessions/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /using \(owner_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /revoke all on table public\.command_center_owner_devices from public, anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.command_center_owner_sessions from public, anon, authenticated/i);
  assert.match(sql, /create or replace function public\.is_command_center_authorized\(\)/i);
  assert.match(sql, /left join public\.command_center_owner_sessions cs/i);
  assert.match(sql, /and cs\.revoked_at is null/i);
  assert.match(sql, /left join public\.command_center_owner_devices cd/i);
  assert.match(sql, /and cd\.revoked_at is null/i);
  assert.match(sql, /create or replace function public\.command_center_touch_current_session/i);
  assert.match(sql, /session device binding mismatch/i);
  assert.match(sql, /create or replace function public\.command_center_list_owner_sessions\(\)/i);
  assert.match(sql, /create or replace function public\.command_center_revoke_owner_session/i);
  assert.match(sql, /create or replace function public\.command_center_revoke_owner_device/i);
  assert.match(sql, /where s\.id = p_session_id and s\.user_id = v_owner/i);
  assert.doesNotMatch(sql, /refresh_token/i);
});
