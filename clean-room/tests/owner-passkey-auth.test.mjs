import test from "node:test";
import assert from "node:assert/strict";
import { establishOwnerPasskeySession, ownerPasskeyAvailability } from "../dist/runtime/owner-passkey-auth.js";
import { SupabasePasskeyError } from "../dist/security/supabase-passkeys.js";

function fakeDocument(baseURI) {
  const metas = new Map([
    ['meta[name="command-center-supabase-url"]', "https://gmlsucpwliegwlxymjvp.supabase.co"],
    ['meta[name="command-center-supabase-publishable-key"]', "sb_publishable_test_key"]
  ]);
  return {
    baseURI,
    querySelector(selector) {
      const content = metas.get(selector);
      return content ? { content } : null;
    }
  };
}

function bytes(...values) { return new Uint8Array(values).buffer; }

function assertionCredential() {
  return {
    id: "owner-passkey-one",
    type: "public-key",
    authenticatorAttachment: "platform",
    response: {
      authenticatorData: bytes(1, 2, 3),
      clientDataJSON: bytes(4, 5, 6),
      signature: bytes(7, 8, 9),
      userHandle: bytes(10)
    },
    getClientExtensionResults() { return {}; }
  };
}

const credentials = {
  async create() { throw new Error("registration is not used by owner sign-in"); },
  async get() { return assertionCredential(); }
};

test("owner passkey sign-in verifies through same-origin auth proxy and hands refresh state to HttpOnly broker", async () => {
  const documentRef = fakeDocument("https://command-center-preview-alpha.vercel.app/");
  const calls = [];
  const fetcher = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method: init.method ?? "GET", body, credentials: init.credentials });
    if (url.endsWith("/__cc_auth__/passkeys/authentication/options")) {
      return new Response(JSON.stringify({ challenge_id: "pk-challenge", options: { challenge: "AQID", rpId: "command-center-preview-alpha.vercel.app", userVerification: "required" } }), { status: 200 });
    }
    if (url.endsWith("/__cc_auth__/passkeys/authentication/verify")) {
      return new Response(JSON.stringify({ access_token: "transient-passkey-access", refresh_token: "transient-passkey-refresh", expires_in: 3600, user: { id: "owner-1" } }), { status: 200 });
    }
    if (url.endsWith("/api/owner-session")) {
      assert.deepEqual(body, { action: "establish", refreshToken: "transient-passkey-refresh" });
      return new Response(JSON.stringify({ access_token: "broker-access", expires_at: 4102444800, user: { id: "owner-1" } }), { status: 200 });
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  assert.deepEqual(ownerPasskeyAvailability(documentRef, credentials), { supported: true });
  await establishOwnerPasskeySession({ documentRef, fetcher, credentials });

  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, "https://command-center-preview-alpha.vercel.app/__cc_auth__/passkeys/authentication/options");
  assert.equal(calls[1].url, "https://command-center-preview-alpha.vercel.app/__cc_auth__/passkeys/authentication/verify");
  assert.equal(calls[2].url, "https://command-center-preview-alpha.vercel.app/api/owner-session");
  assert.equal(calls[2].credentials, "same-origin");
});

test("owner passkey sign-in fails closed when the secure broker origin is unavailable", async () => {
  const documentRef = fakeDocument("https://example.com/");
  let called = false;
  assert.deepEqual(ownerPasskeyAvailability(documentRef, credentials), { supported: false, reason: "secure_broker_unavailable" });
  await assert.rejects(
    () => establishOwnerPasskeySession({ documentRef, credentials, async fetcher() { called = true; throw new Error("must not run"); } }),
    (error) => error instanceof SupabasePasskeyError && error.code === "secure_broker_unavailable"
  );
  assert.equal(called, false);
});
