import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261025011500_category3_source_provenance_refresh_retrofit.sql", import.meta.url), "utf8");

test("Category 3 retrofit persists source identity, provenance, derived lifecycle, provider drift, and refresh state", () => {
  for (const table of [
    "command_center_source_registry",
    "command_center_source_versions",
    "command_center_source_observations",
    "command_center_derived_records",
    "command_center_derived_provenance",
    "command_center_provider_capability_snapshots",
    "command_center_source_refresh_leases",
    "command_center_source_refresh_checkpoints",
    "command_center_source_refresh_runs",
    "command_center_source_refresh_inventory"
  ]) assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
});

test("source identity is stable, scoped, versioned, and historical or untrusted content stays data-only", () => {
  assert.match(sql, /command_center_source_stable_identity_idx/i);
  assert.match(sql, /coalesce\(company_id,''\).*coalesce\(project_id,''\).*coalesce\(account_id,''\).*coalesce\(environment,''\)/is);
  assert.match(sql, /environment is null or environment in \('development','test','staging','production'\)/i);
  assert.match(sql, /trust not in \('historical_evidence','untrusted_external'\) or instruction_policy='data_only'/i);
  assert.match(sql, /command_center_source_versions/i);
  assert.match(sql, /Source version conflict/i);
  assert.match(sql, /Historical\/untrusted source content is data only/i);
});

test("observations separate observed effective and ingested time and enforce explicit correction\/retraction lineage", () => {
  assert.match(sql, /observed_at timestamptz not null/i);
  assert.match(sql, /effective_at timestamptz not null/i);
  assert.match(sql, /ingested_at timestamptz not null/i);
  assert.match(sql, /state in \('current','superseded','corrected','retracted','tombstone'\)/i);
  assert.match(sql, /command_center_source_one_live_observation_idx/i);
  assert.match(sql, /Source observation sequence gap/i);
  assert.match(sql, /must explicitly supersede latest observation/i);
  assert.match(sql, /state='superseded'/i);
  assert.match(sql, /p_state='tombstone'.*lifecycle='tombstoned'/is);
});

test("superseded source truth invalidates derived data while legal holds restrict instead of delete", () => {
  assert.match(sql, /command_center_derived_provenance_observation_idx/i);
  assert.match(sql, /case when d\.legal_hold then 'restricted' else 'deleted' end/i);
  assert.match(sql, /legal_hold:upstream_superseded/i);
  assert.match(sql, /Derived provenance must reference current\/corrected source truth/i);
  assert.match(sql, /Derived provenance scope mismatch/i);
});

test("provider capability snapshots preserve verified capability truth and visibly classify breaking or unknown-pricing drift", () => {
  assert.match(sql, /command_center_provider_capability_snapshots/i);
  for (const key of ["enumerate_all","stable_ids","updated_metadata","revision_ids","content_hashes","delta_fetch","deletion_detection","stable_pagination"]) assert.match(sql, new RegExp(key, "i"));
  assert.match(sql, /verified_supported','verified_unsupported','unverified/i);
  assert.match(sql, /v_drift:='pricing_unknown'/i);
  assert.match(sql, /v_drift:='breaking'/i);
  assert.match(sql, /safe_for_automatic_reuse/i);
});

test("refresh leases use persisted generations and reject stale, expired, or conflicting commits while allowing exact lost-response replay", () => {
  assert.match(sql, /generation bigint not null default 0/i);
  assert.match(sql, /v_generation:=l\.generation\+1/i);
  assert.match(sql, /Source refresh already leased/i);
  assert.match(sql, /Stale refresh generation rejected/i);
  assert.match(sql, /Expired refresh lease cannot commit/i);
  assert.match(sql, /duplicate_commit',true/i);
  assert.match(sql, /already committed with different checkpoint/i);
  assert.match(sql, /holder_id=null,acquired_at=null,expires_at=null/i);
});

test("refresh coverage explicitly accounts for readable, unreadable, tombstone, and unaccounted sources", () => {
  assert.match(sql, /state in \('readable','unreadable','tombstone'\)/i);
  assert.match(sql, /unreadable.*tombstone.*reason/is);
  assert.match(sql, /v_unaccounted:=greatest\(0,p_expected_count-v_total\)/i);
  assert.match(sql, /v_complete:=coalesce\(p_enumeration_complete,false\) and v_unaccounted=0/i);
  assert.match(sql, /Refresh inventory stable ids must be unique/i);
  assert.match(sql, /duplicate_run',true/i);
});

test("new durable source tables are owner-readable only and mutate through authorized narrow RPCs", () => {
  assert.match(sql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table .* to authenticated/i);
  assert.match(sql, /security definer set search_path=''/i);
  assert.match(sql, /if u is null or not public\.is_command_center_authorized\(\) then raise exception 'Unauthorized'/i);
  assert.match(sql, /revoke all on function public\.command_center_source_register/i);
  assert.match(sql, /grant execute on function public\.command_center_source_record_refresh_coverage/i);
});
