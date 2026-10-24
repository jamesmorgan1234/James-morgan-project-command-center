import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function migration(name) {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

test("legacy ungated session and device revocation entry points fail closed", () => {
  const sql = migration("20261024110000_category2_protected_session_device_revocation.sql");
  assert.match(sql, /Session revocation requires fresh protected authorization/i);
  assert.match(sql, /Device revocation requires fresh protected authorization/i);
  assert.match(sql, /revoke all on function public\.command_center_revoke_owner_session\(uuid,text\) from public, anon, authenticated/i);
  assert.match(sql, /revoke all on function public\.command_center_revoke_owner_device\(uuid,text\) from public, anon, authenticated/i);
});

test("authorized session revocation consumes an exact single-use action", () => {
  const sql = migration("20261024110000_category2_protected_session_device_revocation.sql");
  assert.match(sql, /command_center_revoke_owner_session_authorized/i);
  assert.match(sql, /consume_action_authorization[\s\S]*'security\.revoke_session'[\s\S]*'owner_session'[\s\S]*p_session_id::text/i);
  assert.match(sql, /where s\.id=p_session_id and s\.user_id=v_owner/i);
  assert.match(sql, /grant execute on function public\.command_center_revoke_owner_session_authorized\(uuid,uuid,text\) to authenticated/i);
});

test("authorized device revocation consumes an exact critical action and revokes bound sessions", () => {
  const sql = migration("20261024110000_category2_protected_session_device_revocation.sql");
  assert.match(sql, /command_center_revoke_owner_device_authorized/i);
  assert.match(sql, /consume_action_authorization[\s\S]*'security\.revoke_device'[\s\S]*'owner_device'[\s\S]*p_device_id::text/i);
  assert.match(sql, /set trust_state='revoked'/i);
  assert.match(sql, /where device_id=p_device_id and owner_id=v_owner and revoked_at is null/i);
  assert.match(sql, /grant execute on function public\.command_center_revoke_owner_device_authorized\(uuid,uuid,text\) to authenticated/i);
});
