import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { activateProjectAuto } from "../dist/agency/modes.js";

const migrationUrl = new URL("../../supabase/migrations/20261024160500_category7_project_auto.sql", import.meta.url);

test("P7.9 durable Project Auto binds one exact project/checkpoint/generation and returns working or truthful blocker", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_project_auto_locks/);
  assert.match(sql, /command_center_agency_project_auto_activations/);
  assert.match(sql, /run_not_at_latest_verified_checkpoint/);
  assert.match(sql, /project_locked_by_other_run/);
  assert.match(sql, /no_ready_task/);
  assert.match(sql, /no_eligible_executor/);
  assert.match(sql, /result in \('working','blocked'\)/);
  assert.match(sql, /e\.cost_class<>'paid'/);
  assert.doesNotMatch(sql, /result text not null check \(result in \('queued'/);
});

test("P7.9 runtime Project Auto never drifts projects or fakes queued state", () => {
  const run = { id: "agency-run:r1", ownerId: "o", projectId: "p1", controlMode: "project_auto", objective: "Build", state: "queued", authorizationRef: "a", generation: 1, createdAt: "2026-10-24T16:00:00Z", updatedAt: "2026-10-24T16:00:00Z", stopRequested: false, pauseRequested: false };
  const executor = { key: "executor:e", version: 1, enabled: true, environments: ["normal_chat"], capabilities: ["code"], projectTypeKeys: [], permissionScopes: [], costClass: "free", health: "available", verificationStrategy: "independent", maxRisk: "high" };
  assert.deepEqual(activateProjectAuto({ run, projectAutoEnabled: true, selectedProjectId: "p1", projectAgentAccessEnabled: true, executorCandidates: [executor], firstTaskId: "t1" }), { state: "working", runId: "agency-run:r1", projectId: "p1", taskId: "t1", executorKey: "executor:e" });
  assert.equal(activateProjectAuto({ run, projectAutoEnabled: true, selectedProjectId: "p2", projectAgentAccessEnabled: true, executorCandidates: [executor], firstTaskId: "t1" }).state, "blocked");
  assert.equal(activateProjectAuto({ run, projectAutoEnabled: true, selectedProjectId: "p1", projectAgentAccessEnabled: true, executorCandidates: [executor] }).state, "blocked");
});
