import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function migration(name) {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

const sql = migration("20261024113000_category3_sync_reconciliation.sql");

test("P3.6 persists sync events, conflicts, cursors, and a derived projection", () => {
  for (const table of ["command_center_sync_events","command_center_sync_conflicts","command_center_sync_cursors","command_center_canonical_projection"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
  }
  assert.match(sql, /Projection is derived state only; canonical tables remain source of truth/i);
  assert.match(sql, /trg_c3_project_canonical_entity/i);
});

test("sync envelopes are idempotent and content-addressed", () => {
  assert.match(sql, /where owner_id=u and event_id=p_event_id/i);
  assert.match(sql, /idempotent_replay/i);
  assert.match(sql, /c3_hash_json\(p_payload\)/i);
  assert.match(sql, /Sync payload hash mismatch/i);
});

test("reconciliation never lets stale or ambiguous state silently overwrite newer truth", () => {
  assert.match(sql, /p_version<e\.version[\s\S]*reject_stale/i);
  assert.match(sql, /p_version=e\.version and v_hash=e\.content_hash[\s\S]*ignore_duplicate/i);
  assert.match(sql, /p_version=e\.version and v_hash<>e\.content_hash[\s\S]*same_version_different_hash/i);
  assert.match(sql, /p_version>e\.version\+1[\s\S]*reconcile_gap/i);
  assert.match(sql, /p_updated_at<e\.updated_at[\s\S]*temporal_regression/i);
  assert.match(sql, /Tombstoned canonical entity cannot be silently revived by sync/i);
  assert.match(sql, /cannot change canonical identity or project ownership/i);
});

test("only the exact next version is applied transactionally after the row lock", () => {
  assert.match(sql, /select \* into e from public\.command_center_canonical_entities[\s\S]*for update/i);
  assert.match(sql, /p_version>e\.version\+1/i);
  assert.match(sql, /update public\.command_center_canonical_entities set version=p_version/i);
  assert.match(sql, /command_center_canonical_entity_versions/i);
  assert.match(sql, /'accept','next_version'/i);
});

test("conflict resolution records evidence without mutating canonical truth", () => {
  assert.match(sql, /command_center_resolve_sync_conflict/i);
  assert.match(sql, /p_resolution not in \('keep_local','rebuild_required'\)/i);
  assert.match(sql, /Explicit reconciliation resolution evidence is required/i);
  assert.match(sql, /'canonical_mutated',false/i);
});

test("sync evidence is owner-readable but directly immutable to browser roles", () => {
  assert.match(sql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table .* to authenticated/i);
});
