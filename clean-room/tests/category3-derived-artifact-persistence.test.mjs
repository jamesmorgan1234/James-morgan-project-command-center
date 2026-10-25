import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261025084500_category3_derived_artifact_lineage.sql", import.meta.url), "utf8");

function tableBody(name) {
  const match = sql.match(new RegExp(`create table if not exists public\\.${name} \\(([\\s\\S]*?)\\n\\);`, "i"));
  assert.ok(match, `missing table definition: ${name}`);
  return match[1];
}

test("all A08.3/A08.7 derivative classes share one canonical durable registry", () => {
  const body = tableBody("command_center_derived_artifacts");
  assert.match(body, /artifact_kind text not null check \(artifact_kind in \('summary','memory','index','vector','export','metric','recommendation'\)\)/i);
  assert.match(body, /state text not null check \(state in \('active','restricted','deleted'\)\)/i);
  assert.match(body, /foreign key\(owner_id,derived_id\)[\s\S]*references public\.command_center_derived_records/i);
});

test("artifact provenance is a direct canonical join to exact source observation/hash lineage", () => {
  assert.match(sql, /create or replace view public\.command_center_derived_artifact_provenance/i);
  assert.match(sql, /join public\.command_center_derived_records d[\s\S]*d\.derived_id=a\.derived_id/i);
  assert.match(sql, /join public\.command_center_derived_provenance dp[\s\S]*dp\.derived_id=a\.derived_id/i);
  assert.match(sql, /dp\.observation_id[\s\S]*dp\.source_id[\s\S]*dp\.content_hash/i);
  assert.match(sql, /with \(security_invoker=true\)/i);
});

test("canonical restriction/deletion propagates to every dependent artifact and active state never revives one", () => {
  assert.match(sql, /create or replace function command_center_private\.c3_propagate_derived_artifact_state\(\)/i);
  assert.match(sql, /if new\.state='active' then[\s\S]*return new/i);
  assert.match(sql, /new\.state='restricted'[\s\S]*update public\.command_center_derived_artifacts[\s\S]*set state='restricted'/i);
  assert.match(sql, /new\.state='deleted'[\s\S]*update public\.command_center_derived_artifacts[\s\S]*set state='deleted'/i);
  assert.match(sql, /create trigger c3_propagate_derived_artifact_state[\s\S]*after update of state on public\.command_center_derived_records/i);
});

test("direct artifact reactivation and lineage mutation are forbidden", () => {
  assert.match(sql, /old\.state in \('restricted','deleted'\) and new\.state='active'[\s\S]*cannot be directly reactivated/i);
  assert.match(sql, /old\.state='deleted' and new\.state<>'deleted'[\s\S]*irreversible/i);
  assert.match(sql, /new\.owner_id is distinct from old\.owner_id[\s\S]*new\.artifact_id is distinct from old\.artifact_id[\s\S]*new\.derived_id is distinct from old\.derived_id[\s\S]*new\.artifact_kind is distinct from old\.artifact_kind/i);
  assert.doesNotMatch(sql, /command_center_source_restore_derived_artifact/i);
});

test("artifact registration is owner-authorized, active-canonical and provenance-gated", () => {
  assert.match(sql, /create or replace function public\.command_center_source_register_derived_artifact/i);
  assert.match(sql, /if u is null or not public\.is_command_center_authorized\(\) then[\s\S]*raise exception 'Unauthorized'/i);
  assert.match(sql, /if d\.state<>'active' then[\s\S]*only be registered from active canonical derived state/i);
  assert.match(sql, /from public\.command_center_derived_provenance[\s\S]*v_provenance_count=0[\s\S]*requires canonical provenance/i);
  assert.match(sql, /Unsupported derived artifact kind/i);
});

test("artifact use revalidates current artifact canonical provenance and payload state", () => {
  assert.match(sql, /create or replace function public\.command_center_source_assert_derived_artifact_usable/i);
  assert.match(sql, /a\.state<>'active' or d\.state<>'active'[\s\S]*state is not active/i);
  assert.match(sql, /from public\.command_center_derived_provenance[\s\S]*v_provenance_count=0[\s\S]*canonical provenance is missing/i);
  assert.match(sql, /from public\.command_center_derived_payloads[\s\S]*if found and p\.state<>'present'[\s\S]*payload is not usable/i);
});

test("artifact table is owner-readable only and mutation/use RPCs have no service-role authority shortcut", () => {
  assert.match(sql, /alter table public\.command_center_derived_artifacts enable row level security/i);
  assert.match(sql, /revoke all on table public\.command_center_derived_artifacts from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select on table public\.command_center_derived_artifacts to authenticated/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table public\.command_center_derived_artifacts to authenticated/i);

  for (const fn of ["command_center_source_register_derived_artifact", "command_center_source_assert_derived_artifact_usable"]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}[^;]+ from public, anon, service_role`, "i"));
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}[^;]+ to authenticated`, "i"));
    assert.doesNotMatch(sql, new RegExp(`grant execute on function public\\.${fn}[^;]+ to service_role`, "i"));
  }
});
