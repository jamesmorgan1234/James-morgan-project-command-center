import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TaskClaimStore } from "../dist/agency/leases.js";

const migrationUrl = new URL("../../supabase/migrations/20261024154500_category7_task_claims.sql", import.meta.url);

test("P7.4 durable task claims reject stale/expired workers and enforce idempotent single commit", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /generation bigint not null/);
  assert.match(sql, /fencing_token bigint not null/);
  assert.match(sql, /heartbeat_at/);
  assert.match(sql, /retry_count/);
  assert.match(sql, /unique\(owner_id,project_id,task_id\)/);
  assert.match(sql, /unique\(owner_id,idempotency_key\)/);
  assert.match(sql, /Stale worker fencing token rejected/);
  assert.match(sql, /Expired task claim cannot commit/);
  assert.match(sql, /Task already committed with different result\/idempotency key/);
});

test("P7.4 runtime task claim fencing rejects stale worker after reclaim", () => {
  const claims = new TaskClaimStore();
  const first = claims.claim("t1", "w1", "2026-10-24T16:00:00Z", "2026-10-24T16:01:00Z");
  assert.throws(() => claims.claim("t1", "w2", "2026-10-24T16:00:30Z", "2026-10-24T16:02:00Z"), /already claimed/);
  const second = claims.claim("t1", "w2", "2026-10-24T16:01:01Z", "2026-10-24T16:02:00Z");
  assert.equal(second.fencingToken, first.fencingToken + 1);
  assert.throws(() => claims.assertCommitAllowed("t1", "w1", first.fencingToken, "2026-10-24T16:01:10Z"), /Stale worker/);
  assert.doesNotThrow(() => claims.assertCommitAllowed("t1", "w2", second.fencingToken, "2026-10-24T16:01:10Z"));
});
