import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recoverExpiredAssignment } from "../dist/agency/recovery.js";

const migrationUrl = new URL("../../supabase/migrations/20261024171500_category7_recovery_failover.sql", import.meta.url);

test("P7.23 durable recovery is idempotent, exactly-once, checkpoint/queue preserving, and generation fenced", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /unique\(owner_id,recovery_key\)/);
  assert.match(sql, /blocked_already_committed/);
  assert.match(sql, /blocked_live_lease/);
  assert.match(sql, /duplicate_side_effect_prevented boolean not null default true check \(duplicate_side_effect_prevented=true\)/);
  assert.match(sql, /v_generation:=c\.generation\+1/);
  assert.match(sql, /v_fence:=c\.fencing_token\+1/);
  assert.match(sql, /Recovery requires preserved project lock/);
  assert.match(sql, /Recovery Project Agent\/checkpoint mismatch/);
  assert.match(sql, /queue_ref/);
  assert.match(sql, /context_revalidation_required/);
  assert.match(sql, /No eligible replacement lead/);
  assert.match(sql, /authority_expanded',false/);
});

test("P7.23 runtime recovery reaps only expired assignments and preserves checkpoint/evidence", () => {
  const expired = { taskId: "t1", workerId: "w1", generation: 2, fencingToken: 5, claimedAt: "2026-10-24T16:00:00Z", expiresAt: "2026-10-24T16:01:00Z", checkpointRef: "cp1", evidenceRefs: ["e1"] };
  const recovered = recoverExpiredAssignment(expired, "w2", "2026-10-24T16:01:01Z");
  assert.equal(recovered.workerId, "w2");
  assert.equal(recovered.generation, 3);
  assert.equal(recovered.fencingToken, 6);
  assert.equal(recovered.checkpointRef, "cp1");
  assert.deepEqual(recovered.evidenceRefs, ["e1"]);
  assert.throws(() => recoverExpiredAssignment({ ...expired, expiresAt: "2026-10-24T16:02:00Z" }, "w2", "2026-10-24T16:01:01Z"), /not expired/);
  assert.throws(() => recoverExpiredAssignment({ ...expired, checkpointRef: undefined }, "w2", "2026-10-24T16:01:01Z"), /checkpoint/);
});
