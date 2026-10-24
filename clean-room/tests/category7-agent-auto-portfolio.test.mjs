import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertAgentAutoProjectEligible } from "../dist/agency/modes.js";

const migrationUrl = new URL("../../supabase/migrations/20261024161000_category7_agent_auto_portfolio.sql", import.meta.url);

test("P7.10 durable Agent Auto uses stored priority, explicit authorization, concurrency limits and Books exclusion", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_agent_auto_cycles/);
  assert.match(sql, /command_center_agency_agent_auto_decisions/);
  assert.match(sql, /pp\.priority/);
  assert.match(sql, /authorization_key='project-auth:agent-auto'/);
  assert.match(sql, /books_portfolio_auto_excluded/);
  assert.match(sql, /portfolio_concurrency_limit/);
  assert.match(sql, /project_already_locked/);
  assert.match(sql, /not \(eligible and project_type_key like 'project-type:book%'\)/);
  assert.doesNotMatch(sql, /random\(|order by random/i);
});

test("P7.10 runtime eligibility rejects excluded projects and Books", () => {
  assert.doesNotThrow(() => assertAgentAutoProjectEligible({ agentAccessEnabled: true, portfolioAutoEnabled: true, projectTypeKey: "project-type:software" }));
  assert.throws(() => assertAgentAutoProjectEligible({ agentAccessEnabled: false, portfolioAutoEnabled: true, projectTypeKey: "project-type:software" }), /excluded/);
  assert.throws(() => assertAgentAutoProjectEligible({ agentAccessEnabled: true, portfolioAutoEnabled: true, projectTypeKey: "project-type:book-fiction" }), /Books are portfolio-auto excluded/);
});
