import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateOwnerPrecedent } from "../dist/brain/precedent.js";

const migrationUrl = new URL("../../supabase/migrations/20261024150500_category6_owner_precedent.sql", import.meta.url);

test("P6.11 durable precedent evaluation never inherits authorization", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_precedent_evaluations/);
  assert.match(sql, /authorization_inherited boolean not null default false check \(authorization_inherited=false\)/);
  assert.match(sql, /material_context_difference/);
  assert.match(sql, /same_material_context_default_only/);
  assert.doesNotMatch(sql, /command_center_security_consume_authorization/);
});

test("P6.11 material account, risk or cost differences block precedent reuse", () => {
  const precedent = { decisionRef: "d1", context: { projectType: "software", accountScope: "cc", riskClass: "low", costClass: "free", actionClass: "build" }, reusableAsDefault: true, grantsAuthorization: true };
  assert.deepEqual(evaluateOwnerPrecedent(precedent, precedent.context), { applies: true, reason: "same_material_context_default_only", authorizationInherited: false });
  assert.equal(evaluateOwnerPrecedent(precedent, { ...precedent.context, accountScope: "other" }).applies, false);
  assert.equal(evaluateOwnerPrecedent(precedent, { ...precedent.context, riskClass: "high" }).applies, false);
  assert.equal(evaluateOwnerPrecedent(precedent, { ...precedent.context, costClass: "paid" }).applies, false);
});
