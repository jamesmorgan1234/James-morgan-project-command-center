import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertCoreTruthSurvivesAiOutage } from "../dist/brain/local.js";

const migrationUrl = new URL("../../supabase/migrations/20261024152000_category6_ai_outage_graceful_operation.sql", import.meta.url);

test("P6.14 durable outage check requires deterministic core truth/control without external AI", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_capability_availability/);
  assert.match(sql, /command_center_brain_ai_outage_checks/);
  for (const key of ["project.read","checkpoint.read","decision.read","rule.read","needs-me.read"]) assert.match(sql, new RegExp(key.replace(".", "\\.")));
  assert.match(sql, /core_truth_operable=\(cardinality\(unavailable_core_keys\)=0\)/);
  assert.match(sql, /for select to authenticated/);
});

test("P6.14 runtime survives AI outage only when every required deterministic capability remains available", () => {
  assert.doesNotThrow(() => assertCoreTruthSurvivesAiOutage([
    { key: "project.read", requiresAi: false, availableOffline: true },
    { key: "checkpoint.read", requiresAi: false, availableOffline: true },
    { key: "decision.read", requiresAi: false, availableOffline: true },
    { key: "rule.read", requiresAi: false, availableOffline: true },
    { key: "needs-me.read", requiresAi: false, availableOffline: true },
    { key: "brain.reason", requiresAi: true, availableOffline: false }
  ]));
  assert.throws(() => assertCoreTruthSurvivesAiOutage([
    { key: "project.read", requiresAi: false, availableOffline: true },
    { key: "checkpoint.read", requiresAi: false, availableOffline: true }
  ]), /Core deterministic capability missing/);
});
