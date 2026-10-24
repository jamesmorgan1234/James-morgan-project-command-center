import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261024123000_category3_recovery_scale_evidence.sql", import.meta.url), "utf8");

test("P3.12 persists privacy-safe recovery evidence", () => {
  assert.match(sql, /create table if not exists public\.command_center_data_recovery_runs/i);
  assert.match(sql, /recovery_kind in \('projection_rebuild','provider_replacement_validation','import_rollback','migration_validation','scale_test'\)/i);
  assert.match(sql, /state in \('running','succeeded','failed'\)/i);
  assert.match(sql, /evidence_hash text/i);
  assert.match(sql, /details::text !~\*.*secret\|token\|password/i);
});

test("projection recovery rebuilds only derived state and preserves prior projection on failure", () => {
  assert.match(sql, /delete from public\.command_center_canonical_projection where owner_id=u/i);
  assert.match(sql, /from public\.command_center_canonical_entities where owner_id=u/i);
  assert.match(sql, /The inner subtransaction rolls back any partial projection rewrite/i);
  assert.match(sql, /projection_preserved',true/i);
  assert.match(sql, /canonical_mutated',false/i);
  assert.doesNotMatch(sql, /update public\.command_center_canonical_entities/i);
  assert.doesNotMatch(sql, /delete from public\.command_center_canonical_entities/i);
});

test("provider replacement validation honors capability and free-first gates without switching provider", () => {
  assert.match(sql, /paid_replacement_violates_free_first/i);
  assert.match(sql, /replacement_provider_missing_required_capability/i);
  assert.match(sql, /same_provider_replacement_must_advance_version/i);
  assert.match(sql, /provider_switched',false/i);
  assert.doesNotMatch(sql, /update public\.command_center_provider_registry/i);
});

test("recovery evidence is owner-readable and directly immutable to browser roles", () => {
  assert.match(sql, /revoke all on table public\.command_center_data_recovery_runs from public,anon,authenticated/i);
  assert.match(sql, /grant select on table public\.command_center_data_recovery_runs to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
});
