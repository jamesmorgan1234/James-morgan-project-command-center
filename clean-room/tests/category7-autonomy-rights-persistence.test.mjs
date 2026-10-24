import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canAct, assertAutonomyCannotExpandScope } from "../dist/agency/autonomy.js";

const migrationUrl = new URL("../../supabase/migrations/20261024163000_category7_autonomy_decision_rights.sql", import.meta.url);

test("P7.14 autonomy levels never grant protected/spending authority or broaden scopes", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /protected_actions_granted_by_level boolean not null default false check \(protected_actions_granted_by_level=false\)/);
  assert.match(sql, /spending_granted_by_level boolean not null default false check \(spending_granted_by_level=false\)/);
  assert.match(sql, /Autonomy change cannot expand authority scope/);
  assert.match(sql, /requires_protected_gate/);
  assert.match(sql, /protected_action_requires_separate_authorization/);
  assert.match(sql, /protected_authorization_inherited',false/);
});

test("P7.14 runtime autonomy cannot amplify authority and protected decisions require separate authorization", () => {
  assert.equal(canAct("continuous", "protected", false), false);
  assert.equal(canAct("execute", "protected", true), true);
  assert.equal(canAct("observe", "self_decidable", false), false);
  assert.doesNotThrow(() => assertAutonomyCannotExpandScope(["repo:branch", "project:read"], ["project:read"]));
  assert.throws(() => assertAutonomyCannotExpandScope(["project:read"], ["money:write"]), /cannot amplify authority/);
});
