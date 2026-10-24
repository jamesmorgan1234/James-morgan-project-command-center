import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { requestPause, requestStop, assertLateResponseAllowed } from "../dist/agency/control.js";

const migrationUrl = new URL("../../supabase/migrations/20261024165500_category7_pause_stop_kill.sql", import.meta.url);

test("P7.19 durable stop/kill atomically fences late workers and releases execution resources", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /generation=generation\+1/);
  assert.match(sql, /command_center_agency_task_claims set status='released'/);
  assert.match(sql, /command_center_agency_resource_claims set released_at/);
  assert.match(sql, /command_center_agency_project_auto_locks set state='released'/);
  assert.match(sql, /command_center_agency_worker_health set state='draining'/);
  assert.match(sql, /late_worker_resurrection_allowed',false/);
  assert.match(sql, /kill_run/);
  assert.match(sql, /kill_project/);
  assert.match(sql, /kill_agency/);
});

test("P7.19 runtime pause preserves generation while stop fences stale responses", () => {
  const base = { runId: "r", generation: 3, paused: false, stopped: false };
  const paused = requestPause(base);
  assert.equal(paused.paused, true);
  assert.equal(paused.generation, 3);
  const stopped = requestStop(paused, "project");
  assert.equal(stopped.stopped, true);
  assert.equal(stopped.generation, 4);
  assert.equal(stopped.killScope, "project");
  assert.throws(() => assertLateResponseAllowed(stopped, 3), /Stopped run rejects late worker response/);
  assert.throws(() => assertLateResponseAllowed({ ...base, generation: 4 }, 3), /generation is stale/);
});
