import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateIndependentVerification } from "../dist/agency/verification.js";

const migrationUrl = new URL("../../supabase/migrations/20261024164000_category7_independent_verification.sql", import.meta.url);

test("P7.16 durable verification enforces separation of duties for high/critical risk", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_verification_requests/);
  assert.match(sql, /command_center_agency_verification_decisions/);
  assert.match(sql, /risk not in \('high','critical'\) or executor_id<>verifier_id/);
  assert.match(sql, /High-risk task requires independent verifier/);
  assert.match(sql, /review_type in \('verification','qa','security'\)/);
  assert.match(sql, /task_verified',p_result='accepted'/);
});

test("P7.16 runtime high-risk executor cannot self-certify", () => {
  assert.doesNotThrow(() => validateIndependentVerification({ taskId: "t", executorId: "e1", verifierId: "v1", risk: "high", evidenceRefs: ["evidence"] }));
  assert.throws(() => validateIndependentVerification({ taskId: "t", executorId: "e1", verifierId: "e1", risk: "high", evidenceRefs: ["evidence"] }), /independent verifier/);
  assert.throws(() => validateIndependentVerification({ taskId: "t", executorId: "e1", verifierId: "e1", risk: "low", evidenceRefs: [] }), /requires evidence/);
});
