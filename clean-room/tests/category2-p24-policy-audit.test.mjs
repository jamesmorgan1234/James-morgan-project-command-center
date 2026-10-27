import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore, DeviceRegistry, PolicyDecisionAuditLedger, PolicyEngine, ProtectedActionGate } from "../dist/security/index.js";

function setup() {
  const sessions = new AuthSessionStore();
  sessions.register({
    id: "ses_policy",
    ownerId: "owner-1",
    deviceId: "dev_policy",
    projectId: "command-center",
    scopes: ["security:protected"],
    assurance: "passkey_uv",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:00:00Z",
    lastVerifiedAt: "2026-10-23T18:00:00Z"
  });
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_policy", ownerId: "owner-1", label: "Owner device", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  const policy = new PolicyEngine();
  policy.register({ action: "project.protected_write", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "passkey_uv", ownerOnly: true, allowProjectWildcard: false });
  const audit = new PolicyDecisionAuditLedger();
  return { sessions, devices, policy, audit, gate: new ProtectedActionGate(sessions, policy, devices, audit) };
}

test("P2.4 allowed protected action appends exactly one auditable policy decision", () => {
  const { gate, audit } = setup();
  const decision = gate.authorize({ sessionId: "ses_policy", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:05:00Z" });
  assert.equal(decision.allowed, true);
  const records = audit.list("owner-1");
  assert.equal(records.length, 1);
  assert.equal(records[0].sequence, 1);
  assert.equal(records[0].decision.reason, "allowed");
  assert.equal(records[0].sessionId, "ses_policy");
  assert.equal(records[0].resourceProjectId, "command-center");
});

test("P2.4 policy denial is audited once before the protected action fails", () => {
  const { gate, audit } = setup();
  assert.throws(() => gate.authorize({ sessionId: "ses_policy", action: "project.protected_write", resourceOwnerId: "owner-2", resourceProjectId: "command-center", now: "2026-10-23T18:05:00Z" }), /owner_mismatch/);
  const records = audit.list("owner-1");
  assert.equal(records.length, 1);
  assert.equal(records[0].decision.allowed, false);
  assert.equal(records[0].decision.reason, "owner_mismatch");
});
