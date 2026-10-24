import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { decideWorkLadder } from "../dist/agency/work-ladder.js";

const migrationUrl = new URL("../../supabase/migrations/20261024162000_category7_work_ladder.sql", import.meta.url);

test("P7.12 durable Work ladder only escalates capability/complexity within explicit scope and never auto-launches Work", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /capability_insufficient/);
  assert.match(sql, /execution_complexity/);
  for (const blocker of ["provider_unavailable","quota_unavailable","credentials","missing_input","user_boundary","protected_boundary","verification_failed"]) assert.match(sql, new RegExp(blocker));
  assert.match(sql, /requested_scopes <@ authorized_scopes/);
  assert.match(sql, /Work escalation cannot broaden authorization scope/);
  assert.match(sql, /protected_actions_authorized boolean not null default false check \(protected_actions_authorized=false\)/);
  assert.match(sql, /automatic_work_launch boolean not null default false check \(automatic_work_launch=false\)/);
});

test("P7.12 runtime retries transient failure once, blocks false Work boundaries, and respects rung ceiling", () => {
  const auth = { projectId: "p", runId: "r", projectAuto: true, workAuthorized: true, maxRung: "sol_medium", protectedActionsAuthorized: false };
  assert.equal(decideWorkLadder("normal_chat", "transient_network", auth, 0).action, "retry_once");
  assert.equal(decideWorkLadder("normal_chat", "provider_unavailable", auth, 0).action, "block");
  assert.equal(decideWorkLadder("normal_chat", "capability_insufficient", auth, 0).action, "escalate");
  assert.equal(decideWorkLadder("sol_medium", "execution_complexity", auth, 0).reason, "work_ladder_ceiling");
});
