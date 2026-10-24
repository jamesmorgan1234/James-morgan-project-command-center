import test from "node:test";
import assert from "node:assert/strict";
import { providerFromDocument } from "../dist/runtime/provider.js";

function fakeDocument(baseURI) {
  const metas = new Map([
    ['meta[name="command-center-supabase-url"]', "https://gmlsucpwliegwlxymjvp.supabase.co"],
    ['meta[name="command-center-supabase-publishable-key"]', "sb_publishable_test_key"],
    ['meta[name="command-center-release"]', "test-release"]
  ]);
  return {
    baseURI,
    querySelector(selector) {
      const content = metas.get(selector);
      return content ? { content } : null;
    }
  };
}

function authSessionPayload() {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    user: { id: "owner-1" }
  };
}

test("Vercel browser origin sends Supabase Auth through same-origin proxy while private REST stays direct", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, method: init.method ?? (input instanceof Request ? input.method : "GET") });
    if (url.includes("/__cc_auth__/token?grant_type=password")) {
      return new Response(JSON.stringify(authSessionPayload()), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.startsWith("https://gmlsucpwliegwlxymjvp.supabase.co/rest/v1/cc7_owner_access")) {
      return new Response(JSON.stringify([{ enabled: true }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  try {
    const provider = providerFromDocument(fakeDocument("https://command-center-preview-alpha.vercel.app/"));
    await provider.signIn("owner@example.com", "password-value");
    assert.equal(calls[0].url, "https://command-center-preview-alpha.vercel.app/__cc_auth__/token?grant_type=password");
    assert.equal(calls[0].method, "POST");
    assert.match(calls[1].url, /^https:\/\/gmlsucpwliegwlxymjvp\.supabase\.co\/rest\/v1\/cc7_owner_access\?/);
    assert.equal(calls[1].method, "GET");
    assert.equal(calls.some((call) => call.url.includes("/__cc_auth__/rest/")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("non-Vercel browser origin keeps Supabase Auth direct", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, method: init.method ?? (input instanceof Request ? input.method : "GET") });
    if (url.startsWith("https://gmlsucpwliegwlxymjvp.supabase.co/auth/v1/token?grant_type=password")) {
      return new Response(JSON.stringify(authSessionPayload()), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.startsWith("https://gmlsucpwliegwlxymjvp.supabase.co/rest/v1/cc7_owner_access")) {
      return new Response(JSON.stringify([{ enabled: true }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  try {
    const provider = providerFromDocument(fakeDocument("https://example.com/"));
    await provider.signIn("owner@example.com", "password-value");
    assert.equal(calls[0].url, "https://gmlsucpwliegwlxymjvp.supabase.co/auth/v1/token?grant_type=password");
    assert.equal(calls[0].method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
