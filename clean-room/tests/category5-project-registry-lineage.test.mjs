import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ProjectLineageLedger } from "../dist/projects/index.js";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

test("P5.1 durable project registry extends Category 3 canonical truth instead of legacy project tables", async () => {
  const sql = await read("../supabase/migrations/20261024130000_category5_project_registry.sql");
  assert.match(sql, /command_center_project_types/);
  assert.match(sql, /command_center_project_profiles/);
  assert.match(sql, /command_center_project_capabilities/);
  assert.match(sql, /command_center_project_authorizations/);
  assert.match(sql, /references public\.command_center_canonical_entities/);
  assert.match(sql, /entity_type,version,schema_version,payload,content_hash/);
  assert.match(sql, /Owner project-creation decision is required/);
  assert.match(sql, /grant select on table public\.%I to authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all) on table public\.%I to authenticated/i);
  assert.doesNotMatch(sql, /insert into public\.(projects|cc7_projects)/i);
});

test("P5.1 generic type registration owns capabilities and detail-section relationships", async () => {
  const sql = await read("../supabase/migrations/20261024130000_category5_project_registry.sql");
  assert.match(sql, /command_center_project_register_type/);
  assert.match(sql, /default_capabilities/);
  assert.match(sql, /required_detail_sections/);
  assert.match(sql, /Project type capabilities/);
  assert.match(sql, /Project detail sections/);
});

test("P5.2 durable lineage is append-only to browser roles and owner-decision governed", async () => {
  const sql = await read("../supabase/migrations/20261024131000_category5_project_lineage.sql");
  assert.match(sql, /command_center_project_lineage_events/);
  assert.match(sql, /event_type in \('created','renamed','mission_changed','alias_added','merged','superseded','forked','branched','reactivated','retired'\)/);
  assert.match(sql, /grant select on table public\.command_center_project_lineage_events to authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all) on table public\.command_center_project_lineage_events to authenticated/i);
  assert.match(sql, /Owner decision evidence is required/);
  assert.match(sql, /cardinality\(evidence_refs\)>0/);
});

test("P5.2 in-memory lineage preserves current name, mission and aliases with evidence", () => {
  const ledger = new ProjectLineageLedger();
  ledger.append({ id: "created", projectId: "p1", kind: "created", occurredAt: "2026-10-24T12:00:00Z", evidenceRefs: ["source:create"] });
  ledger.append({ id: "rename", projectId: "p1", kind: "renamed", occurredAt: "2026-10-24T12:01:00Z", ownerDecisionRef: "owner:rename", fromName: "Old", toName: "New", evidenceRefs: ["source:rename"] });
  ledger.append({ id: "mission", projectId: "p1", kind: "mission_changed", occurredAt: "2026-10-24T12:02:00Z", ownerDecisionRef: "owner:mission", fromMission: "Old mission", toMission: "New mission", evidenceRefs: ["source:mission"] });
  ledger.append({ id: "alias", projectId: "p1", kind: "alias_added", occurredAt: "2026-10-24T12:03:00Z", ownerDecisionRef: "owner:alias", alias: "Legacy Name", evidenceRefs: ["source:alias"] });
  assert.equal(ledger.currentName("p1", "Old"), "New");
  assert.equal(ledger.currentMission("p1", "Old mission"), "New mission");
  assert.deepEqual(ledger.aliases("p1"), ["Legacy Name"]);
  assert.throws(() => ledger.append({ id: "fork", projectId: "p1", kind: "forked", occurredAt: "2026-10-24T12:04:00Z", relatedProjectId: "p2", evidenceRefs: ["source:fork"] }));
});
