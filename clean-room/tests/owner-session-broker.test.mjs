import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/owner-session.mjs";

const ORIGIN = "https://command-center-preview-alpha.vercel.app";
const HOST = "command-center-preview-alpha.vercel.app";
const PROJECT_REF = "test-command-center";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const KEY = "sb_publishable_test_key";

function request(body, extraHeaders = {}) {
  return {
    method: "POST",
    headers: {
      origin: ORIGIN,
      host: HOST,
      "sec-fetch-site": "same-origin",
      ...extraHeaders
    },
    body
  };
}

function response() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; this.ended = true; return this; },
    end() { this.ended = true; return this; }
  };
}

function tokenPayload(suffix = "one") {
  return {
    access_token: `access-${suffix}`,
    refresh_token: `refresh-${suffix}`,
    expires_in: 3600,
    user: { id: "owner-1", email: "owner@example.com" }
  };
}

function withServerIdentityConfig() {
  const prior = {
    environment: process.env.CC_ENVIRONMENT,
    url: process.env.CC_SUPABASE_URL,
    ref: process.env.CC_SUPABASE_PROJECT_REF,
    key: process.env.CC_SUPABASE_PUBLISHABLE_KEY
  };
  process.env.CC_ENVIRONMENT = "test";
  process.env.CC_SUPABASE_URL = SUPABASE_URL;
  process.env.CC_SUPABASE_PROJECT_REF = PROJECT_REF;
  process.env.CC_SUPABASE_PUBLISHABLE_KEY = KEY;
  return () => {
    for (const [name, value] of [["CC_ENVIRONMENT", prior.environment], ["CC_SUPABASE_URL", prior.url], ["CC_SUPABASE_PROJECT_REF", prior.ref], ["CC_SUPABASE_PUBLISHABLE_KEY", prior.key]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  };
}

test("owner session broker rotates the refresh token into an HttpOnly host cookie and never returns it to JavaScript", async () => {
  const originalFetch = globalThis.fetch;
  const restoreConfig = withServerIdentityConfig();
  const upstreamCalls = [];
  globalThis.fetch = async (url, init) => {
    upstreamCalls.push({ url: String(url), init, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify(tokenPayload("rotated")), { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const req = request({ action: "establish", refreshToken: "initial-refresh-token" });
    const res = response();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(upstreamCalls.length, 1);
    assert.match(upstreamCalls[0].url, new RegExp(`^${SUPABASE_URL.replaceAll(".", "\\.")}\\/auth\\/v1\\/token\\?grant_type=refresh_token$`));
    assert.deepEqual(upstreamCalls[0].body, { refresh_token: "initial-refresh-token" });
    assert.equal(upstreamCalls[0].init.headers.apikey, KEY);

    const cookie = String(res.getHeader("set-cookie"));
    assert.match(cookie, /^__Host-cc-owner-refresh=refresh-rotated;/);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Max-Age=604800/);

    assert.equal(res.body.access_token, "access-rotated");
    assert.equal(res.body.user.id, "owner-1");
    assert.equal("refresh_token" in res.body, false);
    assert.equal(JSON.stringify(res.body).includes("refresh-rotated"), false);
    assert.equal(res.getHeader("cache-control"), "no-store, max-age=0");
  } finally {
    globalThis.fetch = originalFetch;
    restoreConfig();
  }
});

test("owner session broker refreshes only from the HttpOnly cookie and sign-out clears and revokes it", async () => {
  const originalFetch = globalThis.fetch;
  const restoreConfig = withServerIdentityConfig();
  const upstreamCalls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: String(url), init, body: init.body ? JSON.parse(String(init.body)) : undefined };
    upstreamCalls.push(call);
    if (call.url.includes("grant_type=refresh_token")) {
      return new Response(JSON.stringify(tokenPayload("next")), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (call.url.includes("/auth/v1/logout?scope=local")) return new Response("{}", { status: 200 });
    throw new Error(`Unexpected upstream ${call.url}`);
  };

  try {
    const refreshRes = response();
    await handler(request({ action: "refresh" }, { cookie: "__Host-cc-owner-refresh=refresh-cookie-value" }), refreshRes);
    assert.equal(refreshRes.statusCode, 200);
    assert.deepEqual(upstreamCalls[0].body, { refresh_token: "refresh-cookie-value" });
    assert.equal(upstreamCalls[0].init.headers.apikey, KEY);
    assert.equal("refresh_token" in refreshRes.body, false);
    assert.match(String(refreshRes.getHeader("set-cookie")), /^__Host-cc-owner-refresh=refresh-next;/);

    upstreamCalls.length = 0;
    const clearRes = response();
    await handler(request({ action: "clear" }, { cookie: "__Host-cc-owner-refresh=refresh-next" }), clearRes);
    assert.equal(clearRes.statusCode, 204);
    assert.equal(clearRes.ended, true);
    assert.equal(upstreamCalls.length, 2);
    assert.match(upstreamCalls[0].url, /grant_type=refresh_token/);
    assert.match(upstreamCalls[1].url, /\/auth\/v1\/logout\?scope=local$/);
    assert.equal(upstreamCalls[1].init.headers.authorization, "Bearer access-next");
    assert.match(String(clearRes.getHeader("set-cookie")), /Max-Age=0/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreConfig();
  }
});

test("owner session broker rejects cross-origin requests before contacting Supabase", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("must not run"); };
  try {
    const req = request({ action: "refresh" }, { origin: "https://attacker.example", "sec-fetch-site": "cross-site" });
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "same_origin_required" });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
