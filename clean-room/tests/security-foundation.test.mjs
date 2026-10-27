import test from "node:test";
import assert from "node:assert/strict";
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

const NOW = "2026-10-23T18:30:00Z";

function activeSession(overrides = {}) {
  return {
    id: "ses_owner-1",
    ownerId: "owner-1",
    deviceId: "dev_samsung",
    projectId: "command-center",
    scopes: ["project:write", "security:protected"],
    assurance: "authenticated",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:00:00Z",
    ...overrides
  };
}

test("session lifecycle fails closed for lock, expiry, and revocation", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession());
  assert.equal(sessions.validateLive("ses_owner-1", NOW).state, "active");
  sessions.lock("ses_owner-1", "2026-10-23T18:31:00Z");
  assert.throws(() => sessions.validateLive("ses_owner-1", "2026-10-23T18:32:00Z"));
  assert.throws(() => sessions.unlock("ses_owner-1", "authenticated", "2026-10-23T18:33:00Z"));
  sessions.unlock("ses_owner-1", "passkey_uv", "2026-10-23T18:33:00Z");
  sessions.revoke("ses_owner-1", "2026-10-23T18:34:00Z", "owner_request");
  assert.throws(() => sessions.validateLive("ses_owner-1", "2026-10-23T18:35:00Z"));

  const expiring = new AuthSessionStore();
  expiring.register(activeSession({ id: "ses_expiring", expiresAt: "2026-10-23T18:10:00Z" }));
  assert.throws(() => expiring.validateLive("ses_expiring", NOW));
  assert.equal(expiring.get("ses_expiring").state, "expired");
});

test("session lifecycle rejects pre-creation and backward timestamps", () => {
  const invalid = new AuthSessionStore();
  assert.throws(() => invalid.register(activeSession({ id: "ses_invalid_time", lastValidatedAt: "2026-10-23T17:59:59Z" })), /cannot be before createdAt/);

  const sessions = new AuthSessionStore();
  sessions.register(activeSession({ id: "ses_time" }));
  assert.throws(() => sessions.validateLive("ses_time", "2026-10-23T17:59:59Z"), /not yet valid/);
  assert.equal(sessions.validateLive("ses_time", "2026-10-23T18:10:00Z").lastValidatedAt, "2026-10-23T18:10:00Z");
  assert.throws(() => sessions.lock("ses_time", "2026-10-23T18:09:59Z"), /cannot move session time backward/);
  sessions.lock("ses_time", "2026-10-23T18:11:00Z");
  assert.throws(() => sessions.unlock("ses_time", "passkey_uv", "2026-10-23T18:10:59Z"), /cannot move session time backward/);
  sessions.unlock("ses_time", "passkey_uv", "2026-10-23T18:12:00Z");
  assert.throws(() => sessions.revoke("ses_time", "2026-10-23T18:11:59Z", "owner_request"), /cannot move session time backward/);
});

test("passkeys require platform authenticator and user verification and never accept biometric templates", () => {
  const passkeys = new PasskeyRegistry();
  passkeys.register({ id: "pk_one", ownerId: "owner-1", deviceId: "dev_samsung", publicKeyRef: "webauthn-public-key-ref-1", authenticatorAttachment: "platform", userVerification: "required", transports: ["internal"], createdAt: NOW });
  assert.equal(passkeys.recordAssertion("pk_one", "owner-1", true, "2026-10-23T18:31:00Z").lastUsedAt, "2026-10-23T18:31:00Z");
  assert.throws(() => passkeys.recordAssertion("pk_one", "owner-1", false, "2026-10-23T18:32:00Z"));
  assert.throws(() => passkeys.register({ id: "pk_bad", ownerId: "owner-1", publicKeyRef: "ref", authenticatorAttachment: "platform", userVerification: "required", transports: ["internal"], createdAt: NOW, biometricTemplate: "never-store-this" }));
  passkeys.revoke("pk_one", "2026-10-23T18:33:00Z");
  assert.throws(() => passkeys.assertUsable("pk_one", "owner-1"));
});

test("device inventory exposes trust and revocation state", () => {
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_samsung", ownerId: "owner-1", label: "Samsung phone", platform: "android", trustState: "unknown", createdAt: NOW });
  devices.setTrusted("dev_samsung");
  devices.markSeen("dev_samsung", "2026-10-23T18:31:00Z");
  assert.equal(devices.get("dev_samsung").trustState, "trusted");
  devices.revoke("dev_samsung", "2026-10-23T18:32:00Z");
  assert.throws(() => devices.markSeen("dev_samsung", "2026-10-23T18:33:00Z"));
});

test("central policy is deny-by-default and enforces fresh verification", () => {
  const policy = new PolicyEngine();
  const subject = { ownerId: "owner-1", sessionId: "ses_owner-1", deviceId: "dev_samsung", projectId: "command-center", assurance: "fresh_passkey_uv", scopes: ["project:write", "security:protected"], lastVerifiedAt: "2026-10-23T18:29:30Z" };
  assert.equal(policy.evaluate({ action: "deploy.production", subject, resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: NOW }).allowed, false);
  policy.register({ action: "project.protected_write", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60_000, ownerOnly: true, allowProjectWildcard: false });
  assert.equal(policy.evaluate({ action: "project.protected_write", subject, resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: NOW }).allowed, true);
  assert.equal(policy.evaluate({ action: "project.protected_write", subject: { ...subject, ownerId: "owner-2" }, resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: NOW }).reason, "owner_mismatch");
  assert.equal(policy.evaluate({ action: "project.protected_write", subject: { ...subject, lastVerifiedAt: "2026-10-23T18:20:00Z" }, resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: NOW }).reason, "fresh_verification_expired");
});

test("protected action gate binds live session state to the central policy decision", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession({ assurance: "passkey_uv", lastVerifiedAt: "2026-10-23T18:29:30Z" }));
  const policy = new PolicyEngine();
  policy.register({ action: "project.protected_write", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60_000, ownerOnly: true, allowProjectWildcard: false });
  const gate = new ProtectedActionGate(sessions, policy);
  assert.equal(gate.authorize({ sessionId: "ses_owner-1", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: NOW }).allowed, true);
  sessions.lock("ses_owner-1", "2026-10-23T18:30:10Z");
  assert.throws(() => gate.authorize({ sessionId: "ses_owner-1", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:30:20Z" }));
});

test("secret registry stores references only and rejects raw secret material", () => {
  const secrets = new SecretReferenceRegistry();
  secrets.register({ id: "sec_supabase_service", provider: "supabase", purpose: "server-side service credential reference", state: "configured", createdAt: NOW });
  assert.equal(secrets.list().length, 1);
  assert.throws(() => assertReferenceOnly({ token: "abc" }));
  const syntheticSecretLikeValue = "sk-" + "12345678901234567890";
  assert.throws(() => assertReferenceOnly({ note: syntheticSecretLikeValue }));
});

test("data boundaries deny cross-owner and cross-project access", () => {
  const boundary = { ownerId: "owner-1", projectId: "edge-finder", businessId: "biz-one", sensitivity: "protected" };
  assert.equal(evaluateDataBoundary({ ownerId: "owner-1", projectIds: ["edge-finder"], businessIds: ["biz-one"] }, boundary).allowed, true);
  assert.equal(evaluateDataBoundary({ ownerId: "owner-2", projectIds: ["edge-finder"], businessIds: ["biz-one"] }, boundary).reason, "owner_boundary_mismatch");
  assert.equal(evaluateDataBoundary({ ownerId: "owner-1", projectIds: ["command-center"], businessIds: ["biz-one"] }, boundary).reason, "project_boundary_mismatch");
});

test("security incidents require containment and recovery before resolution and append every transition", () => {
  const events = new SecurityEventLedger();
  const incidents = new IncidentRegistry(events);
  incidents.open({ id: "inc_one", ownerId: "owner-1", title: "Suspicious session", riskClass: "high", state: "open", openedAt: NOW, updatedAt: NOW }, "sev_one", "security-test");
  incidents.transition("inc_one", "acknowledged", "2026-10-23T18:31:00Z", "sev_two", "security-test");
  incidents.transition("inc_one", "contained", "2026-10-23T18:32:00Z", "sev_three", "security-test");
  assert.throws(() => incidents.transition("inc_one", "resolved", "2026-10-23T18:32:30Z", "sev_bad", "security-test"));
  incidents.transition("inc_one", "recovering", "2026-10-23T18:33:00Z", "sev_four", "security-test");
  incidents.transition("inc_one", "resolved", "2026-10-23T18:34:00Z", "sev_five", "security-test");
  assert.equal(incidents.get("inc_one").state, "resolved");
  assert.equal(events.list("owner-1").length, 5);
  assert.throws(() => incidents.transition("inc_one", "open", "2026-10-23T18:35:00Z", "sev_six", "security-test"));
});
