import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ProjectAgentStore } from "../dist/agency/project-agent.js";

const migrationUrl = new URL("../../supabase/migrations/20261024153000_category7_project_agent_state.sql", import.meta.url);

test("P7.1 durable Project Agent is server-authoritative, versioned, generation-fenced, and checkpoint scoped", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_agency_project_agents/);
  assert.match(sql, /command_center_agency_project_agent_versions/);
  assert.match(sql, /Project Agent stale version\/generation/);
  assert.match(sql, /Project Agent checkpoint scope mismatch/);
  assert.match(sql, /'server_authoritative',true/);
  assert.match(sql, /state_hash/);
  assert.match(sql, /for select to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_project_agents\s+to\s+authenticated/i);
});

test("P7.1 runtime Project Agent state survives worker replacement semantics", () => {
  const store = new ProjectAgentStore();
  store.create({ agentId: "project-agent:cc", projectId: "cc", projectType: "software", mission: "Build Command Center", state: "Ready", queueRefs: ["q1"], checkpointRefs: ["cp1"], contextVersion: 1, policyVersion: 1 });
  const claimed = store.claimWorker("cc", "worker-a");
  assert.equal(claimed.workerId, "worker-a");
  const released = store.releaseWorker("cc", "worker-a");
  assert.equal(released.workerId, undefined);
  assert.equal(store.get("cc").checkpointRefs[0], "cp1");
});
