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
    if (table === "cc7_projects") return json([{ id: "edge-finder", name: "Edge Finder", category: "software", status: "Active", verification: "verified", stage: "build", next_action: "Run exact next work unit", blocker: null, attention: true, sort_order: 1, last_verified: "2026-10-23", source_status: "verified", updated_at: "2026-10-23T20:00:00Z" }]);
    if (table === "cc7_metrics") return json([{ project_id: "edge-finder", key: "current_scope_progress_percent", value_numeric: 42, value_text: null, unit: "%", verified: true, source: "test", updated_at: "2026-10-23T20:00:00Z" }]);
    if (table === "cc7_activity") return json([{ project_id: "edge-finder", headline: "Verified activity", detail: "Evidence", happened_at: "2026-10-23T20:00:00Z" }]);
    if (table === "cc7_agent_controls") return json([{ auto_enabled: false, current_run_id: null, runner_state: "ready", updated_at: "2026-10-23T20:00:00Z", project_auto_enabled: false, project_auto_project_id: null }]);
    if (table === "cc7_agent_runs") return json([]);
    if (table === "cc7_brain_items") return json([{ id: "brain-1", project_id: "edge-finder", kind: "fact", title: "Canonical fact", status: "active", importance: 5, trust_state: "verified", source_ref: "test", source_observed_at: "2026-10-23T20:00:00Z", updated_at: "2026-10-23T20:00:00Z" }]);
    if (table === "cc7_automations") return json([{ id: "automation-1", project_id: null, kind: "scheduled", name: "Daily", status: "active", next_run_at: null, last_run_at: null, run_count: 1, updated_at: "2026-10-23T20:00:00Z" }]);
    if (table === "cc7_notifications") return json([{ id: "notification-1", project_id: "edge-finder", title: "Needs attention", severity: "normal", status: "pending", created_at: "2026-10-23T20:00:00Z", delivered_at: null, read_at: null }]);
    if (table === "cc7_analytics_kpis") return json([{ id: "kpi-1", project_id: "edge-finder", metric_key: "verified", label: "Verified KPI", value_numeric: 1, value_text: null, unit: "count", currency: null, verified: true, source_count: 1, observed_at: "2026-10-23T20:00:00Z", updated_at: "2026-10-23T20:00:00Z" }]);
    if (table === "cc7_deployment_releases") return json([{ release_key: "release-1", environment: "production", provider: "vercel", source_commit: "known-good-sha", status: "verified", known_good: true, deployed_at: "2026-10-23T20:00:00Z", verified_at: "2026-10-23T20:00:00Z", created_at: "2026-10-23T20:00:00Z" }]);
    if (table === "source_checkpoints") return json([{ id: "checkpoint-1", project_id: "edge-finder", observed_at: "2026-10-23T20:00:00Z", summary: "Verified checkpoint", verified: true, created_at: "2026-10-23T20:00:00Z" }]);
    if (table === "book_owner_reviews" || table === "book_publication_states") return json([]);
    throw new Error(`Unexpected test request: ${url}`);
  };
  return { fetcher, calls };
}

test("owner runtime prompts for a real authenticated session and loads canonical Supabase state", async () => {
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
  assert.equal(snapshot.projects[0].id, "edge-finder");
  assert.equal(snapshot.projects[0].progressPercent.state, "known");
  assert.equal(snapshot.projects[0].progressPercent.value, 42);
  assert.equal(snapshot.projects[0].currentCheckpoint.state, "known");
  assert.equal(snapshot.release.releaseId.state, "known");
  assert.equal(snapshot.release.releaseId.value, "release-under-test");
  const needsMe = snapshot.surfaces.find((surface) => surface.key === "needs-me");
  const agency = snapshot.surfaces.find((surface) => surface.key === "agency");
  assert.equal(needsMe?.summary.state, "known");
  assert.match(needsMe.summary.value, /1 project/i);
  assert.equal(agency?.summary.state, "known");
  assert.match(agency.summary.value, /Runner ready/i);

  const restCalls = mock.calls.filter((call) => call.url.pathname.startsWith("/rest/v1/"));
  assert.ok(restCalls.length > 0);
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

test("production shell contains only publishable Supabase configuration and a dedicated owner-auth stylesheet", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /command-center-supabase-url/);
  assert.match(html, /command-center-supabase-publishable-key/);
  assert.match(html, /sb_publishable_/);
  assert.doesNotMatch(html, /service[_-]?role/i);
  assert.match(html, /owner-auth\.css/);
});
