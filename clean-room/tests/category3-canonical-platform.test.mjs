import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function migration(name) {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

const sql = migration("20261024112000_category3_canonical_platform.sql");
const provenanceSql = migration("20261024114000_category3_knowledge_provenance_invariant.sql");

test("P3 canonical platform persists entities, provenance, assets, graph, and providers", () => {
  for (const table of [
    "command_center_canonical_entities",
    "command_center_canonical_entity_versions",
    "command_center_knowledge_claims",
    "command_center_assets",
    "command_center_asset_versions",
    "command_center_graph_nodes",
    "command_center_graph_edges",
    "command_center_provider_registry",
    "command_center_provider_versions"
  ]) assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
});

test("canonical mutations are owner-authorized, versioned, and tombstones cannot silently revive", () => {
  assert.match(sql, /command_center_canonical_create_entity/i);
  assert.match(sql, /command_center_canonical_replace_entity/i);
  assert.match(sql, /Canonical version conflict/i);
  assert.match(sql, /Tombstoned canonical entity cannot be silently revived/i);
  assert.match(sql, /command_center_canonical_tombstone_entity/i);
  assert.match(sql, /command_center_canonical_entity_versions/i);
  assert.match(sql, /not public\.is_command_center_authorized\(\)/i);
});

test("knowledge truth state preserves known zero versus unknown and N\/A with storage-level provenance integrity", () => {
  assert.match(sql, /truth_state in \('known','unknown','not_applicable'\)/i);
  assert.match(sql, /truth_state='known' and value_jsonb is not null/i);
  assert.match(sql, /truth_state in \('unknown','not_applicable'\) and value_jsonb is null/i);
  assert.match(sql, /kind <> 'inferred' or confidence < 1/i);
  assert.match(sql, /Current knowledge requires explicit advancing supersession/i);
  assert.match(sql, /c3_assert_unique_text_array\(p_source_refs,'source_refs'\)/i);
  assert.match(provenanceSql, /c3_text_array_unique_nonblank\(source_refs\)/i);
  assert.match(provenanceSql, /command_center_knowledge_source_refs_unique_nonblank/i);
  assert.match(provenanceSql, /Existing knowledge provenance violates unique nonblank source_refs invariant/i);
});

test("locked assets require explicit owner evidence and the Category 2 protected gate", () => {
  assert.match(sql, /a\.approval_state='locked'/i);
  assert.match(sql, /Locked asset replacement requires owner decision evidence/i);
  assert.match(sql, /consume_action_authorization\(u,p_authorization_id,'protected_asset\.modify','protected_asset',a\.asset_id\)/i);
  assert.match(sql, /original_state <> 'available' or sha256 is not null/i);
});

test("graph ownership and alias lineage are constrained", () => {
  assert.match(sql, /foreign key\(owner_id,from_node_id\)/i);
  assert.match(sql, /foreign key\(owner_id,to_node_id\)/i);
  assert.match(sql, /check \(from_node_id <> to_node_id\)/i);
  assert.match(sql, /command_center_graph_active_alias_idx/i);
  assert.match(sql, /relation='aliases' and superseded_at is null/i);
});

test("provider registry is replaceable metadata only and rejects raw secret-shaped configuration", () => {
  assert.match(sql, /credential_reference_id is null or credential_reference_id ~ '\^\(secret-ref\|provider-ref\):/i);
  assert.match(sql, /configuration::text !~\*.*secret\|token\|password/i);
  assert.match(sql, /Bearer\[\[:space:\]\]\+/i);
  assert.match(sql, /command_center_register_provider/i);
  assert.match(sql, /New provider requires version 1 and provenance/i);
  assert.match(sql, /command_center_replace_provider/i);
  assert.match(sql, /Provider version conflict/i);
  assert.match(sql, /c3_assert_unique_text_array/i);
  assert.doesNotMatch(sql, /cardinality\(array\(select distinct unnest/i);
});

test("canonical tables expose owner-scoped reads but no direct authenticated mutations", () => {
  assert.match(sql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\).*is_command_center_authorized/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table .* to authenticated/i);
});
