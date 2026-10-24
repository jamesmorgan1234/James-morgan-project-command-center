import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function migration(name) {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

test("server policy preserves exact Sol Medium protected approval semantics", () => {
  const sql = migration("20261024105700_category2_sol_medium_policy_alignment.sql");
  assert.match(sql, /\('agent_mode_work_sol_medium',\s*'protected',\s*'agent_step',\s*interval '10 minutes'\)/i);
  assert.match(sql, /create or replace function command_center_private\.security_action_policy/i);
  assert.match(sql, /revoke all on function command_center_private\.security_action_policy\(text\) from public, anon, authenticated/i);
});
