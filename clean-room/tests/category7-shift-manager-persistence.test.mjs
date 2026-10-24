import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectShift } from "../dist/agency/shift.js";

const migrationUrl = new URL("../../supabase/migrations/20261024165000_category7_shift_manager.sql", import.meta.url);

test("P7.18 durable Shift Manager tracks real worker health/stalls and explicit owner needs", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_worker_health/);
  assert.match(sql, /command_center_agency_shift_incidents/);
  assert.match(sql, /command_center_agency_shift_actions/);
  assert.match(sql, /kind in \('stalled','failed','blocked','resource_pressure','orphaned'\)/);
  assert.match(sql, /owner_attention_required/);
  assert.match(sql, /Resolve worker blocker/);
  assert.match(sql, /Replacement worker unavailable or wrong project/);
});

test("P7.18 runtime classifies stalled/failed/blocked workers truthfully", () => {
  const incidents = inspectShift([
    { workerId: "w1", projectId: "p", taskId: "t1", state: "working", lastHeartbeatAt: "2026-10-24T16:00:00Z" },
    { workerId: "w2", projectId: "p", taskId: "t2", state: "failed", lastHeartbeatAt: "2026-10-24T16:00:30Z" },
    { workerId: "w3", projectId: "p", taskId: "t3", state: "blocked", lastHeartbeatAt: "2026-10-24T16:00:30Z" }
  ], "2026-10-24T16:02:00Z", 60000);
  assert.deepEqual(incidents.map((x) => [x.workerId, x.kind, x.ownerAttentionRequired]), [["w1","stalled",false],["w2","failed",false],["w3","blocked",true]]);
});
