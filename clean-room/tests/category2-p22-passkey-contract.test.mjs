import test from "node:test";
import assert from "node:assert/strict";
import {
  AuthSessionStore,
  AuthenticationService,
  PasskeyRegistry,
  SupabasePasskeyClient,
  SupabasePasskeyError
} from "../dist/security/index.js";

const AUTH_BASE = "https://command-center.example/__cc_auth__";
const KEY = "sb_publishable_test_key";

function activeFallbackProvider() {
  return {
    id: "explicit_fallback",
    authenticate(request) {
      return {
        ownerId: request.ownerId,
        assurance: "authenticated",
        scopes: ["project:write"],
        providerSessionRef: "fallback-session-1",
        authenticatedAt: request.now
      };
    },
    signOut() {}
  };
}

test("P2.2 supports multiple owner passkeys and revokes one credential without disabling another", () => {
  const passkeys = new PasskeyRegistry();
  passkeys.register({ id: "pk_phone", ownerId: "owner-1", deviceId: "samsung-phone", publicKeyRef: "public-ref-phone", authenticatorAttachment: "platform", userVerification: "required", transports: ["internal"], createdAt: "2026-10-23T18:00:00Z" });
  passkeys.register({ id: "pk_laptop", ownerId: "owner-1", deviceId: "windows-laptop", publicKeyRef: "public-ref-laptop", authenticatorAttachment: "platform", userVerification: "required", transports: ["internal"], createdAt: "2026-10-23T18:01:00Z" });

  assert.equal(passkeys.listByOwner("owner-1").length, 2);
  passkeys.revoke("pk_phone", "2026-10-23T18:10:00Z");
  assert.throws(() => passkeys.recordAssertion("pk_phone", "owner-1", true, "2026-10-23T18:11:00Z"), /revoked/);
  assert.equal(passkeys.recordAssertion("pk_laptop", "owner-1", true, "2026-10-23T18:11:00Z").id, "pk_laptop");
});

test("P2.2 unsupported WebAuthn never silently bypasses verification and fallback requires explicit provider sign-in", async () => {
  let verifyCalled = false;
  const passkeyClient = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: {
      async create() { throw new SupabasePasskeyError("unsupported", "webauthn_not_supported"); },
      async get() { throw new SupabasePasskeyError("unsupported", "webauthn_not_supported"); }
    },
    async fetcher(url) {
      if (String(url).endsWith("/passkeys/authentication/options")) {
        return new Response(JSON.stringify({ challenge_id: "auth", options: { challenge: "AQID", rpId: "command-center.example", userVerification: "required" } }), { status: 200, headers: { "content-type": "application/json" } });
      }
      verifyCalled = true;
      throw new Error("passkey verification must not run after unsupported WebAuthn");
    }
  });

  await assert.rejects(() => passkeyClient.signIn(), (error) => error instanceof SupabasePasskeyError && error.code === "webauthn_not_supported");
  assert.equal(verifyCalled, false);

  const sessions = new AuthSessionStore();
  const auth = new AuthenticationService(sessions);
  auth.registerProvider(activeFallbackProvider());
  assert.equal(sessions.listByOwner("owner-1").length, 0);
  const fallback = auth.signIn("explicit_fallback", { sessionId: "ses_fallback", ownerId: "owner-1", now: "2026-10-23T18:20:00Z", expiresAt: "2026-10-23T20:00:00Z" });
  assert.equal(fallback.state, "active");
  assert.equal(fallback.authProviderId, "explicit_fallback");
});

test("P2.2 passkey metadata rejects biometric templates", () => {
  const passkeys = new PasskeyRegistry();
  assert.throws(() => passkeys.register({ id: "pk_bad", ownerId: "owner-1", publicKeyRef: "public-ref", authenticatorAttachment: "platform", userVerification: "required", transports: ["internal"], createdAt: "2026-10-23T18:00:00Z", biometricTemplate: "must-never-be-stored" }), /biometricTemplate/);
});