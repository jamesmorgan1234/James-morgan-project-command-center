import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transitionRun } from "../dist/agency/types.js";

const migrationUrl = new URL("../../supabase/migrations/20261024152500_category7_run_job_task_state.sql", import.meta.url);

test("P7.1 durable Agency state models make queued/working/completed semantics explicit", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const table of ["command_center_agency_runs","command_center_agency_jobs","command_center_agency_tasks","command_center_agency_state_events"]) assert.match(sql, new RegExp(table));
  for (const field of ["risk","cost_class","preferred_environment","capability","retry_count","blocker","checkpoint","evidence_refs"]) assert.match(sql, new RegExp(field));
  assert.match(sql, /Invalid Agency run transition/);
  assert.match(sql, /Completed run requires verification evidence/);
  assert.match(sql, /Stop-requested run may only transition to stopped/);
  assert.match(sql, /Pause-requested run cannot enter working/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_runs\s+to\s+authenticated/i);
});

test("P7.1 runtime run transitions reject fake completion and invalid recovery paths", () => {
  const base = { id: "r", ownerId: "o", projectId: "p", controlMode: "project_auto", objective: "Build", state: "draft", authorizationRef: "a", generation: 1, createdAt: "2026-10-24T16:00:00Z", updatedAt: "2026-10-24T16:00:00Z", stopRequested: false, pauseRequested: false };
  const queued = transitionRun(base, "queued", "2026-10-24T16:00:01Z");
  const working = transitionRun(queued, "working", "2026-10-24T16:00:02Z");
  const completed = transitionRun(working, "completed", "2026-10-24T16:00:03Z");
  assert.equal(completed.state, "completed");
  assert.throws(() => transitionRun(base, "completed", "2026-10-24T16:00:01Z"), /Invalid Agency run transition/);
  assert.throws(() => transitionRun({ ...queued, stopRequested: true }, "working", "2026-10-24T16:00:02Z"), /only transition to stopped/);
});
