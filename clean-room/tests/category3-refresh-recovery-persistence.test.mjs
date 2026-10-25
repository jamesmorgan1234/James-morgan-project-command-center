import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261025083000_category3_refresh_recovery_acknowledgements.sql", import.meta.url), "utf8");

function tableBody(name) {
  const match = sql.match(new RegExp(`create table if not exists public\\.${name} \\(([\\s\\S]*?)\\n\\);`, "i"));
  assert.ok(match, `missing table definition: ${name}`);
  return match[1];
}

test("refresh checkpoint history preserves generations instead of overwriting recovery truth", () => {
  assert.match(sql, /create table if not exists public\.command_center_source_refresh_checkpoint_history/i);
  assert.match(sql, /primary key\(owner_id,source_id,generation\)/i);
  assert.match(sql, /insert into public\.command_center_source_refresh_checkpoint_history[\s\S]*from public\.command_center_source_refresh_checkpoints[\s\S]*on conflict\(owner_id,source_id,generation\) do nothing/i);
  assert.match(sql, /create trigger c3_capture_refresh_checkpoint_history[\s\S]*after insert or update on public\.command_center_source_refresh_checkpoints/i);
  assert.match(sql, /Refresh checkpoint history generation is immutable/i);
});

test("explicit expectation set distinguishes zero dependents from a missing snapshot", () => {
  const sets = tableBody("command_center_source_refresh_derived_expectation_sets");
  assert.match(sets, /expected_count bigint not null check \(expected_count >= 0\)/i);
  assert.match(sets, /invalidated_observation_id text not null/i);
  assert.match(sql, /h\.classification<>'unchanged' and not found[\s\S]*awaiting_derived_expectation_snapshot[\s\S]*dependent_derived_expectation_snapshot_missing/i);
  assert.match(sql, /Unchanged refresh checkpoint cannot require derived invalidation acknowledgements/i);
});

test("expectation capture derives exact downstream obligations from provenance after invalidation", () => {
  assert.match(sql, /create or replace function public\.command_center_source_capture_refresh_derived_expectations/i);
  assert.match(sql, /h\.successful[\s\S]*h\.classification='unchanged'/i);
  assert.match(sql, /o\.state in \('current','corrected'\)[\s\S]*requires non-current invalidated observation/i);
  assert.match(sql, /command_center_derived_provenance dp[\s\S]*command_center_derived_records d[\s\S]*d\.state not in \('deleted','restricted'\)[\s\S]*Dependent derived invalidation is incomplete/i);
  assert.match(sql, /select count\(\*\) into v_expected_count[\s\S]*dp\.observation_id=o\.observation_id/i);
  assert.match(sql, /insert into public\.command_center_source_refresh_derived_expectations[\s\S]*select[\s\S]*dp\.derived_id[\s\S]*d\.state/i);
});

test("durable expectations retain metadata independently of the live derived row", () => {
  const expectations = tableBody("command_center_source_refresh_derived_expectations");
  assert.match(expectations, /derived_id text not null/i);
  assert.match(expectations, /observation_id text not null/i);
  assert.match(expectations, /resulting_state text not null check \(resulting_state in \('deleted','restricted'\)\)/i);
  assert.match(expectations, /derived_id ~ '\^derived:/i);
  assert.doesNotMatch(expectations, /references public\.command_center_derived_records/i);
});

test("derived invalidation acknowledgement is exact evidence-backed and state-checked", () => {
  const acknowledgements = tableBody("command_center_source_refresh_derived_acknowledgements");
  assert.match(acknowledgements, /evidence_refs text\[\] not null/i);
  assert.match(acknowledgements, /foreign key\(owner_id,source_id,generation,derived_id,observation_id,resulting_state\)/i);
  assert.match(sql, /c3_assert_unique_text_array\(p_evidence_refs,'Derived projection acknowledgement evidence'\)/i);
  assert.match(sql, /Derived projection acknowledgement does not match expected invalidation/i);
  assert.match(sql, /p_acknowledged_at<greatest\(s\.captured_at,h\.checked_at\)/i);
  assert.match(sql, /d\.state is distinct from e\.resulting_state[\s\S]*current state no longer matches expected invalidation/i);
  assert.match(sql, /Conflicting derived projection acknowledgement/i);
  assert.match(sql, /duplicate_acknowledgement',true/i);
});

test("recovery blocks missing snapshots and pending acknowledgements before allowing resume", () => {
  assert.match(sql, /create or replace function public\.command_center_source_refresh_recovery_status/i);
  assert.match(sql, /order by generation desc[\s\S]*limit 1/i);
  assert.match(sql, /h\.generation>p_requested_generation[\s\S]*requested generation is stale/i);
  assert.match(sql, /awaiting_derived_expectation_snapshot/i);
  assert.match(sql, /left join public\.command_center_source_refresh_derived_acknowledgements/i);
  assert.match(sql, /a\.derived_id is null/i);
  assert.match(sql, /awaiting_derived_acknowledgements/i);
  assert.match(sql, /resume_from_checkpoint/i);
  assert.match(sql, /prior_checkpoint_closed_and_resumable/i);
});

test("recovery evidence tables are owner-readable but not directly writable", () => {
  for (const table of [
    "command_center_source_refresh_checkpoint_history",
    "command_center_source_refresh_derived_expectation_sets",
    "command_center_source_refresh_derived_expectations",
    "command_center_source_refresh_derived_acknowledgements"
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`, "i"));
    assert.match(sql, new RegExp(`grant select on table public\\.${table} to authenticated`, "i"));
    assert.doesNotMatch(sql, new RegExp(`grant (insert|update|delete) on table public\\.${table} to authenticated`, "i"));
  }
});

test("recovery RPCs are authenticated-owner only and do not create a service-role shortcut", () => {
  for (const fn of [
    "command_center_source_capture_refresh_derived_expectations",
    "command_center_source_acknowledge_derived_invalidation",
    "command_center_source_refresh_recovery_status"
  ]) {
    assert.match(sql, new RegExp(`create or replace function public\\.${fn}`, "i"));
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}[^;]+ from public, anon, service_role`, "i"));
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}[^;]+ to authenticated`, "i"));
    assert.doesNotMatch(sql, new RegExp(`grant execute on function public\\.${fn}[^;]+ to service_role`, "i"));
  }
  assert.match(sql, /if u is null or not public\.is_command_center_authorized\(\) then[\s\S]*raise exception 'Unauthorized'/i);
});
