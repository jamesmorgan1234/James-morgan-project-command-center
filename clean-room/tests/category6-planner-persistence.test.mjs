import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateBrainPlan } from "../dist/brain/planning.js";

const migrationUrl = new URL("../../supabase/migrations/20261024143500_category6_planner_decision_support.sql", import.meta.url);

test("P6.5 durable planner keeps truth classes, evidence/confidence and proposed actions separate from execution", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_plans/);
  assert.match(sql, /command_center_brain_plan_claims/);
  assert.match(sql, /command_center_brain_plan_actions/);
  for (const claimClass of ["verified_fact","owner_decision","assumption","estimate","recommendation"]) assert.match(sql, new RegExp(claimClass));
  assert.match(sql, /protected_action_request/);
  assert.match(sql, /Plan requires sources/);
  assert.doesNotMatch(sql, /command_center_security_consume_authorization/);
});

test("P6.5 planning validator rejects unsupported certainty and unbounded uncertainty", () => {
  assert.doesNotThrow(() => validateBrainPlan({
    id: "plan-1",
    objective: "Compare options",
    claims: [
      { id: "fact", class: "verified_fact", statement: "Build passed", evidenceRefs: ["run:1"] },
      { id: "owner", class: "owner_decision", statement: "Free-first", evidenceRefs: ["decision:free-first"] },
      { id: "estimate", class: "estimate", statement: "Option A is likely faster", evidenceRefs: [], confidence: 0.65 }
    ],
    proposedActions: ["research option A"],
    requiresOwnerDecision: false
  }));
  assert.throws(() => validateBrainPlan({ id: "bad", objective: "Bad", claims: [{ id: "x", class: "verified_fact", statement: "unsupported", evidenceRefs: [] }], proposedActions: [], requiresOwnerDecision: false }), /requires evidence/);
  assert.throws(() => validateBrainPlan({ id: "bad2", objective: "Bad", claims: [{ id: "x", class: "assumption", statement: "unknown", evidenceRefs: [] }], proposedActions: [], requiresOwnerDecision: false }), /requires confidence/);
});
