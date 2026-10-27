import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore } from "../dist/security/index.js";

function activeSession() {
  return {
    id: "ses_risk",
    ownerId: "owner-1",
    scopes: ["project:write"],
    assurance: "authenticated",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:01:00Z"
  };
}

test("P2.1 risky sessions fail closed until passkey-verified clearance", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession());
  sessions.markRisky("ses_risk", "2026-10-23T18:02:00Z");

  assert.throws(() => sessions.validateLive("ses_risk", "2026-10-23T18:03:00Z"), /Session risky/);
  assert.throws(() => sessions.recordVerification("ses_risk", "fresh_passkey_uv", "2026-10-23T18:03:00Z"), /risk clearance/);
  assert.throws(() => sessions.clearRisk("ses_risk", "authenticated", "2026-10-23T18:03:00Z"), /passkey user verification/);

  const cleared = sessions.clearRisk("ses_risk", "passkey_uv", "2026-10-23T18:03:00Z");
  assert.equal(cleared.riskDetectedAt, undefined);
  assert.equal(cleared.assurance, "passkey_uv");
  assert.equal(sessions.validateLive("ses_risk", "2026-10-23T18:04:00Z").state, "active");
});

test("P2.1 risk timestamps cannot move session time backward", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession());
  assert.throws(() => sessions.markRisky("ses_risk", "2026-10-23T18:00:59Z"), /cannot move session time backward/);
  assert.equal(sessions.get("ses_risk").riskDetectedAt, undefined);
});