import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261025053727_category3_privacy_restore_boundary.sql", import.meta.url), "utf8");

function tableBody(name) {
  const match = sql.match(new RegExp(`create table if not exists public\\.${name} \\(([\\s\\S]*?)\\n\\);`, "i"));
  assert.ok(match, `missing table definition: ${name}`);
  return match[1];
}

test("derived payload material is durably separated from metadata-only audit history", () => {
  assert.match(sql, /create table if not exists public\.command_center_derived_payloads/i);
  assert.match(sql, /create table if not exists public\.command_center_derived_payload_audit/i);

  const payload = tableBody("command_center_derived_payloads");
  assert.match(payload, /payload_ref text/i);
  assert.match(payload, /content_hash text/i);
  assert.match(payload, /key_version bigint/i);
  assert.match(payload, /state text not null check \(state in \('present','restricted','erased'\)\)/i);
  assert.match(payload, /state='erased' and payload_ref is null and content_hash is null and key_version is null/i);

  const audit = tableBody("command_center_derived_payload_audit");
  assert.doesNotMatch(audit, /payload_ref/i);
  assert.doesNotMatch(audit, /content_hash/i);
  assert.doesNotMatch(audit, /key_version/i);
  assert.match(audit, /action text not null check \(action in \('registered','restricted','erased'\)\)/i);
  assert.match(audit, /evidence_refs text\[\] not null/i);
});

test("restricted and erased payloads cannot leak through the authenticated read policy", () => {
  assert.match(sql, /alter table public\.command_center_derived_payloads enable row level security/i);
  assert.match(sql, /revoke all on table public\.command_center_derived_payloads from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select on table public\.command_center_derived_payloads to authenticated/i);
  assert.match(sql, /create policy c3_owner_select_derived_payloads[\s\S]*owner_id=\(select auth\.uid\(\)\)[\s\S]*is_command_center_authorized\(\)[\s\S]*state='present'[\s\S]*d\.state='active'/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table public\.command_center_derived_payloads to authenticated/i);
});

test("erasure is material-destructive, legal-hold-aware, and propagated from canonical derived invalidation", () => {
  assert.match(sql, /if new\.legal_hold then[\s\S]*Legal hold forbids derived payload erasure/i);
  assert.match(sql, /set state='erased',[\s\S]*payload_ref=null,[\s\S]*content_hash=null,[\s\S]*key_version=null/i);
  assert.match(sql, /create trigger c3_sync_derived_payload_lifecycle[\s\S]*after update of state on public\.command_center_derived_records/i);
  assert.match(sql, /v_changed bigint:=0/i);
  assert.match(sql, /get diagnostics v_changed = row_count/i);
  assert.match(sql, /if v_changed>0 then/i);
  assert.match(sql, /command_center_derived_payload_audit[\s\S]*'erased'/i);
});

test("database transition guards make erased payloads irreversible and forbid direct restricted restore", () => {
  assert.match(sql, /create or replace function command_center_private\.c3_guard_derived_payload_transition\(\)/i);
  assert.match(sql, /old\.state='erased'[\s\S]*Erased derived payload material cannot be restored/i);
  assert.match(sql, /old\.state='restricted' and new\.state='present'[\s\S]*direct restoration is forbidden/i);
  assert.match(sql, /new\.state='erased'[\s\S]*payload_ref is not null[\s\S]*content_hash is not null[\s\S]*key_version is not null/i);
  assert.match(sql, /before update on public\.command_center_derived_payloads/i);
  assert.doesNotMatch(sql, /command_center_source_restore_derived_payload/i);
});

test("payload mutations are narrow authorized security-definer RPCs with evidence and no service-role shortcut", () => {
  for (const fn of [
    "command_center_source_register_derived_payload",
    "command_center_source_restrict_derived_payload",
    "command_center_source_erase_derived_payload"
  ]) {
    assert.match(sql, new RegExp(`create or replace function public\\.${fn}`, "i"));
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}[^;]+ from public, anon, service_role`, "i"));
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}[^;]+ to authenticated`, "i"));
  }
  assert.match(sql, /security definer[\s\S]*set search_path=''/i);
  assert.match(sql, /if u is null or not public\.is_command_center_authorized\(\) then[\s\S]*raise exception 'Unauthorized'/i);
  assert.match(sql, /c3_assert_unique_text_array\(p_evidence_refs/i);
  assert.match(sql, /cardinality\(coalesce\(p_evidence_refs,'\{\}'::text\[\]\)\)=0/i);
  assert.doesNotMatch(sql, /grant execute on function public\.command_center_source_(?:register|restrict|erase)_derived_payload[^;]+ to service_role/i);
});

test("erase RPC blocks legal holds and removes payload material before canonical deletion", () => {
  assert.match(sql, /command_center_source_erase_derived_payload[\s\S]*if d\.legal_hold then[\s\S]*Legal hold blocks derived payload erasure/i);
  assert.match(sql, /update public\.command_center_derived_payloads[\s\S]*state='erased'[\s\S]*payload_ref=null[\s\S]*content_hash=null[\s\S]*key_version=null[\s\S]*if d\.state<>'deleted' then[\s\S]*update public\.command_center_derived_records[\s\S]*state='deleted'/i);
});
