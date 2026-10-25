// ISOLATED CONTRACT VERTICAL PROOF — NOT REAL BACKEND EXECUTION.
// Runtime/API/policy/worker/evidence behavior below is executed by the test runner.
// SQL is read and contract-verified only because this clean-room CI has no Postgres/Supabase runner.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ownerSessionHandler from "../api/owner-session.mjs";
import {
  OperationJournal,
  assertCompletionEvidence,
  createCheckpoint
} from "../dist/kernel/index.js";
import {
  AuthSessionStore,
  PolicyEngine,
  ProtectedActionGate,
  createIntentBinding
} from "../dist/security/index.js";
import {
  TaskClaimStore,
  recoverExpiredAssignment
} from "../dist/agency/index.js";

const PROOF_LEVEL = "isolated_contract_not_real_backend";
const NOW = "2026-10-25T01:40:00Z";
const SCOPE = Object.freeze({ ownerId: "owner-1", companyId: "company-101", projectId: "project-101", accountId: "acct-1", environment: "staging" });
const ORIGIN = "https://command-center-preview-alpha.vercel.app";
const HOST = "command-center-preview-alpha.vercel.app";
const PROJECT_REF = "test-command-center";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SUPABASE_KEY = "sb_publishable_test_key";

function session(overrides = {}) {
  return {
    id: "session:vertical",
    ownerId: SCOPE.ownerId,
    companyId: SCOPE.companyId,
    projectId: SCOPE.projectId,
    accountId: SCOPE.accountId,
    environment: SCOPE.environment,
    scopes: ["security:protected"],
    assurance: "fresh_passkey_uv",
    state: "active",
    createdAt: "2026-10-25T01:00:00Z",
    expiresAt: "2026-10-25T02:00:00Z",
    lastValidatedAt: "2026-10-25T01:00:00Z",
    lastVerifiedAt: "2026-10-25T01:39:30Z",
    policyEpoch: 7,
    ...overrides
  };
}

function protectedHarness(sessionOverrides = {}) {
  const sessions = new AuthSessionStore();
  sessions.register(session(sessionOverrides));
  const policy = new PolicyEngine();
  policy.register({
    action: "company.protected",
    version: 1,
    enabled: true,
    riskClass: "high",
    requiredScopes: ["security:protected"],
    minimumAssurance: "fresh_passkey_uv",
    freshVerificationMaxAgeMs: 60_000,
    ownerOnly: true,
    allowProjectWildcard: false,
    policyEpoch: 7
  });
  return { sessions, policy, gate: new ProtectedActionGate(sessions, policy) };
}

function intent(overrides = {}) {
  return {
    action: "company.protected",
    ownerId: SCOPE.ownerId,
    scope: SCOPE,
    targetResourceId: "resource:vertical-proof",
    parameters: { operation: "verify_vertical_path", amount: 0 },
    maximumCostCents: 0,
    ...overrides
  };
}

function authorize(gate, protectedIntent, binding, overrides = {}) {
  return gate.authorize({
    sessionId: "session:vertical",
    action: "company.protected",
    resourceOwnerId: SCOPE.ownerId,
    resourceCompanyId: SCOPE.companyId,
    resourceProjectId: SCOPE.projectId,
    resourceAccountId: SCOPE.accountId,
    resourceEnvironment: SCOPE.environment,
    expectedPolicyEpoch: 7,
    policyAvailable: true,
    revocationStateFresh: true,
    intent: protectedIntent,
    authorizationIntentBinding: binding,
    now: NOW,
    ...overrides
  });
}

function request(body, extraHeaders = {}) {
  return {
    method: "POST",
    headers: { origin: ORIGIN, host: HOST, "sec-fetch-site": "same-origin", ...extraHeaders },
    body
  };
}

function response() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; this.ended = true; return this; },
    end() { this.ended = true; return this; }
  };
}

function withServerIdentityConfig() {
  const prior = {
    environment: process.env.CC_ENVIRONMENT,
    url: process.env.CC_SUPABASE_URL,
    ref: process.env.CC_SUPABASE_PROJECT_REF,
    key: process.env.CC_SUPABASE_PUBLISHABLE_KEY
  };
  process.env.CC_ENVIRONMENT = "test";
  process.env.CC_SUPABASE_URL = SUPABASE_URL;
  process.env.CC_SUPABASE_PROJECT_REF = PROJECT_REF;
  process.env.CC_SUPABASE_PUBLISHABLE_KEY = SUPABASE_KEY;
  return () => {
    for (const [name, value] of [["CC_ENVIRONMENT", prior.environment], ["CC_SUPABASE_URL", prior.url], ["CC_SUPABASE_PROJECT_REF", prior.ref], ["CC_SUPABASE_PUBLISHABLE_KEY", prior.key]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  };
}

test("proof level is explicitly isolated-contract and never claims real backend execution", () => {
  assert.equal(PROOF_LEVEL, "isolated_contract_not_real_backend");
});

test("browser/API owner-session boundary uses server backend identity, host-only refresh cookie, and denies cross-origin callers", async () => {
  const originalFetch = globalThis.fetch;
  const restoreConfig = withServerIdentityConfig();
  const upstream = [];
  globalThis.fetch = async (url, init) => {
    upstream.push({ url: String(url), init, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ access_token: "access-vertical", refresh_token: "refresh-vertical", expires_in: 3600, user: { id: "owner-1", email: "owner@example.com" } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const res = response();
    await ownerSessionHandler(request({ action: "establish", refreshToken: "initial-refresh" }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(upstream.length, 1);
    assert.match(upstream[0].url, new RegExp(`^${SUPABASE_URL.replaceAll(".", "\\.")}\\/auth\\/v1\\/token\\?grant_type=refresh_token$`));
    assert.deepEqual(upstream[0].body, { refresh_token: "initial-refresh" });
    assert.equal(upstream[0].init.headers.apikey, SUPABASE_KEY);
    assert.equal(res.body.access_token, "access-vertical");
    assert.equal("refresh_token" in res.body, false);
    const cookie = String(res.getHeader("set-cookie"));
    assert.match(cookie, /^__Host-cc-owner-refresh=refresh-vertical;/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Strict/);

    upstream.length = 0;
    const denied = response();
    await ownerSessionHandler(request({ action: "refresh" }, { origin: "https://attacker.example", "sec-fetch-site": "cross-site" }), denied);
    assert.equal(denied.statusCode, 403);
    assert.deepEqual(denied.body, { error: "same_origin_required" });
    assert.equal(upstream.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    restoreConfig();
  }
});

test("authorized protected action crosses live session, immutable intent, central policy, operation, worker fencing, and evidence closure", () => {
  const { gate } = protectedHarness();
  const protectedIntent = intent();
  const binding = createIntentBinding(protectedIntent);
  assert.equal(authorize(gate, protectedIntent, binding).allowed, true);

  const operations = new OperationJournal();
  const operation = operations.prepare({
    id: "operation:vertical-1",
    idempotencyKey: "vertical-proof-1",
    intentBinding: binding,
    scope: SCOPE,
    state: "prepared",
    policyVersion: 7,
    createdAt: NOW,
    updatedAt: NOW
  });
  assert.equal(operation.state, "prepared");

  const claims = new TaskClaimStore();
  const claim = claims.claim("task:vertical-1", "worker:one", NOW, "2026-10-25T01:45:00Z");
  operations.transition(operation.id, "dispatched", "2026-10-25T01:40:10Z");
  assert.doesNotThrow(() => claims.assertCommitAllowed("task:vertical-1", "worker:one", claim.fencingToken, "2026-10-25T01:41:00Z"));
  operations.transition(operation.id, "succeeded", "2026-10-25T01:41:05Z", { providerReceiptRef: "receipt:vertical-1" });

  const evidence = [{ id: "evidence:vertical-1", subjectId: operation.id, strength: "tool_result", sourceRef: "vertical-proof", recordedAt: "2026-10-25T01:41:06Z", verified: true }];
  assert.doesNotThrow(() => assertCompletionEvidence(evidence, operation.id, "tool_result"));
  const checkpoint = createCheckpoint({ id: "checkpoint:vertical-1", subjectId: operation.id, summary: "Authorized isolated vertical path verified", exactNextAction: "reconcile-post-audit-controls", evidenceIds: [evidence[0].id], createdAt: "2026-10-25T01:41:07Z" });
  assert.equal(checkpoint.exactNextAction, "reconcile-post-audit-controls");
});

test("protected path fails closed for cross-company scope, stale session, unavailable policy, stale revocation truth, and mutated intent", () => {
  const { gate } = protectedHarness();
  const protectedIntent = intent();
  const binding = createIntentBinding(protectedIntent);

  assert.throws(() => authorize(gate, protectedIntent, binding, { resourceCompanyId: "company-102" }));
  assert.throws(() => authorize(gate, protectedIntent, binding, { policyAvailable: false }));
  assert.throws(() => authorize(gate, protectedIntent, binding, { revocationStateFresh: false }));
  assert.throws(() => authorize(gate, { ...protectedIntent, parameters: { operation: "verify_vertical_path", amount: 1 } }, binding));

  const stale = protectedHarness({ id: "session:vertical", expiresAt: "2026-10-25T01:30:00Z" });
  assert.throws(() => authorize(stale.gate, protectedIntent, binding));
  assert.equal(stale.sessions.get("session:vertical").state, "expired");
});

test("duplicate request and lost provider response cannot create blind duplicate side effects", () => {
  const journal = new OperationJournal();
  const base = { id: "operation:lost-1", idempotencyKey: "idem:lost-1", intentBinding: "binding:lost-1", scope: SCOPE, state: "prepared", policyVersion: 7, createdAt: NOW, updatedAt: NOW };
  assert.equal(journal.prepare(base).id, "operation:lost-1");
  assert.equal(journal.prepare({ ...base, id: "operation:lost-duplicate" }).id, "operation:lost-1");
  journal.transition("operation:lost-1", "dispatched", "2026-10-25T01:40:10Z");
  journal.transition("operation:lost-1", "unknown", "2026-10-25T01:40:20Z", { errorCode: "provider_response_lost" });
  assert.throws(() => journal.assertRetrySafe("operation:lost-1"), /reconciled before retry/);
  journal.transition("operation:lost-1", "reconciled", "2026-10-25T01:40:30Z", { providerReceiptRef: "receipt:reconciled-1" });
  assert.throws(() => journal.assertRetrySafe("operation:lost-1"), /must not be repeated/);
});

test("expired worker is fenced out and recovery advances worker generation only with checkpoint and evidence", () => {
  const claims = new TaskClaimStore();
  const first = claims.claim("task:recover-1", "worker:old", "2026-10-25T01:00:00Z", "2026-10-25T01:10:00Z");
  assert.throws(() => claims.assertCommitAllowed("task:recover-1", "worker:old", first.fencingToken, "2026-10-25T01:10:01Z"), /Expired task claim/);

  const recovered = recoverExpiredAssignment({
    taskId: "task:recover-1",
    workerId: "worker:old",
    generation: 1,
    fencingToken: first.fencingToken,
    claimedAt: "2026-10-25T01:00:00Z",
    expiresAt: "2026-10-25T01:10:00Z",
    checkpointRef: "checkpoint:recover-1",
    evidenceRefs: ["evidence:recover-1"]
  }, "worker:new", "2026-10-25T01:10:01Z");
  assert.equal(recovered.generation, 2);
  assert.equal(recovered.fencingToken, first.fencingToken + 1);
  assert.equal(recovered.contextRevalidationRequired, true);

  const replacement = claims.claim("task:recover-1", "worker:new", "2026-10-25T01:10:01Z", "2026-10-25T01:20:00Z");
  assert.ok(replacement.fencingToken > first.fencingToken);
  assert.throws(() => claims.assertCommitAllowed("task:recover-1", "worker:old", first.fencingToken, "2026-10-25T01:11:00Z"), /Stale worker fencing token/);
  assert.doesNotThrow(() => claims.assertCommitAllowed("task:recover-1", "worker:new", replacement.fencingToken, "2026-10-25T01:11:00Z"));

  assert.throws(() => recoverExpiredAssignment({
    taskId: "task:recover-bad",
    workerId: "worker:old",
    generation: 1,
    fencingToken: 1,
    claimedAt: "2026-10-25T01:00:00Z",
    expiresAt: "2026-10-25T01:10:00Z",
    evidenceRefs: ["evidence:recover-1"]
  }, "worker:new", "2026-10-25T01:10:01Z"), /checkpoint/);
});

test("SQL layer is contract-verified only; no backend execution is claimed", async () => {
  const [policySql, resourceSql, recoverySql, sourceSql, agencySql] = await Promise.all([
    readFile(new URL("../../supabase/migrations/20261024103000_category2_policy_single_use_authorizations.sql", import.meta.url), "utf8"),
    readFile(new URL("../../supabase/migrations/20261024155000_category7_resource_claims.sql", import.meta.url), "utf8"),
    readFile(new URL("../../supabase/migrations/20261024171500_category7_recovery_failover.sql", import.meta.url), "utf8"),
    readFile(new URL("../../supabase/migrations/20261025011500_category3_source_provenance_refresh_retrofit.sql", import.meta.url), "utf8"),
    readFile(new URL("../../supabase/migrations/20261025013000_category7_distributed_work_hardening.sql", import.meta.url), "utf8")
  ]);

  assert.equal(PROOF_LEVEL, "isolated_contract_not_real_backend");
  assert.match(policySql, /security_action_policy/);
  assert.match(policySql, /Source session is not live/);
  assert.match(policySql, /consume_action_authorization/);
  assert.match(policySql, /already consumed/);
  assert.match(policySql, /policy_version.*category2-v1/is);

  assert.match(resourceSql, /pg_advisory_xact_lock/);
  assert.match(resourceSql, /fencing_token/i);
  assert.match(resourceSql, /expires_at/i);
  assert.match(resourceSql, /released_at/i);

  assert.match(recoverySql, /checkpoint/i);
  assert.match(recoverySql, /evidence/i);
  assert.match(recoverySql, /fencing/i);

  assert.match(sourceSql, /command_center_source_observations/);
  assert.match(sourceSql, /command_center_source_refresh_checkpoints/);
  assert.match(sourceSql, /owner_id=\(select auth\.uid\(\)\)/i);

  assert.match(agencySql, /Dependency must stay in same project\/run graph/);
  assert.match(agencySql, /Dependency cycle detected/);
  assert.match(agencySql, /command_center_agency_reap_expired_resource_claims/);
  assert.match(agencySql, /controlling_orchestrator='command-center'/);
  assert.match(agencySql, /command_center_agency_revalidate_delegation_authority/);
});
