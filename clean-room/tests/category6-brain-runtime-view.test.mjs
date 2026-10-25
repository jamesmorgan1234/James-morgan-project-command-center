import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { ManagedOwnerRuntimeProvider, isBrainConversationRuntimeProvider } from "../dist/runtime/owner-security-provider.js";
import { createFixtureRuntimeSnapshot } from "../dist/runtime/snapshot.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

function storageWithSession() {
  const values = new Map([["command-center:owner-session:v1", JSON.stringify({ accessToken: "owner-token", refreshToken: "refresh-token", expiresAt: 9999999999, userId: "owner-1" })]]);
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
}

test("P6.7/P6.8 managed owner runtime reads canonical Brain conversations and project workspaces", async () => {
  const storage = storageWithSession();
  const calls = [];
  const fetcher = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    calls.push({ url: url.toString(), method: init.method ?? "GET" });
    if (url.pathname.endsWith("/command_center_brain_conversations")) return response([{ conversation_id: "conv-1", project_id: "project-1", title: "Project Brain", state: "active", created_at: "2026-10-25T10:00:00Z", updated_at: "2026-10-25T10:02:00Z" }]);
    if (url.pathname.endsWith("/command_center_brain_conversation_turns")) return response([
      { turn_id: "turn-1", conversation_id: "conv-1", project_id: "project-1", role: "owner", intent: "question", protected_action_possible: false, redaction_state: "safe_text", safe_text: "What is next?", content_ref: "content:1", content_hash: "a".repeat(64), evidence_refs: ["evidence:1"], created_at: "2026-10-25T10:01:00Z", recorded_at: "2026-10-25T10:01:01Z" },
      { turn_id: "turn-2", conversation_id: "conv-1", project_id: "project-1", role: "system", intent: null, protected_action_possible: false, redaction_state: "reference_only", safe_text: null, content_ref: "content:2", content_hash: "b".repeat(64), evidence_refs: [], created_at: "2026-10-25T10:01:30Z", recorded_at: "2026-10-25T10:01:31Z" }
    ]);
    if (url.pathname.endsWith("/command_center_brain_project_workspaces")) return response([{ project_id: "project-1", version: 3, spec_version: 7, conversation_id: "conv-1", turn_ids: ["turn-1", "turn-2"], decision_refs: ["decision:1"], execution_run_id: null, blocker_refs: [], evidence_refs: ["workspace:evidence"], verified_result_refs: [], updated_at: "2026-10-25T10:02:00Z", recorded_at: "2026-10-25T10:02:01Z" }]);
    throw new Error(`Unexpected URL ${url}`);
  };
  const inner = {
    id: "runtime:test",
    async signIn() {},
    async signOut() {},
    async load() { return createFixtureRuntimeSnapshot(); }
  };
  const provider = new ManagedOwnerRuntimeProvider({ inner, storage, supabaseUrl: "https://example.supabase.co", publishableKey: "sb_publishable_test", fetcher });
  assert.equal(isBrainConversationRuntimeProvider(provider), true);
  const snapshot = await provider.load();
  assert.equal(snapshot.brain?.availability, "available");
  assert.equal(snapshot.brain?.conversations.length, 1);
  assert.equal(snapshot.brain?.conversations[0].turns.length, 2);
  assert.deepEqual(snapshot.brain?.conversations[0].turns[0].content, { state: "known", value: "What is next?" });
  assert.equal(snapshot.brain?.conversations[0].turns[1].content.state, "unknown");
  assert.equal(snapshot.brain?.workspaces[0].version, 3);
  assert.equal(snapshot.surfaces.find((surface) => surface.key === "brain")?.summary.state, "known");
  assert.equal(calls.filter((call) => call.method === "GET").length, 3);
});

test("P6.7 protected-looking owner input is persisted as a request only and never acquires execution authority", async () => {
  const storage = storageWithSession();
  const requests = [];
  let workspace = null;
  const fetcher = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    requests.push({ url: url.toString(), method, body });
    if (method === "POST" && url.pathname.endsWith("/rpc/command_center_brain_create_conversation")) return response("conv-new");
    if (method === "POST" && url.pathname.endsWith("/rpc/command_center_brain_record_turn")) return response("turn-new");
    if (method === "POST" && url.pathname.endsWith("/rpc/command_center_brain_save_project_workspace")) {
      workspace = { project_id: body.p_project_id, version: (body.p_expected_version ?? 0) + 1, spec_version: body.p_spec_version, conversation_id: body.p_conversation_id, turn_ids: body.p_turn_ids, decision_refs: body.p_decision_refs, execution_run_id: body.p_execution_run_id, blocker_refs: body.p_blocker_refs, evidence_refs: body.p_evidence_refs, verified_result_refs: body.p_verified_result_refs, updated_at: body.p_updated_at };
      return response({ project_id: body.p_project_id, version: workspace.version, spec_version: body.p_spec_version, resumable: true });
    }
    if (method === "GET" && url.pathname.endsWith("/command_center_brain_project_workspaces")) return response(workspace ? [workspace] : []);
    if (method === "GET" && url.pathname.endsWith("/command_center_brain_conversations")) return response([{ conversation_id: "conv-new", project_id: "project-1" }]);
    throw new Error(`Unexpected URL ${url}`);
  };
  const inner = { id: "runtime:test", async signIn() {}, async signOut() {}, async load() { return createFixtureRuntimeSnapshot(); } };
  const provider = new ManagedOwnerRuntimeProvider({ inner, storage, supabaseUrl: "https://example.supabase.co", publishableKey: "sb_publishable_test", fetcher });
  const conversationId = await provider.createBrainConversation("project-1", "Project Brain");
  assert.equal(conversationId, "conv-new");
  const result = await provider.recordBrainOwnerTurn(conversationId, "Deploy this build to production");
  assert.equal(result.classification.intent, "protected_action_request");
  assert.equal(result.classification.protectedActionPossible, true);
  const turnRpc = requests.find((request) => request.url.includes("command_center_brain_record_turn"));
  assert.equal(turnRpc.body.p_protected_action_possible, true);
  assert.equal(turnRpc.body.p_intent, "protected_action_request");
  assert.equal(turnRpc.body.p_role, "owner");
  assert.equal(turnRpc.body.p_redaction_state, "safe_text");
  assert.match(turnRpc.body.p_content_hash, /^[a-f0-9]{64}$/);
  assert.equal("canonical_writes_authorized" in turnRpc.body, false);
  assert.equal(requests.some((request) => request.url.includes("security_authorize_action") || request.url.includes("deploy")), false);
  assert.deepEqual(workspace.turn_ids, ["turn-new"]);
});

test("P6.7 shipped Brain route uses the dedicated canonical view instead of generic surface rendering", async () => {
  const browser = await source("src/runtime/browser.ts");
  const view = await source("src/runtime/brain-view.ts");
  const css = await source("public/primitive-system.css");
  assert.match(browser, /import \{ renderBrainView \} from "\.\/brain-view\.js"/);
  assert.match(browser, /function renderBrain\([^)]*\): HTMLElement \{ return renderBrainView\(snapshot, activeProvider, \(\) => renderApplication\(\)\); \}/);
  assert.doesNotMatch(browser, /renderBrain\([^)]*\)[^{]*\{ return renderCanonicalSurface\(snapshot, "brain"/);
  assert.match(view, /project context/i);
  assert.match(view, /isBrainConversationRuntimeProvider/);
  assert.match(view, /Protected-action intent recorded only/);
  assert.match(view, /no local substitute record/i);
  assert.doesNotMatch(view, /localStorage|sessionStorage/);
  assert.match(css, /\.brain-layout/);
  assert.match(css, /\.brain-composer__input/);
  assert.match(css, /@media\(max-width:720px\)[^{]*\{\.brain-layout\{grid-template-columns:1fr\}/s);
});
