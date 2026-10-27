import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore, AuthenticationService } from "../dist/security/index.js";

function activeSession(id, ownerId = "owner-1") {
  return {
    id,
    ownerId,
    scopes: ["project:write"],
    assurance: "authenticated",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:01:00Z"
  };
}

test("P2.1 secure recovery revokes live sessions and never creates authorized access", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession("ses_old"));
  const auth = new AuthenticationService(sessions);
  auth.registerProvider({
    id: "recovery_provider",
    authenticate() { throw new Error("not used"); },
    signOut() {},
    recover(request) {
      assert.equal(request.ownerId, "owner-1");
      return { ownerId: "owner-1", recoveryRef: "recovery-1", recoveredAt: "2026-10-23T18:05:00Z" };
    }
  });

  const recovered = auth.recover("recovery_provider", { ownerId: "owner-1", now: "2026-10-23T18:06:00Z" });
  assert.equal(recovered.state, "verified_requires_sign_in");
  assert.deepEqual(recovered.revokedSessionIds, ["ses_old"]);
  assert.equal(sessions.get("ses_old").state, "revoked");
  assert.throws(() => sessions.validateLive("ses_old", "2026-10-23T18:07:00Z"), /revoked/);
  assert.equal(sessions.listByOwner("owner-1").filter((session) => session.state === "active").length, 0);
});

test("P2.1 recovery fails closed on owner mismatch without changing session state", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession("ses_keep"));
  const auth = new AuthenticationService(sessions);
  auth.registerProvider({
    id: "mismatch_provider",
    authenticate() { throw new Error("not used"); },
    signOut() {},
    recover() { return { ownerId: "owner-2", recoveryRef: "recovery-bad", recoveredAt: "2026-10-23T18:05:00Z" }; }
  });

  assert.throws(() => auth.recover("mismatch_provider", { ownerId: "owner-1", now: "2026-10-23T18:06:00Z" }), /owner mismatch/);
  assert.equal(sessions.get("ses_keep").state, "active");
});

test("P2.1 recovery requires an explicit provider recovery capability", () => {
  const sessions = new AuthSessionStore();
  sessions.register(activeSession("ses_keep"));
  const auth = new AuthenticationService(sessions);
  auth.registerProvider({ id: "no_recovery", authenticate() { throw new Error("not used"); }, signOut() {} });

  assert.throws(() => auth.recover("no_recovery", { ownerId: "owner-1", now: "2026-10-23T18:06:00Z" }), /does not support recovery/);
  assert.equal(sessions.get("ses_keep").state, "active");
});