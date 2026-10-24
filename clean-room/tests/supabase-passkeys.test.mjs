import test from "node:test";
import assert from "node:assert/strict";
import { SupabasePasskeyClient, SupabasePasskeyError } from "../dist/security/index.js";

const AUTH_BASE = "https://command-center.example/__cc_auth__";
const KEY = "sb_publishable_test_key";
const ACCESS = "owner-access-token";

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function bytes(...values) {
  return new Uint8Array(values).buffer;
}

function registrationCredential(attachment = "platform") {
  return {
    id: "credential-registration-1",
    type: "public-key",
    authenticatorAttachment: attachment,
    response: {
      attestationObject: bytes(1, 2, 3),
      clientDataJSON: bytes(4, 5)
    },
    getClientExtensionResults() { return {}; }
  };
}

function authenticationCredential(attachment = "platform") {
  return {
    id: "credential-authentication-1",
    type: "public-key",
    authenticatorAttachment: attachment,
    response: {
      authenticatorData: bytes(7, 8, 9),
      clientDataJSON: bytes(10, 11),
      signature: bytes(12, 13),
      userHandle: bytes(14)
    },
    getClientExtensionResults() { return {}; }
  };
}

test("Supabase passkey registration forces platform UV even if provider options are weaker", async () => {
  const calls = [];
  let createOptions;
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: {
      async create(options) { createOptions = options; return registrationCredential(); },
      async get() { throw new Error("not used"); }
    },
    async fetcher(url, init) {
      calls.push({ url: String(url), init, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (String(url).endsWith("/passkeys/registration/options")) {
        return json({
          challenge_id: "registration-challenge",
          options: {
            challenge: "AQID",
            rp: { id: "command-center.example", name: "Command Center" },
            user: { id: "BAUG", name: "owner@example.com", displayName: "Command Center Owner" },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: { authenticatorAttachment: "cross-platform", residentKey: "discouraged", userVerification: "discouraged" }
          }
        });
      }
      if (String(url).endsWith("/passkeys/registration/verify")) {
        return json({ id: "pk-one", friendly_name: "Google Password Manager", created_at: "2026-10-24T01:00:00Z" });
      }
      throw new Error(`unexpected URL ${url}`);
    }
  });

  const registered = await client.register(ACCESS);
  assert.deepEqual(registered, { id: "pk-one", friendlyName: "Google Password Manager", createdAt: "2026-10-24T01:00:00Z" });
  assert.deepEqual([...new Uint8Array(createOptions.publicKey.challenge)], [1, 2, 3]);
  assert.deepEqual([...new Uint8Array(createOptions.publicKey.user.id)], [4, 5, 6]);
  assert.equal(createOptions.publicKey.authenticatorSelection.authenticatorAttachment, "platform");
  assert.equal(createOptions.publicKey.authenticatorSelection.residentKey, "required");
  assert.equal(createOptions.publicKey.authenticatorSelection.userVerification, "required");

  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.headers.authorization, `Bearer ${ACCESS}`);
  assert.equal(calls[1].init.headers.authorization, `Bearer ${ACCESS}`);
  assert.equal(calls[1].body.challenge_id, "registration-challenge");
  assert.equal(calls[1].body.credential.id, "credential-registration-1");
  assert.equal(calls[1].body.credential.rawId, "credential-registration-1");
  assert.equal(calls[1].body.credential.response.attestationObject, "AQID");
  assert.equal(calls[1].body.credential.response.clientDataJSON, "BAU");
  assert.equal(calls[1].body.credential.authenticatorAttachment, "platform");
  const serialized = JSON.stringify(calls[1].body);
  assert.equal(serialized.includes("privateKey"), false);
  assert.equal(serialized.includes("biometric"), false);
  assert.equal(serialized.includes("fingerprint"), false);
});

test("discoverable passkey sign-in forces user verification and returns a normalized session", async () => {
  const calls = [];
  let getOptions;
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: {
      async create() { throw new Error("not used"); },
      async get(options) { getOptions = options; return authenticationCredential(); }
    },
    async fetcher(url, init) {
      calls.push({ url: String(url), init, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (String(url).endsWith("/passkeys/authentication/options")) {
        return json({ challenge_id: "authentication-challenge", options: { challenge: "BwgJ", rpId: "command-center.example", userVerification: "discouraged" } });
      }
      if (String(url).endsWith("/passkeys/authentication/verify")) {
        return json({
          access_token: "access-after-passkey",
          refresh_token: "refresh-after-passkey",
          expires_in: 3600,
          token_type: "bearer",
          user: { id: "owner-one", email: "owner@example.com" }
        });
      }
      throw new Error(`unexpected URL ${url}`);
    }
  });

  const signedIn = await client.signIn({ mediation: "conditional" });
  assert.equal(getOptions.mediation, "conditional");
  assert.deepEqual([...new Uint8Array(getOptions.publicKey.challenge)], [7, 8, 9]);
  assert.equal(getOptions.publicKey.userVerification, "required");
  assert.equal(signedIn.session.accessToken, "access-after-passkey");
  assert.equal(signedIn.session.refreshToken, "refresh-after-passkey");
  assert.equal(signedIn.session.expiresIn, 3600);
  assert.equal(signedIn.user.id, "owner-one");

  assert.equal(calls[0].init.headers.authorization, undefined);
  assert.deepEqual(calls[0].body, { gotrue_meta_security: {} });
  assert.equal(calls[1].body.challenge_id, "authentication-challenge");
  assert.equal(calls[1].body.credential.response.authenticatorData, "BwgJ");
  assert.equal(calls[1].body.credential.response.clientDataJSON, "Cgs");
  assert.equal(calls[1].body.credential.response.signature, "DA0");
  assert.equal(calls[1].body.credential.response.userHandle, "Dg");
});

test("passkey client rejects a reported cross-platform authenticator", async () => {
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: {
      async create() { return registrationCredential("cross-platform"); },
      async get() { return authenticationCredential("cross-platform"); }
    },
    async fetcher(url) {
      if (String(url).endsWith("/passkeys/registration/options")) return json({ challenge_id: "reg", options: { challenge: "AQID", rp: { id: "command-center.example", name: "Command Center" }, user: { id: "BAUG", name: "owner@example.com", displayName: "Owner" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }] } });
      if (String(url).endsWith("/passkeys/authentication/options")) return json({ challenge_id: "auth", options: { challenge: "BwgJ", rpId: "command-center.example" } });
      throw new Error("verify must not be called");
    }
  });

  await assert.rejects(() => client.register(ACCESS), (error) => error instanceof SupabasePasskeyError && error.code === "webauthn_platform_required");
  await assert.rejects(() => client.signIn(), (error) => error instanceof SupabasePasskeyError && error.code === "webauthn_platform_required");
});

test("passkey management is owner-session authenticated and supports list, rename, and delete", async () => {
  const calls = [];
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: { async create() { return null; }, async get() { return null; } },
    async fetcher(url, init) {
      calls.push({ url: String(url), init, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (init.method === "GET") return json([{ id: "pk-one", friendly_name: "Phone", created_at: "2026-10-24T01:00:00Z", last_used_at: "2026-10-24T01:30:00Z" }]);
      if (init.method === "PATCH") return json({ id: "pk-one", friendly_name: "Samsung phone", created_at: "2026-10-24T01:00:00Z", last_used_at: "2026-10-24T01:30:00Z" });
      if (init.method === "DELETE") return new Response(null, { status: 204 });
      throw new Error(`unexpected method ${init.method}`);
    }
  });

  const listed = await client.list(ACCESS);
  assert.deepEqual(listed, [{ id: "pk-one", friendlyName: "Phone", createdAt: "2026-10-24T01:00:00Z", lastUsedAt: "2026-10-24T01:30:00Z" }]);
  const renamed = await client.rename(ACCESS, "pk-one", "Samsung phone");
  assert.equal(renamed.friendlyName, "Samsung phone");
  await client.remove(ACCESS, "pk-one");

  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.init.headers.authorization === `Bearer ${ACCESS}`));
  assert.deepEqual(calls[1].body, { friendly_name: "Samsung phone" });
});

test("passkey API surfaces Supabase error codes truthfully", async () => {
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: { async create() { return null; }, async get() { return null; } },
    async fetcher() { return json({ error_code: "passkey_disabled", msg: "Passkeys are disabled" }, 400); }
  });

  await assert.rejects(
    () => client.signIn(),
    (error) => error instanceof SupabasePasskeyError && error.code === "passkey_disabled" && error.status === 400 && error.message === "Passkeys are disabled"
  );
});

test("passkey ceremony fails closed when browser returns no public-key credential", async () => {
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: { async create() { return null; }, async get() { return null; } },
    async fetcher(url) {
      if (String(url).endsWith("/passkeys/authentication/options")) return json({ challenge_id: "challenge", options: { challenge: "AQID", rpId: "command-center.example", userVerification: "required" } });
      throw new Error("verify must not be called");
    }
  });

  await assert.rejects(
    () => client.signIn(),
    (error) => error instanceof SupabasePasskeyError && error.code === "webauthn_ceremony_failed"
  );
});

test("passkey friendly names are bounded before any network mutation", async () => {
  let called = false;
  const client = new SupabasePasskeyClient({
    authBaseUrl: AUTH_BASE,
    publishableKey: KEY,
    credentials: { async create() { return null; }, async get() { return null; } },
    async fetcher() { called = true; throw new Error("must not run"); }
  });

  await assert.rejects(() => client.rename(ACCESS, "pk-one", "x".repeat(121)), /between 1 and 120/);
  assert.equal(called, false);
});
