import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261024115000_category3_portability_batches.sql", import.meta.url), "utf8");

test("P3.7 durable portability stages before mutation and preserves conflict/redaction evidence", () => {
  assert.match(sql, /create table if not exists public\.command_center_import_batches/i);
  assert.match(sql, /create table if not exists public\.command_center_import_items/i);
  assert.match(sql, /state text not null default 'staged'/i);
  assert.match(sql, /disposition in \('create','update','duplicate','conflict','redacted'\)/i);
  assert.match(sql, /sensitivity <> 'secret'.*disposition='redacted'.*payload='\{\}'::jsonb/is);
  assert.match(sql, /canonical_mutated',false/i);
  assert.match(sql, /Duplicate item id inside import batch/i);
  assert.match(sql, /would_overwrite_or_skip_canonical_version/i);
});

test("P3.7 commit is single-use protected and revalidates canonical state", () => {
  assert.match(sql, /consume_action_authorization\(u,p_authorization_id,'canonical\.import\.commit','import_batch',b\.id::text\)/i);
  assert.match(sql, /Canonical state changed after import validation/i);
  assert.match(sql, /if i\.disposition in \('duplicate','redacted'\) then continue/i);
  assert.match(sql, /Unresolved import disposition cannot commit/i);
  assert.match(sql, /state='committed'/i);
});

test("P3.7 rollback is protected, lineage-preserving, and refuses unsafe rewind", () => {
  assert.match(sql, /consume_action_authorization\(u,p_authorization_id,'canonical\.import\.rollback','import_batch',b\.id::text\)/i);
  assert.match(sql, /Canonical state advanced after import; automatic rollback is unsafe/i);
  assert.match(sql, /'import-rollback:'\|\|b\.id::text/i);
  assert.match(sql, /operation,source_ref\)[\s\S]*'tombstone'/i);
  assert.match(sql, /operation,source_ref\)[\s\S]*'replace'/i);
  assert.match(sql, /state='rolled_back'/i);
});

test("P3.7 import evidence is owner-readable and directly immutable to browser roles", () => {
  assert.match(sql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table .* to authenticated/i);
});
