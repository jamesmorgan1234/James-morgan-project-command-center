import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { SupabaseOwnerRuntimeSnapshotProvider } from "../dist/runtime/supabase-owner-provider.js";

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function ownerRuntimeFetch({ authorized = true } = {}) {
  const calls = [];
  const fetcher = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
      return json({ access_token: "owner-access-token", refresh_token: "owner-refresh-token", expires_at: 4102444800, user: { id: "owner-1" } });
    }
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      return json({ access_token: "owner-access-token-2", refresh_token: "owner-refresh-token-2", expires_at: 4102444800, user: { id: "owner-1" } });
    }
    if (url.pathname === "/auth/v1/logout") return json({});
    const table = url.pathname.split("/").at(-1);
    if (table === "cc7_owner_access") return json(authorized ? [{ enabled: true }] : []);
    if (table === "command_center_project_profiles") return json([{
      project_id: "project-1", type_key: "project-type:software", company_id: "company-1", name: "Project One", mission: "Build the verified project system",
      lifecycle: "active", status: "building", verification: "verified", priority: "high", version: 1, updated_at: "2026-10-24T20:00:00Z"
    }]);
    if (table === "command_center_project_roadmaps") return json([{
      project_id: "project-1", version: 1, state: "current", structure_verified: true, denominator_trusted: true,
      denominator_evidence_refs: ["roadmap:complete"], source_ref: "roadmap:test", created_at: "2026-10-24T19:00:00Z"
    }]);
    if (table === "command_center_project_work_units") return json([
      { project_id: "project-1", roadmap_version: 1, work_unit_id: "w1", category_id: "c1", phase_id: "p1", title: "Foundation", status: "verified", applicable: true, dependency_ids: [], gate_ids: [], acceptance_criteria: ["done"], evidence_refs: ["test:w1"], updated_at: "2026-10-24T19:10:00Z" },
      { project_id: "project-1", roadmap_version: 1, work_unit_id: "w2", category_id: "c1", phase_id: "p2", title: "Exact next work unit", status: "planned", applicable: true, dependency_ids: ["w1"], gate_ids: ["gate:owner"], acceptance_criteria: ["done"], evidence_refs: [], updated_at: "2026-10-24T19:20:00Z" }
    ]);
    if (table === "command_center_project_roadmap_gates") return json([{ project_id: "project-1", roadmap_version: 1, gate_id: "gate:owner", satisfied: true, evidence_refs: ["owner:approved"], updated_at: "2026-10-24T19:15:00Z" }]);
    if (table === "command_center_project_checkpoints") return json([{ checkpoint_id: "checkpoint-1", project_id: "project-1", roadmap_version: 1, exact_next_work_unit_id: "w2", blocker: null, required_environment: "any_device", owner_action: "Review exact next work", verification_method: "tests", evidence_refs: ["test:checkpoint"], resume_state_hash: "a".repeat(64), created_at: "2026-10-24T19:30:00Z" }]);
    if (table === "command_center_project_detail_sections") return json([
      { section_key: "project-section:performance", title: "Performance", sort_order: 10, capability_key: null, active: true, updated_at: "2026-10-24T19:35:00Z" },
      { section_key: "project-section:software-delivery", title: "Software Delivery", sort_order: 90, capability_key: "capability:software-delivery", active: true, updated_at: "2026-10-24T19:36:00Z" }
    ]);
    if (table === "command_center_project_type_detail_sections") return json([
      { type_key: "project-type:software", section_key: "project-section:software-delivery", required: true, source_ref: "type-binding:test", created_at: "2026-10-24T19:37:00Z" }
    ]);
    if (table === "cc7_activity") return json([{ project_id: "project-1", headline: "Verified activity", detail: "Evidence", happened_at: "2026-10-24T19:40:00Z" }]);
    if (table === "command_center_agency_runs") return json([{
      project_id: "project-1", run_id: "agency-run:test", objective: "Execute verified work", control_mode: "project_auto", state: "working", generation: 2,
      authorization_ref: "owner:authorized", priority: 10, stop_requested: false, pause_requested: false, blocker: null, checkpoint_id: "checkpoint-1",
      evidence_refs: ["test:run"], created_at: "2026-10-24T19:45:00Z", updated_at: "2026-10-24T20:00:00Z", completed_at: null
    }]);
    if (table === "command_center_agency_jobs") return json([{
      project_id: "project-1", run_id: "agency-run:test", job_id: "agency-job:test", objective: "Implement", state: "working", risk: "medium", cost_class: "free",
      preferred_environment: "normal_chat", capability: "code", retry_count: 0, blocker: null, checkpoint_ref: "checkpoint-1", evidence_refs: ["test:job"],
      created_at: "2026-10-24T19:46:00Z", updated_at: "2026-10-24T20:00:00Z"
    }]);
    if (table === "command_center_agency_tasks") return json([{
      project_id: "project-1", run_id: "agency-run:test", job_id: "agency-job:test", task_id: "agency-task:test", title: "Wire canonical Agency view", state: "working",
      dependency_ids: [], capability: "code", risk: "medium", cost_class: "free", preferred_environment: "normal_chat", retry_count: 0, idempotency_key: "agency-task:test:v1",
      blocker: null, checkpoint_ref: "checkpoint-1", evidence_refs: ["test:task"], verification_refs: [], created_at: "2026-10-24T19:47:00Z", updated_at: "2026-10-24T20:00:00Z"
    }]);
    if (table === "cc7_brain_items") return json([{ id: "brain-1", project_id: "project-1", kind: "fact", title: "Canonical fact", status: "active", importance: 5, trust_state: "verified", source_ref: "test", source_observed_at: "2026-10-24T20:00:00Z", updated_at: "2026-10-24T20:00:00Z" }]);
    if (table === "cc7_automations") return json([{ id: "automation-1", project_id: null, kind: "scheduled", name: "Daily", status: "active", next_run_at: null, last_run_at: null, run_count: 1, updated_at: "2026-10-24T20:00:00Z" }]);
    if (table === "cc7_notifications") return json([{ id: "notification-1", project_id: "project-1", title: "Needs attention", severity: "normal", status: "pending", created_at: "2026-10-24T20:00:00Z", delivered_at: null, read_at: null }]);
    if (table === "cc7_analytics_kpis") return json([{ id: "kpi-1", project_id: "project-1", metric_key: "verified", label: "Verified KPI", value_numeric: 1, value_text: null, unit: "count", currency: null, verified: true, source_count: 1, observed_at: "2026-10-24T20:00:00Z", updated_at: "2026-10-24T20:00:00Z" }]);
    if (table === "cc7_deployment_releases") return json([{ release_key: "release-1", environment: "production", provider: "vercel", source_commit: "known-good-sha", status: "verified", known_good: true, deployed_at: "2026-10-24T20:00:00Z", verified_at: "2026-10-24T20:00:00Z", created_at: "2026-10-24T20:00:00Z" }]);
    if (table === "book_owner_reviews" || table === "book_publication_states") return json([]);
    throw new Error(`Unexpected test request: ${url}`);
  };
  return { fetcher, calls };
}

test("owner runtime prompts for a real authenticated session and loads canonical P5 project state plus durable P7 Agency truth", async () => {
  const storage = new MemoryStorage();
  const mock = ownerRuntimeFetch();
  let prompts = 0;
  let authenticatedCallbacks = 0;
  const provider = new SupabaseOwnerRuntimeSnapshotProvider({
    supabaseUrl: "https://example.supabase.co",
    publishableKey: "sb_publishable_public-test-key",
    releaseId: "release-under-test",
    storage,
    fetcher: mock.fetcher,
    promptForCredentials: async (submit) => { prompts += 1; await submit("owner@example.com", "test-password"); },
    onAuthenticated: () => { authenticatedCallbacks += 1; }
  });

  const snapshot = await provider.load();
  assert.equal(prompts, 1);
  assert.equal(authenticatedCallbacks, 1);
  assert.equal(snapshot.connection.state, "connected");
  assert.equal(snapshot.projects.length, 1);
  assert.equal(snapshot.projects[0].id, "project-1");
  assert.equal(snapshot.projects[0].mission.state, "known");
  assert.equal(snapshot.projects[0].typeKey.state, "known");
  assert.equal(snapshot.projects[0].companyId.state, "known");
  assert.equal(snapshot.projects[0].progressPercent.state, "known");
  assert.equal(snapshot.projects[0].progressPercent.value, 50);
  assert.equal(snapshot.projects[0].currentCheckpoint.state, "known");
  assert.equal(snapshot.projects[0].nextWorkReadiness.state, "known");
  assert.equal(snapshot.projects[0].nextWorkReadiness.value.workUnitId, "w2");
  assert.equal(snapshot.projects[0].liveExecution.state, "unknown");
  assert.equal(snapshot.projects[0].detailSections.length, 1);
  assert.equal(snapshot.projects[0].detailSections[0].key, "project-section:software-delivery");
  assert.equal(snapshot.projects[0].detailSections[0].required, true);
  assert.equal(snapshot.projects[0].detailSections[0].content.state, "unknown");
  assert.equal(snapshot.release.releaseId.state, "known");
  assert.equal(snapshot.release.releaseId.value, "release-under-test");
  assert.equal(snapshot.agency?.availability, "available");
  assert.equal(snapshot.agency?.runs.length, 1);
  assert.equal(snapshot.agency?.runs[0].runId, "agency-run:test");
  assert.equal(snapshot.agency?.jobs.length, 1);
  assert.equal(snapshot.agency?.tasks.length, 1);
  assert.equal(snapshot.agency?.tasks[0].preferredEnvironment, "normal_chat");
  const needsMe = snapshot.surfaces.find((surface) => surface.key === "needs-me");
  const agency = snapshot.surfaces.find((surface) => surface.key === "agency");
  assert.equal(needsMe?.summary.state, "known");
  assert.match(needsMe.summary.value, /1 project/i);
  assert.equal(agency?.summary.state, "known");
  assert.match(agency.summary.value, /1 nonterminal durable run/i);
  assert.match(agency.summary.value, /1 working task/i);

  const restCalls = mock.calls.filter((call) => call.url.pathname.startsWith("/rest/v1/"));
  assert.ok(restCalls.length > 0);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/cc7_projects")), false);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/cc7_agent_controls")), false);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/cc7_agent_runs")), false);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/command_center_project_profiles")), true);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/command_center_project_detail_sections")), true);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/command_center_project_type_detail_sections")), true);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/command_center_agency_runs")), true);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/command_center_agency_jobs")), true);
  assert.equal(restCalls.some((call) => call.url.pathname.endsWith("/command_center_agency_tasks")), true);
  for (const call of restCalls) {
    const headers = new Headers(call.init.headers);
    assert.equal(headers.get("apikey"), "sb_publishable_public-test-key");
    assert.equal(headers.get("authorization"), "Bearer owner-access-token");
    assert.equal(call.url.searchParams.get("owner_id"), "eq.owner-1");
  }
});

test("owner runtime refuses a signed-in account without enabled owner access", async () => {
  const storage = new MemoryStorage();
  const mock = ownerRuntimeFetch({ authorized: false });
  const provider = new SupabaseOwnerRuntimeSnapshotProvider({
    supabaseUrl: "https://example.supabase.co",
    publishableKey: "sb_publishable_public-test-key",
    storage,
    fetcher: mock.fetcher
  });
  await assert.rejects(() => provider.signIn("owner@example.com", "test-password"), /not authorized/i);
  const snapshot = await provider.load();
  assert.equal(snapshot.connection.state, "disconnected");
  assert.match(snapshot.connection.message, /sign-in is required/i);
  assert.equal(snapshot.projects.length, 0);
});

test("production shell contains only publishable Supabase configuration, a dedicated owner-auth stylesheet, and a dedicated Agency renderer", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const browser = await readFile(new URL("../src/runtime/browser.ts", import.meta.url), "utf8");
  const agencyView = await readFile(new URL("../src/runtime/agency-view.ts", import.meta.url), "utf8");
  assert.match(html, /command-center-supabase-url/);
  assert.match(html, /command-center-supabase-publishable-key/);
  assert.match(html, /sb_publishable_/);
  assert.doesNotMatch(html, /service[_-]?role/i);
  assert.match(html, /owner-auth\.css/);
  assert.match(browser, /import \{ renderAgencyView \} from "\.\/agency-view\.js"/);
  assert.match(browser, /function renderAgency\(snapshot: CommandCenterRuntimeSnapshot\): HTMLElement \{ return renderAgencyView\(snapshot\); \}/);
  assert.doesNotMatch(browser, /function renderAgency\([^\n]+renderCanonicalSurface/);
  assert.match(agencyView, /DURABLE EXECUTION TRUTH/);
  assert.match(agencyView, /Partial or legacy execution state is not substituted/);
  assert.match(agencyView, /does not authorize protected actions/);
  assert.match(agencyView, /claimed executor and fresh verified heartbeat/);
});
