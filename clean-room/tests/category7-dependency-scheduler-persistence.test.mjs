import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readyTasks, safeSteal } from "../dist/agency/dag.js";

const migrationUrl = new URL("../../supabase/migrations/20261024155500_category7_dependency_scheduler.sql", import.meta.url);

test("P7.6 durable dependency scheduler requires same-project existing dependencies and stable readiness ordering", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_scheduled_tasks/);
  assert.match(sql, /command_center_agency_task_dependencies/);
  assert.match(sql, /Task cannot depend on itself/);
  assert.match(sql, /Dependency must already exist in same project\/run graph/);
  assert.match(sql, /prereq\.state not in \('verified','skipped'\)/);
  assert.match(sql, /t\.capability=any/);
  assert.match(sql, /anti_affinity_keys &&/);
  assert.match(sql, /order by t\.priority asc,t\.created_sequence asc,t\.task_id asc/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_scheduled_tasks\s+to\s+authenticated/i);
});

test("P7.6 runtime scheduler unlocks only verified/skipped dependencies and safe stealing respects capability/anti-affinity", () => {
  const tasks = [
    { id: "a", runId: "r", projectId: "p", title: "A", state: "verified", dependencyIds: [], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: "a", priority: 2, createdSequence: 1, affinityKeys: [], antiAffinityKeys: [] },
    { id: "b", runId: "r", projectId: "p", title: "B", state: "ready", dependencyIds: ["a"], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: "b", priority: 1, createdSequence: 2, affinityKeys: [], antiAffinityKeys: ["db:x"] },
    { id: "c", runId: "r", projectId: "p", title: "C", state: "ready", dependencyIds: ["d"], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: "c", priority: 0, createdSequence: 3, affinityKeys: [], antiAffinityKeys: [] },
    { id: "d", runId: "r", projectId: "p", title: "D", state: "working", dependencyIds: [], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: "d", priority: 0, createdSequence: 4, affinityKeys: [], antiAffinityKeys: [] }
  ];
  assert.deepEqual(readyTasks(tasks).map((x) => x.id), ["b"]);
  assert.equal(safeSteal(tasks[1], ["code"], []), true);
  assert.equal(safeSteal(tasks[1], ["code"], ["db:x"]), false);
  assert.equal(safeSteal(tasks[1], ["research"], []), false);
});
