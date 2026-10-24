import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateDelegation } from "../dist/agency/delegation.js";

const migrationUrl = new URL("../../supabase/migrations/20261024163500_category7_delegation.sql", import.meta.url);

test("P7.15 durable delegation is depth/fan-out bounded, capability matched and non-amplifying", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /child_scopes <@ parent_scopes/);
  assert.match(sql, /Delegation authority amplification blocked/);
  assert.match(sql, /Delegation depth limit exceeded/);
  assert.match(sql, /Delegation fan-out limit exceeded/);
  assert.match(sql, /Delegated capability does not match child task/);
  assert.match(sql, /Delegation cycle detected/);
  assert.match(sql, /authority_amplified',false/);
});

test("P7.15 runtime delegation blocks scope amplification and bounded fan-out/depth", () => {
  const envelope = { parentTaskId: "p", childTaskId: "c", depth: 2, parentScopes: ["repo:branch", "project:read"], childScopes: ["project:read"], capability: "research" };
  assert.doesNotThrow(() => validateDelegation(envelope, 3, 1, 3));
  assert.throws(() => validateDelegation({ ...envelope, depth: 4 }, 3, 1, 3), /depth limit/);
  assert.throws(() => validateDelegation(envelope, 3, 3, 3), /fan-out limit/);
  assert.throws(() => validateDelegation({ ...envelope, childScopes: ["money:write"] }, 3, 1, 3), /authority amplification/);
});
