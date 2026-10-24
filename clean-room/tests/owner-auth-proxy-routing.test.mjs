import test from "node:test";
import assert from "node:assert/strict";
import { providerFromDocument } from "../dist/runtime/provider.js";
import { SupabaseOwnerRuntimeSnapshotProvider } from "../dist/runtime/supabase-owner-provider.js";

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

function brokerSessionPayload() {
  return {
    access_token: "broker-access-token",
    expires_at: 4102444800,
    user: { id: "owner-1" }
  };
}

test("Vercel browser origin hands refresh state to same-origin broker while private REST stays direct", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method: init.method ?? (input instanceof Request ? input.method : "GET"), body, credentials: init.credentials });
    if (url.includes("/__cc_auth__/token?grant_type=password")) {
      return new Response(JSON.stringify(authSessionPayload()), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.endsWith("/api/owner-session")) {
      assert.deepEqual(body, { action: "establish", refreshToken: "refresh-token" });
      return new Response(JSON.stringify(brokerSessionPayload()), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.startsWith("https://gmlsucpwliegwlxymjvp.supabase.co/rest/v1/cc7_owner_access")) {
      const headers = new Headers(init.headers);
      assert.equal(headers.get("authorization"), "Bearer broker-access-token");
      return new Response(JSON.stringify([{ enabled: true }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  try {
    const provider = providerFromDocument(fakeDocument("https://command-center-preview-alpha.vercel.app/"));
    await provider.signIn("owner@example.com", "password-value");
    assert.equal(calls[0].url, "https://command-center-preview-alpha.vercel.app/__cc_auth__/token?grant_type=password");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[1].url, "https://command-center-preview-alpha.vercel.app/api/owner-session");
    assert.equal(calls[1].credentials, "same-origin");
    assert.match(calls[2].url, /^https:\/\/gmlsucpwliegwlxymjvp\.supabase\.co\/rest\/v1\/cc7_owner_access\?/);
    assert.equal(calls.some((call) => call.url.includes("/__cc_auth__/rest/")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("non-Vercel browser origin keeps access state ephemeral and never performs browser refresh-token rotation", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const calls = [];
  let persistentStorageTouched = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem() { persistentStorageTouched = true; throw new Error("persistent storage must not be read"); },
      setItem() { persistentStorageTouched = true; throw new Error("persistent storage must not be written"); },
      removeItem() { persistentStorageTouched = true; throw new Error("persistent storage must not be mutated"); }
    }
  });
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
    assert.equal(persistentStorageTouched, false);
    assert.equal(calls.some((call) => call.url.includes("grant_type=refresh_token")), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalLocalStorage });
  }
});

test("direct Supabase owner provider defaults to volatile storage and never touches localStorage", async () => {
  const originalLocalStorage = globalThis.localStorage;
  let persistentStorageTouched = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem() { persistentStorageTouched = true; throw new Error("persistent storage must not be read"); },
      setItem() { persistentStorageTouched = true; throw new Error("persistent storage must not be written"); },
      removeItem() { persistentStorageTouched = true; throw new Error("persistent storage must not be mutated"); }
    }
  });

  const calls = [];
  const fetcher = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, method: init.method ?? (input instanceof Request ? input.method : "GET") });
    if (url.includes("/auth/v1/token?grant_type=password")) {
      return new Response(JSON.stringify(authSessionPayload()), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/rest/v1/cc7_owner_access")) {
      return new Response(JSON.stringify([{ enabled: true }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/auth/v1/logout?scope=local")) return new Response(null, { status: 204 });
    throw new Error(`Unexpected fetch ${url}`);
  };

  try {
    const provider = new SupabaseOwnerRuntimeSnapshotProvider({
      supabaseUrl: "https://gmlsucpwliegwlxymjvp.supabase.co",
      publishableKey: "sb_publishable_test_key",
      fetcher
    });
    await provider.signIn("owner@example.com", "password-value");
    await provider.signOut();
    assert.equal(persistentStorageTouched, false);
    assert.equal(calls.some((call) => call.url.includes("/auth/v1/logout?scope=local")), true);
  } finally {
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalLocalStorage });
  }
});
