import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore, DeviceRegistry, PolicyDecisionAuditLedger, PolicyEngine, ProtectedActionGate } from "../dist/security/index.js";

function policy() {
  const engine = new PolicyEngine();
  engine.register({ action: "project.protected_write", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "authenticated", ownerOnly: true, allowProjectWildcard: false });
  return engine;
}

test("P2.4 revoked-device precondition failure still produces exactly one fail-closed auditable decision", () => {
  const sessions = new AuthSessionStore();
  sessions.register({ id: "ses_precondition", ownerId: "owner-1", deviceId: "dev_revoked", projectId: "command-center", scopes: ["security:protected"], assurance: "authenticated", state: "active", createdAt: "2026-10-23T18:00:00Z", expiresAt: "2026-10-23T20:00:00Z", lastValidatedAt: "2026-10-23T18:00:00Z" });
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_revoked", ownerId: "owner-1", label: "Revoked phone", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  devices.revoke("dev_revoked", "2026-10-23T18:01:00Z");
  const audit = new PolicyDecisionAuditLedger();
  const gate = new ProtectedActionGate(sessions, policy(), devices, audit);

  assert.throws(() => gate.authorize({ sessionId: "ses_precondition", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:02:00Z" }), /Device revoked/);
  const records = audit.list("owner-1");
  assert.equal(records.length, 1);
  assert.equal(records[0].decision.allowed, false);
  assert.equal(records[0].decision.reason, "protected_precondition_failed");
});

test("P2.4 unknown session is also audited once under the protected resource owner", () => {
  const audit = new PolicyDecisionAuditLedger();
  const gate = new ProtectedActionGate(new AuthSessionStore(), policy(), new DeviceRegistry(), audit);
  assert.throws(() => gate.authorize({ sessionId: "ses_unknown", action: "project.protected_write", resourceOwnerId: "owner-1", resourceProjectId: "command-center", now: "2026-10-23T18:02:00Z" }), /Unknown session/);
  const records = audit.list("owner-1");
  assert.equal(records.length, 1);
  assert.equal(records[0].sessionId, "ses_unknown");
  assert.equal(records[0].decision.reason, "protected_precondition_failed");
});
