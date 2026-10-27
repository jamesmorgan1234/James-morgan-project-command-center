import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync(new URL("../../supabase/migrations/20261027153000_p2_6_canonical_data_boundaries.sql", import.meta.url), "utf8");

test("P2.6 migration makes scope grants RLS-protected and denies authenticated direct mutation", () => {
  assert.match(sql, /alter table public\.security_scope_grants enable row level security;/i);
  assert.match(sql, /alter table public\.security_scope_grants force row level security;/i);
  assert.match(sql, /revoke all on table public\.security_scope_grants from public,anon,authenticated;/i);
  assert.match(sql, /grant select on table public\.security_scope_grants to authenticated;/i);
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete|all)(?:\s*,\s*(?:insert|update|delete|all))*\s+on\s+table\s+public\.security_scope_grants\s+to\s+authenticated/i);
});

test("P2.6 private matcher carries every canonical boundary dimension and read/write mode", () => {
  for (const token of ["p_owner_id", "p_project_id", "p_company_id", "p_business_id", "p_account_id", "p_environment", "p_operation"]) {
    assert.match(sql, new RegExp(`\\b${token}\\b`, "i"));
  }
  assert.match(sql, /g\.principal_user_id=\(select auth\.uid\(\)\)/i);
  assert.match(sql, /g\.status='active'/i);
  assert.match(sql, /g\.expires_at is null or g\.expires_at>now\(\)/i);
  assert.match(sql, /case when p_operation='write' then g\.can_write else g\.can_read end/i);
});

test("P2.6 exposes only narrow authenticated boundary/project RPCs and keeps anon out", () => {
  assert.match(sql, /revoke all on function public\.command_center_boundary_check\(uuid,text,text,text,text,text,text\) from public,anon,authenticated;/i);
  assert.match(sql, /grant execute on function public\.command_center_boundary_check\(uuid,text,text,text,text,text,text\) to authenticated;/i);
  assert.match(sql, /revoke all on function public\.command_center_project_profile_get_scoped\(uuid,text\) from public,anon,authenticated;/i);
  assert.match(sql, /grant execute on function public\.command_center_project_profile_get_scoped\(uuid,text\) to authenticated;/i);
  assert.match(sql, /Project not found or boundary denied/i);
});
