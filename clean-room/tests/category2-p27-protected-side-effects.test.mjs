import test from "node:test";
import assert from "node:assert/strict";
import {
  AuthSessionStore,
  createIntentBinding,
  DeviceRegistry,
  PolicyEngine,
  ProtectedActionCatalog,
  ProtectedActionExecutor,
  ProtectedActionGate,
  ProtectedAuthorizationRegistry,
  PROTECTED_ACTION_CLASSES
} from "../dist/security/index.js";

function protectedIntent() {
  return {
    action: "deploy.production",
    ownerId: "owner-1",
    scope: { ownerId: "owner-1", projectId: "command-center", environment: "production" },
    targetResourceId: "release:rc-1",
    parameters: { releaseId: "rc-1" },
    maximumCostCents: 0
  };
}

function buildHarness(lastVerifiedAt = "2026-10-23T18:04:30Z", authorizationExpiresAt = "2026-10-23T18:06:00Z") {
  const sessions = new AuthSessionStore();
  sessions.register({
    id: "ses_protected",
    ownerId: "owner-1",
    deviceId: "dev_owner",
    projectId: "command-center",
    scopes: ["protected:execute"],
    assurance: "passkey_uv",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: lastVerifiedAt,
    lastVerifiedAt
  });
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_owner", ownerId: "owner-1", label: "Owner device", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  const policy = new PolicyEngine();
  const catalog = new ProtectedActionCatalog();
  catalog.register({ action: "deploy.production", actionClass: "merge_deploy", riskClass: "critical", requiredScopes: ["protected:execute"], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60_000 });
  catalog.installPolicy(policy, "deploy.production");
  const gate = new ProtectedActionGate(sessions, policy, devices);
  const authorizations = new ProtectedAuthorizationRegistry();
  const intent = protectedIntent();
  const binding = createIntentBinding(intent);
  authorizations.register({
    id: "authz_deploy",
    ownerId: "owner-1",
    sessionId: "ses_protected",
    action: "deploy.production",
    authorizationIntentBinding: binding,
    state: "authorized",
    issuedAt: "2026-10-23T18:04:30Z",
    expiresAt: authorizationExpiresAt
  });
  return { sessions, catalog, authorizations, intent, binding, executor: new ProtectedActionExecutor(catalog, gate, authorizations) };
}

function executeRequest(harness, overrides = {}) {
  return {
    authorizationId: "authz_deploy",
    action: "deploy.production",
    sessionId: "ses_protected",
    resourceOwnerId: "owner-1",
    resourceProjectId: "command-center",
    resourceEnvironment: "production",
    now: "2026-10-23T18:05:00Z",
    intent: harness.intent,
    authorizationIntentBinding: harness.binding,
    effect() {},
    ...overrides
  };
}

test("P2.7 protected side effect executes only after fresh, live, intent-bound authorization and consumes it", () => {
  const harness = buildHarness();
  let effects = 0;
  const result = harness.executor.execute(executeRequest(harness, { effect() { effects += 1; return "executed"; } }));
  assert.equal(result, "executed");
  assert.equal(effects, 1);
  assert.equal(harness.authorizations.get("authz_deploy").state, "consumed");
  assert.throws(() => harness.executor.execute(executeRequest(harness, { effect() { effects += 1; } })), /already consumed/);
  assert.equal(effects, 1);
});

test("P2.7 stale verification blocks the protected side effect before authorization consumption", () => {
  const harness = buildHarness("2026-10-23T18:00:00Z");
  let effects = 0;
  assert.throws(() => harness.executor.execute(executeRequest(harness, { effect() { effects += 1; } })), /fresh_verification_expired/);
  assert.equal(effects, 0);
  assert.equal(harness.authorizations.get("authz_deploy").state, "authorized");
});

test("P2.7 expired, revoked, or absent authorization blocks execution", () => {
  const expired = buildHarness("2026-10-23T18:04:30Z", "2026-10-23T18:04:59Z");
  let effects = 0;
  assert.throws(() => expired.executor.execute(executeRequest(expired, { effect() { effects += 1; } })), /authorization expired/);
  assert.equal(effects, 0);

  const revoked = buildHarness();
  revoked.authorizations.revoke("authz_deploy", "2026-10-23T18:04:45Z", "owner_cancelled");
  assert.throws(() => revoked.executor.execute(executeRequest(revoked, { effect() { effects += 1; } })), /authorization revoked/);
  assert.equal(effects, 0);

  const absent = buildHarness();
  assert.throws(() => absent.executor.execute(executeRequest(absent, { authorizationId: "missing", effect() { effects += 1; } })), /Unknown protected authorization/);
  assert.equal(effects, 0);
});

test("P2.7 changed intent or authorization session mismatch blocks execution", () => {
  const harness = buildHarness();
  let effects = 0;
  assert.throws(() => harness.executor.execute(executeRequest(harness, {
    intent: { ...harness.intent, parameters: { releaseId: "tampered" } },
    effect() { effects += 1; }
  })), /authorization binding mismatch/);
  assert.equal(effects, 0);

  assert.throws(() => harness.executor.execute(executeRequest(harness, { sessionId: "ses_other", effect() { effects += 1; } })), /authorization session mismatch/);
  assert.equal(effects, 0);
});

test("P2.7 absent action registration blocks the side effect", () => {
  const harness = buildHarness();
  let effects = 0;
  const purchaseIntent = { ...harness.intent, action: "purchase.external" };
  assert.throws(() => harness.executor.execute(executeRequest(harness, {
    action: "purchase.external",
    intent: purchaseIntent,
    authorizationIntentBinding: createIntentBinding(purchaseIntent),
    effect() { effects += 1; }
  })), /Unregistered protected action/);
  assert.equal(effects, 0);
});

test("P2.7 catalog recognizes every protected action class required by the roadmap", () => {
  const catalog = new ProtectedActionCatalog();
  for (const [index, actionClass] of PROTECTED_ACTION_CLASSES.entries()) {
    const action = `protected.${actionClass}`;
    catalog.register({ action, actionClass, riskClass: "high", requiredScopes: [`scope:${index}`], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60_000 });
    assert.equal(catalog.required(action).actionClass, actionClass);
  }
  assert.equal(PROTECTED_ACTION_CLASSES.length, 10);
});
