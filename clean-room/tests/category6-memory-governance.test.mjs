import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateMemoryRetention, applyRetentionChange } from "../dist/brain/memory-governance.js";

const migrationUrl = new URL("../../supabase/migrations/20261024142500_category6_memory_governance.sql", import.meta.url);

test("P6.3 durable memory migration supports full canonical memory vocabulary and append-only retention evidence", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const kind of ["'fact'","'decision'","'rule'","'preference'","'goal'","'asset'","'history'","'owner_input'","'constraint'","'instruction'","'unknown'","'observation'","'precedent'"]) {
    assert.match(sql, new RegExp(kind.replaceAll("'", "\\'")));
  }
  assert.match(sql, /retention_policy/);
  assert.match(sql, /retention_expires_at/);
  assert.match(sql, /command_center_brain_memory_retention_events/);
  assert.match(sql, /command_center_brain_set_memory_retention/);
  assert.match(sql, /cardinality\(coalesce\(p_evidence_refs/);
  assert.match(sql, /for select to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_brain_memory_retention_events\s+to\s+authenticated/i);
});

test("P6.3 retention governance requires evidence and policy-consistent expiry", () => {
  const current = validateMemoryRetention({
    memoryId: "m1",
    policy: "project_lifetime",
    reason: "project context",
    evidenceRefs: ["owner:retention-default"],
    recordedAt: "2026-10-24T16:00:00Z"
  });
  const changed = applyRetentionChange(current, {
    memoryId: "m1",
    previousPolicy: "project_lifetime",
    newPolicy: "time_bounded",
    newExpiresAt: "2027-10-24T16:00:00Z",
    reason: "owner approved one-year retention",
    evidenceRefs: ["decision:retention-1y"],
    occurredAt: "2026-10-24T16:01:00Z"
  });
  assert.equal(changed.policy, "time_bounded");
  assert.equal(changed.expiresAt, "2027-10-24T16:00:00Z");
  assert.throws(() => validateMemoryRetention({ memoryId: "m2", policy: "time_bounded", reason: "bad", evidenceRefs: ["e1"], recordedAt: "2026-10-24T16:00:00Z" }), /requires expiry/);
  assert.throws(() => validateMemoryRetention({ memoryId: "m3", policy: "permanent", expiresAt: "2027-10-24T16:00:00Z", reason: "bad", evidenceRefs: ["e1"], recordedAt: "2026-10-24T16:00:00Z" }), /Only time-bounded/);
  assert.throws(() => validateMemoryRetention({ memoryId: "m4", policy: "owner_review", reason: "bad", evidenceRefs: [], recordedAt: "2026-10-24T16:00:00Z" }), /unique evidence/);
});
