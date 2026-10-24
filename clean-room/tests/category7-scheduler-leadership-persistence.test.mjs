import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SchedulerControlPlane } from "../dist/agency/scheduler.js";

const migrationUrl = new URL("../../supabase/migrations/20261024154000_category7_scheduler_leadership.sql", import.meta.url);

test("P7.3 durable scheduler leadership is transactional and monotonically fenced", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /for update/);
  assert.match(sql, /fencing_token/);
  assert.match(sql, /Scheduler leadership already held by another live leader/);
  assert.match(sql, /Scheduler leadership\/fencing mismatch/);
  assert.match(sql, /Scheduler leadership expired/);
  assert.match(sql, /command_center_agency_scheduler_leadership_events/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_scheduler_leases\s+to\s+authenticated/i);
});

test("P7.3 runtime rejects split-brain leadership and stale fencing tokens", () => {
  const control = new SchedulerControlPlane();
  const first = control.acquire("leader-a", "2026-10-24T16:00:00Z", "2026-10-24T16:01:00Z");
  assert.equal(first.fencingToken, 1);
  assert.throws(() => control.acquire("leader-b", "2026-10-24T16:00:30Z", "2026-10-24T16:02:00Z"), /already held/);
  const second = control.acquire("leader-b", "2026-10-24T16:01:01Z", "2026-10-24T16:02:00Z");
  assert.equal(second.fencingToken, 2);
  assert.throws(() => control.assertLeader("leader-a", first.fencingToken, "2026-10-24T16:01:10Z"), /mismatch/);
  assert.doesNotThrow(() => control.assertLeader("leader-b", second.fencingToken, "2026-10-24T16:01:10Z"));
});
