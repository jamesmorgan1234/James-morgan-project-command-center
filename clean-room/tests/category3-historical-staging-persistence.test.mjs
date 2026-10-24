import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/20261024120000_category3_historical_export_staging.sql", import.meta.url), "utf8");

test("P3.8 historical export staging persists inventory without canonical activation", () => {
  assert.match(sql, /create table if not exists public\.command_center_historical_conversations/i);
  assert.match(sql, /create table if not exists public\.command_center_historical_message_nodes/i);
  assert.match(sql, /create table if not exists public\.command_center_historical_message_edges/i);
  assert.match(sql, /import_kind.*historical_chat_export/is);
  assert.match(sql, /canonical_mutated',false/i);
  assert.match(sql, /projects_created',false/i);
  assert.match(sql, /projects_activated',false/i);
  assert.doesNotMatch(sql, /insert into public\.projects/i);
});

test("P3.8 secret-shaped historical content must be redacted before storage", () => {
  assert.match(sql, /c3_historical_text_safe/i);
  assert.match(sql, /Bearer\[\[:space:\]\]\+/i);
  assert.match(sql, /PRIVATE KEY/i);
  assert.match(sql, /must be redacted before staging/i);
  assert.match(sql, /content_state in \('none','keep','redact'\)/i);
  assert.match(sql, /content_state in \('none','redact'\).*text_content is null/is);
});

test("P3.9 preserves full parent-child graph and refuses branch flattening", () => {
  assert.match(sql, /branch_point_count/i);
  assert.match(sql, /jsonb_array_length\(coalesce\(node->'children'/i);
  assert.match(sql, /Historical parent\/child graph mismatch/i);
  assert.match(sql, /Historical graph contains orphan parent references/i);
  assert.match(sql, /unique\(owner_id,batch_id,conversation_id,parent_node_id,ordinal\)/i);
});

test("P3.9 keeps project-container membership and standalone candidates distinct", () => {
  assert.match(sql, /lineage_class in \('project_container_member','standalone_candidate'\)/i);
  assert.match(sql, /case when v_template_id is null then 'standalone_candidate' else 'project_container_member' end/i);
  assert.match(sql, /command_center_historical_template_idx/i);
  assert.match(sql, /command_center_historical_standalone_idx/i);
});

test("historical staging evidence is owner-readable and immutable to browser roles", () => {
  assert.match(sql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
});
