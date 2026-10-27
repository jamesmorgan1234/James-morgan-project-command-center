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
  PROTECTED_ACTION_CLASSES
} from "../dist/security/index.js";

function buildHarness(lastVerifiedAt = "2026-10-23T18:04:30Z") {
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
  return { sessions, catalog, executor: new ProtectedActionExecutor(catalog, gate) };
}

function intent() {
  return {
    action: "deploy.production",
    ownerId: "owner-1",
    scope: { ownerId: "owner-1", projectId: "command-center", environment: "production" },
    targetResourceId: "release:rc-1",
    parameters: { releaseId: "rc-1" },
    maximumCostCents: 0
  };
}

test("P2.7 protected side effect executes only after a fresh intent-bound authorization", () => {
  const { executor } = buildHarness();
  let effects = 0;
  const protectedIntent = intent();
  const result = executor.execute({
    action: "deploy.production",
    sessionId: "ses_protected",
    resourceOwnerId: "owner-1",
    resourceProjectId: "command-center",
    resourceEnvironment: "production",
    now: "2026-10-23T18:05:00Z",
    intent: protectedIntent,
    authorizationIntentBinding: createIntentBinding(protectedIntent),
    effect() { effects += 1; return "executed"; }
  });
  assert.equal(result, "executed");
  assert.equal(effects, 1);
});

test("P2.7 stale verification blocks the protected side effect before execution", () => {
  const { executor } = buildHarness("2026-10-23T18:00:00Z");
  let effects = 0;
  const protectedIntent = intent();
  assert.throws(() => executor.execute({
    action: "deploy.production",
    sessionId: "ses_protected",
    resourceOwnerId: "owner-1",
    resourceProjectId: "command-center",
    resourceEnvironment: "production",
    now: "2026-10-23T18:05:00Z",
    intent: protectedIntent,
    authorizationIntentBinding: createIntentBinding(protectedIntent),
    effect() { effects += 1; }
  }), /fresh_verification_expired/);
  assert.equal(effects, 0);
});

test("P2.7 absent action registration or changed intent blocks the side effect", () => {
  const { executor } = buildHarness();
  let effects = 0;
  const protectedIntent = intent();
  assert.throws(() => executor.execute({
    action: "purchase.external",
    sessionId: "ses_protected",
    resourceOwnerId: "owner-1",
    now: "2026-10-23T18:05:00Z",
    intent: { ...protectedIntent, action: "purchase.external" },
    authorizationIntentBinding: createIntentBinding({ ...protectedIntent, action: "purchase.external" }),
    effect() { effects += 1; }
  }), /Unregistered protected action/);
  assert.equal(effects, 0);

  assert.throws(() => executor.execute({
    action: "deploy.production",
    sessionId: "ses_protected",
    resourceOwnerId: "owner-1",
    resourceProjectId: "command-center",
    resourceEnvironment: "production",
    now: "2026-10-23T18:05:00Z",
    intent: { ...protectedIntent, parameters: { releaseId: "tampered" } },
    authorizationIntentBinding: createIntentBinding(protectedIntent),
    effect() { effects += 1; }
  }), /authorization binding mismatch/);
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
