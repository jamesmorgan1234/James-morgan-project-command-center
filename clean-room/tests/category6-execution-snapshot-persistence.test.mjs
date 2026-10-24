import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { freezeExecutionSnapshot, resolveReferent } from "../dist/brain/execution-snapshot.js";

const migrationUrl = new URL("../../supabase/migrations/20261024145500_category6_execution_snapshots.sql", import.meta.url);

test("P6.9 durable referent/snapshot evidence freezes exact version without execution", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_referent_resolutions/);
  assert.match(sql, /result in \('resolved','ambiguous','missing'\)/);
  assert.match(sql, /command_center_brain_execution_snapshots/);
  assert.match(sql, /proposal_version bigint not null/);
  assert.match(sql, /spec_version bigint not null/);
  assert.match(sql, /'immutable',true,'executed',false/);
  assert.doesNotMatch(sql, /command_center_security_consume_authorization/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_brain_execution_snapshots\s+to\s+authenticated/i);
});

test("P6.9 later proposal edits cannot mutate frozen execution snapshot and ambiguity fails closed", () => {
  const p1 = { id: "proposal-1", projectId: "cc", version: 3, title: "Build", decisionRefs: ["d1"], requirementRefs: ["r1"], actionRefs: ["a1"] };
  assert.equal(resolveReferent("go ahead with that", p1, [p1]).version, 3);
  const snapshot = freezeExecutionSnapshot(p1, "owner-message:1", "snap-1");
  const p2 = { ...p1, version: 4, actionRefs: ["a2"] };
  assert.equal(snapshot.proposalVersion, 3);
  assert.deepEqual(snapshot.actionRefs, ["a1"]);
  assert.notDeepEqual(snapshot.actionRefs, p2.actionRefs);
  assert.throws(() => resolveReferent("that", undefined, [p1]), /ambiguous/);
  assert.throws(() => resolveReferent("unknown", undefined, [p1]), /ambiguous/);
});
