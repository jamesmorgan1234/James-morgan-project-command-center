import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const migration = new URL("../../supabase/migrations/20261025151000_category6_improvement_decisions.sql", import.meta.url);

test("P6.13 governed improvement decision closes the proposed->accepted/rejected gap without mutating roadmap", async () => {
  const sql = await readFile(migration, "utf8");
  assert.match(sql, /command_center_brain_decide_improvement/);
  assert.match(sql, /p_decision not in \('accepted','rejected'\)/);
  assert.match(sql, /Only a proposed improvement may be decided/);
  assert.match(sql, /Improvement state changed; refresh before deciding/);
  assert.match(sql, /owner decision reference/i);
  assert.match(sql, /Improvement decision requires evidence/);
  assert.match(sql, /installs_automatically',false/);
  assert.match(sql, /roadmap_mutated',false/);
  assert.doesNotMatch(sql, /command_center_roadmap_(create|update|advance)/i);
  assert.match(sql, /revoke all on function public\.command_center_brain_decide_improvement[^;]+from public,anon/);
  assert.match(sql, /grant execute on function public\.command_center_brain_decide_improvement[^;]+to authenticated/);
});
