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
