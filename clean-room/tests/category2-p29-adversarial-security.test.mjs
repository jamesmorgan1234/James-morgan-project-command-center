import test from "node:test";
import assert from "node:assert/strict";
import {
  assertSecretChannelSafe,
  AuthSessionStore,
  AuthenticationService,
  PolicyEngine,
  ProtectedAuthorizationRegistry,
  WebhookAcceptanceGate
} from "../dist/security/index.js";
import { validateTrustedEnvironmentBinding } from "../dist/kernel/trusted-environment.mjs";

function subject(overrides = {}) {
  return {
    ownerId: "owner-1",
    sessionId: "ses-1",
    projectId: "project-a",
    assurance: "passkey_uv",
    scopes: ["protected:execute"],
    lastVerifiedAt: "2026-10-23T18:04:30Z",
    ...overrides
  };
}

function policy() {
  const engine = new PolicyEngine();
  engine.register({ action: "protected.execute", version: 1, enabled: true, riskClass: "critical", requiredScopes: ["protected:execute"], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60_000, ownerOnly: true, allowProjectWildcard: false });
  return engine;
}

test("P2.9 auth replay is rejected after protected authorization consumption", () => {
  const registry = new ProtectedAuthorizationRegistry();
  const record = {
    id: "authz-replay",
    ownerId: "owner-1",
    sessionId: "ses-1",
    action: "protected.execute",
    authorizationIntentBinding: "binding-1",
    authoritySource: "owner_verified",
    sourceRef: "owner-decision:test",
    state: "authorized",
    issuedAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T18:10:00Z"
  };
  const use = { ownerId: "owner-1", sessionId: "ses-1", action: "protected.execute", authorizationIntentBinding: "binding-1" };
  registry.register(record);
  registry.consume(record.id, use, "2026-10-23T18:05:00Z");
  assert.throws(() => registry.assertUsable(record.id, use, "2026-10-23T18:05:01Z"), /already consumed/);
});

test("P2.9 stolen-session reuse is rejected by authorization session binding", () => {
  const registry = new ProtectedAuthorizationRegistry();
  registry.register({ id: "authz-session", ownerId: "owner-1", sessionId: "ses-owner", action: "protected.execute", authorizationIntentBinding: "binding-1", authoritySource: "owner_verified", sourceRef: "owner-decision:test", state: "authorized", issuedAt: "2026-10-23T18:00:00Z", expiresAt: "2026-10-23T18:10:00Z" });
  assert.throws(() => registry.assertUsable("authz-session", { ownerId: "owner-1", sessionId: "ses-stolen", action: "protected.execute", authorizationIntentBinding: "binding-1" }, "2026-10-23T18:05:00Z"), /session mismatch/);
});

test("P2.9 privilege confusion and unavailable policy both fail closed", () => {
  const engine = policy();
  const confused = engine.evaluate({ action: "protected.execute", subject: subject({ ownerId: "owner-2" }), resourceOwnerId: "owner-1", resourceProjectId: "project-a", now: "2026-10-23T18:05:00Z" });
  assert.deepEqual({ allowed: confused.allowed, reason: confused.reason }, { allowed: false, reason: "owner_mismatch" });
  const unavailable = engine.evaluate({ action: "protected.execute", subject: subject(), resourceOwnerId: "owner-1", resourceProjectId: "project-a", now: "2026-10-23T18:05:00Z", policyAvailable: false });
  assert.deepEqual({ allowed: unavailable.allowed, reason: unavailable.reason }, { allowed: false, reason: "policy_unavailable" });
});

test("P2.9 prompt-injection or model content cannot be registered as protected authority", () => {
  const registry = new ProtectedAuthorizationRegistry();
  assert.throws(() => registry.register({ id: "authz-injected", ownerId: "owner-1", sessionId: "ses-1", action: "protected.execute", authorizationIntentBinding: "binding-1", authoritySource: "model_output", sourceRef: "untrusted:external-prompt", state: "authorized", issuedAt: "2026-10-23T18:00:00Z", expiresAt: "2026-10-23T18:10:00Z" }), /authority source is untrusted/);
  assert.equal(registry.get("authz-injected"), undefined);
});

test("P2.9 secret-leak attempt is rejected in normal log channels", () => {
  const syntheticSecret = "sk-" + "12345678901234567890";
  assert.throws(() => assertSecretChannelSafe("log", { message: `provider failed ${syntheticSecret}` }), /Secret-like material/);
});

test("P2.9 compromised integration callback fails signature verification", () => {
  const gate = new WebhookAcceptanceGate(() => false);
  const result = gate.accept({ providerKey: "provider-a", eventId: "evt-1", accountId: "acct-1", environment: "preview", occurredAt: "2026-10-23T18:00:00Z", receivedAt: "2026-10-23T18:00:01Z", keyRef: "key-1", signature: "invalid-signature", signedPayload: "{}" }, { providerKey: "provider-a", accountId: "acct-1", environment: "preview", keyWindows: [{ keyRef: "key-1", notBefore: "2026-10-23T17:00:00Z", notAfter: "2026-10-23T19:00:00Z" }], maxAgeMs: 60_000, maxFutureSkewMs: 1_000 });
  assert.deepEqual({ accepted: result.accepted, reason: result.reason }, { accepted: false, reason: "callback_signature_invalid" });
});

test("P2.9 assurance downgrade is rejected", () => {
  const sessions = new AuthSessionStore();
  sessions.register({ id: "ses-downgrade", ownerId: "owner-1", scopes: [], assurance: "passkey_uv", state: "active", createdAt: "2026-10-23T18:00:00Z", expiresAt: "2026-10-23T20:00:00Z", lastValidatedAt: "2026-10-23T18:01:00Z", lastVerifiedAt: "2026-10-23T18:01:00Z" });
  assert.throws(() => sessions.recordVerification("ses-downgrade", "authenticated", "2026-10-23T18:02:00Z"), /cannot lower session assurance/);
});

test("P2.9 offline recovery cannot silently bypass provider recovery capability", () => {
  const auth = new AuthenticationService(new AuthSessionStore());
  auth.registerProvider({ id: "offline-provider", authenticate() { throw new Error("offline"); }, signOut() {} });
  assert.throws(() => auth.recover("offline-provider", { ownerId: "owner-1", now: "2026-10-23T18:05:00Z" }), /does not support recovery/);
});

test("P2.9 supply-chain/backend identity downgrade is rejected before startup", () => {
  assert.throws(() => validateTrustedEnvironmentBinding({ deploymentEnvironment: "preview", backendClassification: "isolated", providerKey: "supabase", projectRef: "gmlsucpwliegwlxymjvp", baseUrl: "https://gmlsucpwliegwlxymjvp.supabase.co", authIssuer: "https://gmlsucpwliegwlxymjvp.supabase.co/auth/v1", authAudience: "authenticated" }), /protected_backend_misclassified/);
});
