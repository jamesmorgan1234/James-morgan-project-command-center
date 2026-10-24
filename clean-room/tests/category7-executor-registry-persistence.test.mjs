import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { AgencyExecutorRegistry } from "../dist/agency/registry.js";

const migrationUrl = new URL("../../supabase/migrations/20261024153500_category7_executor_registry.sql", import.meta.url);

test("P7.2 durable executor registry is versioned, scoped and browser read-only", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_executors/);
  assert.match(sql, /command_center_agency_executor_versions/);
  assert.match(sql, /authority_class in \('read_only','propose','execute_reversible','execute_protected'\)/);
  assert.match(sql, /cost_class in \('free','paid','unknown'\)/);
  assert.match(sql, /verification_strategy in \('self_evidence','independent','external'\)/);
  assert.match(sql, /Executor version conflict/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_executors\s+to\s+authenticated/i);
});

test("P7.2 runtime registry remains capability/risk/free-first driven and replaceable", () => {
  const registry = new AgencyExecutorRegistry();
  registry.register({ key: "executor:normal", version: 1, enabled: true, environments: ["normal_chat"], capabilities: ["code"], projectTypeKeys: ["software"], permissionScopes: ["repo:branch"], costClass: "free", health: "available", verificationStrategy: "independent", maxRisk: "high" });
  registry.register({ key: "executor:paid", version: 1, enabled: true, environments: ["normal_chat"], capabilities: ["code"], projectTypeKeys: ["software"], permissionScopes: ["repo:branch"], costClass: "paid", health: "available", verificationStrategy: "independent", maxRisk: "high" });
  assert.deepEqual(registry.eligible({ capability: "code", projectTypeKey: "software", environment: "normal_chat", risk: "medium", allowPaid: false }).map((x) => x.key), ["executor:normal"]);
  registry.remove("executor:normal", 1);
  assert.equal(registry.eligible({ capability: "code", projectTypeKey: "software", environment: "normal_chat", risk: "medium", allowPaid: false }).length, 0);
});
