import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applySteering } from "../dist/brain/steering.js";

const migrationUrl = new URL("../../supabase/migrations/20261024150000_category6_live_steering.sql", import.meta.url);

test("P6.10 durable steering preserves verified output and requires reauthorization for scope changes", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_steering_events/);
  assert.match(sql, /command in \('pause','resume','reprioritize','change','redirect'\)/);
  assert.match(sql, /requires_authorization_recheck/);
  assert.match(sql, /Scope-changing steering requires authorization recheck/);
  assert.match(sql, /Verified preserved units cannot also be invalidated/);
  assert.doesNotMatch(sql, /command_center_security_consume_authorization/);
});

test("P6.10 runtime invalidates affected downstream work and preserves unaffected verified units", () => {
  const result = applySteering("change", ["b"], [
    { id: "a", dependencyIds: [], verified: true, authorizationScope: ["project"] },
    { id: "b", dependencyIds: ["a"], verified: false, authorizationScope: ["project"] },
    { id: "c", dependencyIds: ["b"], verified: false, authorizationScope: ["project"] },
    { id: "d", dependencyIds: [], verified: true, authorizationScope: ["project"] }
  ]);
  assert.deepEqual([...result.preservedVerifiedIds].sort(), ["a", "d"]);
  assert.deepEqual([...result.invalidatedIds].sort(), ["b", "c"]);
  assert.equal(result.requiresAuthorizationRecheck, true);
  assert.equal(applySteering("pause", ["b"], [{ id: "b", dependencyIds: [], verified: false, authorizationScope: [] }]).requiresAuthorizationRecheck, false);
});
