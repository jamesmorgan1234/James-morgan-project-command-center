import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { arbitrateIntegration } from "../dist/agency/integration.js";

const migrationUrl = new URL("../../supabase/migrations/20261024164500_category7_integration_arbitration.sql", import.meta.url);

test("P7.17 durable integration arbitration rejects overlapping divergent outputs and requires cross-module tests", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_integration_batches/);
  assert.match(sql, /command_center_agency_integration_candidates/);
  assert.match(sql, /command_center_agency_integration_decisions/);
  assert.match(sql, /count\(distinct artifact_version::text\|\|':'\|\|content_hash\)>1/);
  assert.match(sql, /Conflict-free integration still requires cross-module test evidence/);
  assert.match(sql, /last_write_wins',false/);
});

test("P7.17 runtime arbitration never silently last-write-wins", () => {
  assert.deepEqual(arbitrateIntegration([
    { taskId: "t1", artifactKey: "file:a", version: 1, contentHash: "a".repeat(64), verificationRefs: ["v1"] },
    { taskId: "t2", artifactKey: "file:a", version: 2, contentHash: "b".repeat(64), verificationRefs: ["v2"] }
  ]), { acceptedTaskIds: [], conflicts: ["file:a"] });
  assert.throws(() => arbitrateIntegration([{ taskId: "t3", artifactKey: "file:b", version: 1, contentHash: "c".repeat(64), verificationRefs: [] }]), /lacks verification/);
});
