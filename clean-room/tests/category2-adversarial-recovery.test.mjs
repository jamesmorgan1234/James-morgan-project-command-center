import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AuthSessionStore,
  PasskeyRegistry,
  DeviceRegistry,
  PolicyEngine,
  ProtectedActionGate,
  SecretReferenceRegistry,
  assertReferenceOnly,
  evaluateDataBoundary,
  SecurityEventLedger,
  IncidentRegistry
} from "../dist/security/index.js";
import { SupabaseOwnerRuntimeSnapshotProvider } from "../dist/runtime/supabase-owner-provider.js";

const NOW = "2026-10-24T13:30:00Z";

function migration(name) {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
}

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function sqlFunction(sql, qualifiedName) {
  const startNeedle = `create or replace function ${qualifiedName}`;
  const start = sql.toLowerCase().indexOf(startNeedle.toLowerCase());
  assert.notEqual(start, -1, `missing SQL function ${qualifiedName}`);
  const revokeNeedle = `revoke all on function ${qualifiedName}`;
  const revoke = sql.toLowerCase().indexOf(revokeNeedle.toLowerCase(), start);
  return sql.slice(start, revoke === -1 ? sql.length : revoke);
}

function liveSession(overrides = {}) {
  return {
    id: "session-a",
    ownerId: "owner-a",
    deviceId: "device-a",
    projectId: "command-center",
    scopes: ["security:protected"],
    assurance: "fresh_passkey_uv",
    state: "active",
    createdAt: "2026-10-24T13:00:00Z",
    expiresAt: "2026-10-24T14:00:00Z",
    lastValidatedAt: "2026-10-24T13:29:30Z",
    lastVerifiedAt: "2026-10-24T13:29:30Z",
    ...overrides
  };
}

function trustedDevices() {
  const devices = new DeviceRegistry();
  devices.register({ id: "device-a", ownerId: "owner-a", label: "Adversarial test device", platform: "test", trustState: "trusted", createdAt: "2026-10-24T13:00:00Z" });
  return devices;
}

test("adversarial: authorization replay and stolen-session reuse fail closed", () => {
  const policySql = migration("20261024103000_category2_policy_single_use_authorizations.sql");
  assert.match(policySql, /set status='consumed', consumed_at=now\(\)/i);
  assert.match(policySql, /a\.status='authorized'/i);
  assert.match(policySql, /a\.authorized_session_id is not null/i);
  assert.match(policySql, /s\.id=a\.authorized_session_id/i);
  assert.match(policySql, /s\.user_id=a\.owner_id/i);
  assert.match(policySql, /cs\.revoked_at is not null/i);
  assert.match(policySql, /cd\.revoked_at is not null/i);
  assert.match(policySql, /already consumed/i);

  const sessions = new AuthSessionStore();
  sessions.register(liveSession());
  sessions.revoke("session-a", "2026-10-24T13:30:01Z", "stolen_device");
  assert.throws(() => sessions.validateLive("session-a", "2026-10-24T13:30:02Z"));
});

test("adversarial: privilege confusion and cross-owner/project access are denied", () => {
  const aclSql = migration("20261024093000_category2_service_get_auto_acl_hardening.sql");
  assert.match(aclSql, /revoke execute on function public\.command_center_agent_service_get_auto\(uuid\) from authenticated/i);
  assert.match(aclSql, /grant execute on function public\.command_center_agent_service_get_auto\(uuid\) to service_role/i);

  const protectedBoundary = { ownerId: "owner-a", projectId: "command-center", businessId: "business-a", sensitivity: "protected" };
  assert.equal(evaluateDataBoundary({ ownerId: "owner-b", projectIds: ["command-center"], businessIds: ["business-a"] }, protectedBoundary).allowed, false);
  assert.equal(evaluateDataBoundary({ ownerId: "owner-a", projectIds: ["other-project"], businessIds: ["business-a"] }, protectedBoundary).allowed, false);
});

test("adversarial: untrusted integration payloads cannot promote themselves into Agent or authorization instructions", () => {
  const integrations = migration("20261021_integrations_complete.sql");
  const browserIngest = sqlFunction(integrations, "public.command_center_integration_ingest");
  const webhookIngest = sqlFunction(integrations, "command_center_private.ingest_webhook");

  for (const body of [browserIngest, webhookIngest]) {
    assert.doesNotMatch(body, /command_center_agent_/i);
    assert.doesNotMatch(body, /command_center_security_authorize_action/i);
    assert.doesNotMatch(body, /command_center_integration_execute_write/i);
    assert.doesNotMatch(body, /authorization_state\s*=\s*'authorized'/i);
  }

  assert.match(webhookIngest, /normalize_integration_payload/i);
});

test("adversarial: secret material cannot enter reference-only client state", () => {
  const secrets = new SecretReferenceRegistry();
  secrets.register({ id: "provider-secret-ref", provider: "provider", purpose: "server-side credential reference", state: "configured", createdAt: NOW });
  assert.equal(secrets.list()[0].id, "provider-secret-ref");
  assert.throws(() => assertReferenceOnly({ password: "do-not-store" }));
  assert.throws(() => assertReferenceOnly({ authorization: "Bearer should-never-be-here" }));
  assert.throws(() => assertReferenceOnly({ metadata: { refresh_token: "nested-do-not-store" } }));

  const integrationSql = migration("20261024104000_category2_integration_secret_isolation.sql");
  assert.match(integrationSql, /revoke select on table public\.integration_webhook_endpoints from authenticated/i);
  assert.match(integrationSql, /Raw webhook secret rotation is server-side only/i);
  assert.match(integrationSql, /grant execute on function public\.command_center_integration_service_rotate_webhook_secret\(uuid,uuid,uuid\) to service_role/i);
});

test("adversarial: policy downgrade and unknown protected actions are denied", () => {
  const policy = new PolicyEngine();
  policy.register({ action: "security.critical", version: 1, enabled: true, riskClass: "critical", requiredScopes: ["security:protected"], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60_000, ownerOnly: true, allowProjectWildcard: false });
  const sessions = new AuthSessionStore();
  sessions.register(liveSession());
  const devices = trustedDevices();
  const gate = new ProtectedActionGate(sessions, policy, devices);

  assert.equal(gate.authorize({ sessionId: "session-a", action: "security.critical", resourceOwnerId: "owner-a", resourceProjectId: "command-center", now: NOW }).allowed, true);
  assert.equal(policy.evaluate({ action: "security.unknown", subject: { ownerId: "owner-a", sessionId: "session-a", deviceId: "device-a", projectId: "command-center", assurance: "passkey_uv", scopes: ["security:protected"], lastVerifiedAt: "2026-10-24T13:29:30Z" }, resourceOwnerId: "owner-a", resourceProjectId: "command-center", now: NOW }).allowed, false);

  const downgraded = new AuthSessionStore();
  downgraded.register(liveSession({ id: "session-low", assurance: "authenticated" }));
  const downgradedGate = new ProtectedActionGate(downgraded, policy, devices);
  assert.throws(
    () => downgradedGate.authorize({ sessionId: "session-low", action: "security.critical", resourceOwnerId: "owner-a", resourceProjectId: "command-center", now: NOW }),
    /insufficient_assurance/i
  );

  const passkeys = new PasskeyRegistry();
  assert.throws(() => passkeys.register({ id: "cross-platform", ownerId: "owner-a", publicKeyRef: "ref", authenticatorAttachment: "cross-platform", userVerification: "required", transports: ["usb"], createdAt: NOW }));
});

test("adversarial: compromised integration cannot execute without the canonical single-use gate", () => {
  const integrationSql = migration("20261024104000_category2_integration_secret_isolation.sql");
  assert.match(integrationSql, /security_authorization_id uuid references public\.security_action_authorizations/i);
  assert.match(integrationSql, /new\.status='executing'/i);
  assert.match(integrationSql, /consume_action_authorization[\s\S]*integration\.execute_write/i);
  assert.match(integrationSql, /Connected state requires server-side provider verification/i);
});

test("adversarial: offline/session recovery never fabricates an authenticated owner", async () => {
  const provider = new SupabaseOwnerRuntimeSnapshotProvider({
    supabaseUrl: "https://example.supabase.co",
    publishableKey: "sb_publishable_test_key",
    fetcher: async () => { throw new Error("offline"); }
  });
  const snapshot = await provider.load();
  assert.equal(snapshot.connection.state, "disconnected");

  const providerSource = source("src/runtime/provider.ts");
  assert.match(providerSource, /secure_session_restore_requires_same_origin_broker/i);
  assert.match(providerSource, /secure_session_broker_required/i);
  assert.doesNotMatch(providerSource, /localStorage\.setItem\([^\n]*owner-session/i);
});

test("adversarial: incident drill cannot resolve before containment and recovery", () => {
  const events = new SecurityEventLedger();
  const incidents = new IncidentRegistry(events);
  incidents.open({ id: "incident-drill", ownerId: "owner-a", title: "Compromised integration drill", riskClass: "critical", state: "open", openedAt: NOW, updatedAt: NOW }, "event-open", "p2.9-drill");
  incidents.transition("incident-drill", "acknowledged", "2026-10-24T13:31:00Z", "event-ack", "p2.9-drill");
  incidents.transition("incident-drill", "contained", "2026-10-24T13:32:00Z", "event-contain", "p2.9-drill");
  assert.throws(() => incidents.transition("incident-drill", "resolved", "2026-10-24T13:33:00Z", "event-invalid", "p2.9-drill"));
  incidents.transition("incident-drill", "recovering", "2026-10-24T13:34:00Z", "event-recover", "p2.9-drill");
  incidents.transition("incident-drill", "resolved", "2026-10-24T13:35:00Z", "event-resolve", "p2.9-drill");
  assert.equal(events.list("owner-a").length, 5);
});

test("adversarial: CI supply-chain seam is pinned and lifecycle scripts are disabled", () => {
  const pkg = JSON.parse(source("package.json"));
  assert.equal(pkg.private, true);
  assert.equal(pkg.devDependencies.typescript, "5.8.3");
  assert.equal(pkg.devDependencies["@electric-sql/pglite"], "0.5.12");
  assert.equal(Object.hasOwn(pkg.scripts, "preinstall"), false);
  assert.equal(Object.hasOwn(pkg.scripts, "install"), false);
  assert.equal(Object.hasOwn(pkg.scripts, "postinstall"), false);

  const lock = JSON.parse(source("package-lock.json"));
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[""].devDependencies.typescript, "5.8.3");
  assert.equal(lock.packages[""].devDependencies["@electric-sql/pglite"], "0.5.12");
  assert.equal(lock.packages["node_modules/typescript"].version, "5.8.3");
  assert.match(lock.packages["node_modules/typescript"].integrity, /^sha512-/);
  assert.equal(lock.packages["node_modules/@electric-sql/pglite"].version, "0.5.12");
  assert.match(lock.packages["node_modules/@electric-sql/pglite"].integrity, /^sha512-/);

  const workflow = readFileSync(new URL("../../.github/workflows/spec-lock-v2-clean-room-qa.yml", import.meta.url), "utf8");
  assert.match(workflow, /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/);
  assert.match(workflow, /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.match(workflow, /cache-dependency-path:\s*clean-room\/package-lock\.json/);
  assert.match(workflow, /npm ci --no-audit --no-fund --ignore-scripts/);
  assert.doesNotMatch(workflow, /\bnpm install\b/);
  assert.doesNotMatch(workflow, /uses:\s*actions\/(checkout|setup-node)@v\d+/i);
});
