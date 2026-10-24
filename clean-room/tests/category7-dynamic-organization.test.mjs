import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LeadRegistry } from "../dist/agency/organization.js";

const migrationUrl = new URL("../../supabase/migrations/20261024162500_category7_dynamic_organization.sql", import.meta.url);

test("P7.13 durable organization formation is capability/authority/risk/workload/project-type driven", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_leads/);
  assert.match(sql, /command_center_agency_organizations/);
  assert.match(sql, /required_authority_scopes <@ lead\.authority_scopes/);
  assert.match(sql, /pp\.type_key=any\(lead\.project_type_keys\)/);
  assert.match(sql, /max_concurrent_assignments/);
  assert.match(sql, /order by workload asc,lead\.lead_key asc/);
  assert.match(sql, /No eligible lead for mission/);
});

test("P7.13 runtime lead registry chooses least-loaded eligible lead without hard-coded staff chart", () => {
  const registry = new LeadRegistry();
  registry.register({ key: "lead:a", capabilities: ["code"], projectTypeKeys: ["project-type:software"], authorityScopes: ["repo:branch"], maxConcurrentAssignments: 2, healthy: true });
  registry.register({ key: "lead:b", capabilities: ["code"], projectTypeKeys: ["project-type:software"], authorityScopes: ["repo:branch"], maxConcurrentAssignments: 2, healthy: true });
  assert.equal(registry.assemble({ capability: "code", projectTypeKey: "project-type:software", requiredAuthorityScopes: ["repo:branch"], workloadByLead: { "lead:a": 1, "lead:b": 0 } }).key, "lead:b");
  assert.throws(() => registry.assemble({ capability: "money", projectTypeKey: "project-type:software", requiredAuthorityScopes: ["money:write"], workloadByLead: {} }), /No eligible lead/);
});
