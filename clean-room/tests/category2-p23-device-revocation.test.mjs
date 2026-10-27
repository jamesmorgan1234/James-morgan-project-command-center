import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore, DeviceRegistry, PolicyEngine, ProtectedActionGate } from "../dist/security/index.js";

function activeSession() {
  return {
    id: "ses_device",
    ownerId: "owner-1",
    deviceId: "dev_phone",
    projectId: "command-center",
    scopes: ["security:protected"],
    assurance: "passkey_uv",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:00:00Z",
    lastVerifiedAt: "2026-10-23T18:00:00Z"
  };
}

function policyEngine() {
  const policy = new PolicyEngine();
  policy.register({ action: "project.protected_write", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "passkey_uv", ownerOnly: true, allowProjectWildcard: false });
  return policy;
}

test("P2.3 revoked device loses protected access while its session is still otherwise active", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession());
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_phone", ownerId: "owner-1", label: "Samsung phone", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  const gate = new ProtectedActionGate(sessions, policyEngine(), devices);

  assert.equal(gate.authorize({ sessionId: "ses_device", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:05:00Z" }).allowed, true);
  devices.revoke("dev_phone", "2026-10-23T18:06:00Z");
  assert.throws(() => gate.authorize({ sessionId: "ses_device", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:07:00Z" }), /Device revoked/);
  assert.equal(sessions.get("ses_device").state, "active");
});

test("P2.3 device-bound protected access fails closed on an owner binding mismatch", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession());
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_phone", ownerId: "owner-2", label: "Other device", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  const gate = new ProtectedActionGate(sessions, policyEngine(), devices);

  assert.throws(() => gate.authorize({ sessionId: "ses_device", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:05:00Z" }), /Device owner mismatch/);
});
