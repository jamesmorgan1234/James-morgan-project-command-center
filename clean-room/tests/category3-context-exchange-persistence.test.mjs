import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261024121000_category3_context_artifact_exchange.sql", import.meta.url), "utf8");

test("P3.10 persists immutable scoped context snapshots and artifact manifests", () => {
  assert.match(sql, /create table if not exists public\.command_center_context_snapshots/i);
  assert.match(sql, /create table if not exists public\.command_center_context_snapshot_sources/i);
  assert.match(sql, /create table if not exists public\.command_center_artifact_exchange_manifests/i);
  assert.match(sql, /manifest_hash text not null/i);
  assert.match(sql, /source_version bigint not null/i);
  assert.match(sql, /content_hash text not null/i);
  assert.match(sql, /immutable',true/i);
  assert.match(sql, /canonical_mutated',false/i);
});

test("P3.10 enforces owner, project, privacy and content-hash boundaries", () => {
  assert.match(sql, /Context source owner mismatch/i);
  assert.match(sql, /Context source project mismatch/i);
  assert.match(sql, /Context source exceeds snapshot sensitivity boundary/i);
  assert.match(sql, /Context source content hash mismatch/i);
  assert.match(sql, /max_sensitivity in \('internal','sensitive','protected'\)/i);
  assert.doesNotMatch(sql, /max_sensitivity in \([^)]*secret/i);
});

test("P3.10 artifact exchange verifies canonical identity and never exports secret artifacts", () => {
  assert.match(sql, /from public\.command_center_assets where owner_id=u and asset_id=v_asset_id/i);
  assert.match(sql, /Artifact manifest references missing owner asset/i);
  assert.match(sql, /a\.sensitivity='secret'/i);
  assert.match(sql, /Artifact project mismatch/i);
  assert.match(sql, /a\.original_state<>'available'/i);
});

test("P3.10 exchange records are browser-read-only", () => {
  assert.match(sql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table .* to authenticated/i);
});
