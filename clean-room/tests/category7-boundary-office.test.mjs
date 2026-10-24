import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../../supabase/migrations/20261024161500_category7_boundary_office.sql", import.meta.url);

test("P7.11 durable Boundary Office survives session loss and never auto-launches Work", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const mode of ["next_step","until_work","to_work_barriers","manual_task","project_checkpoint","needs_me"]) assert.match(sql, new RegExp(mode));
  assert.match(sql, /blocker_code/);
  assert.match(sql, /owner_action/);
  assert.match(sql, /verification_method/);
  assert.match(sql, /resume_task_id/);
  assert.match(sql, /resume_context_ref/);
  assert.match(sql, /automatic_work_launch boolean not null default false check \(automatic_work_launch=false\)/);
  assert.match(sql, /stale_generation/);
  assert.match(sql, /resume_allowed=\(result='verified_resolved'\)/);
});
