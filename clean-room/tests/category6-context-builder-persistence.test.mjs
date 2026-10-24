import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBrainContext } from "../dist/brain/context-builder.js";

const migrationUrl = new URL("../../supabase/migrations/20261024143000_category6_context_builder_evidence.sql", import.meta.url);

test("P6.4 durable context build binds selection evidence to immutable owner/project snapshot", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_context_builds/);
  assert.match(sql, /command_center_context_snapshots/);
  assert.match(sql, /command_center_context_snapshot_sources/);
  assert.match(sql, /Context snapshot is outside owner\/project scope/);
  assert.match(sql, /Selected context source is not part of immutable snapshot/);
  assert.match(sql, /for select to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_brain_context_builds\s+to\s+authenticated/i);
});

test("P6.4 Context Builder filters cross-project, stale, sensitivity and low-relevance candidates", () => {
  const packet = buildBrainContext({ ownerId: "owner-1", projectId: "project-a", now: "2026-10-24T16:00:00Z", maxSensitivityRank: 2, minRelevance: 0.5, maxItems: 2 }, [
    { id: "keep", ownerId: "owner-1", projectId: "project-a", kind: "checkpoint", relevance: 1, sensitivityRank: 2, observedAt: "2026-10-24T15:00:00Z", sourceRef: "cp", value: {} },
    { id: "other-project", ownerId: "owner-1", projectId: "project-b", kind: "checkpoint", relevance: 1, sensitivityRank: 1, observedAt: "2026-10-24T15:00:00Z", sourceRef: "cp2", value: {} },
    { id: "stale", ownerId: "owner-1", projectId: "project-a", kind: "fact", relevance: 1, sensitivityRank: 1, observedAt: "2026-10-24T14:00:00Z", staleAfter: "2026-10-24T15:30:00Z", sourceRef: "old", value: {} },
    { id: "too-sensitive", ownerId: "owner-1", projectId: "project-a", kind: "fact", relevance: 1, sensitivityRank: 3, observedAt: "2026-10-24T15:00:00Z", sourceRef: "s", value: {} },
    { id: "low", ownerId: "owner-1", projectId: "project-a", kind: "fact", relevance: 0.2, sensitivityRank: 1, observedAt: "2026-10-24T15:00:00Z", sourceRef: "l", value: {} }
  ]);
  assert.deepEqual(packet.items.map((item) => item.id), ["keep"]);
  assert.deepEqual(packet.omittedStaleIds, ["stale"]);
});
