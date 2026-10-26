import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/owner-session.mjs";

const ENV_KEYS = [
  "CC_ENVIRONMENT",
  "CC_SUPABASE_URL",
  "CC_SUPABASE_PROJECT_REF",
  "CC_SUPABASE_PUBLISHABLE_KEY",
  "CC_BACKEND_CLASSIFICATION",
  "CC_AUTH_ISSUER",
  "CC_AUTH_AUDIENCE",
  "CC_CONFIGURATION_DIGEST"
];

async function withEnv(values, fn) {
  const before = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  try { return await fn(); }
  finally {
    for (const key of ENV_KEYS) {
      const value = before.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function makeRequest(body = { action: "establish", refreshToken: "refresh-token" }) {
  return {
    method: "POST",
    headers: {
      origin: "https://preview.example.test",
      host: "preview.example.test",
      "sec-fetch-site": "same-origin"
    },
    body
  };
}

function makeResponse() {
  const state = { statusCode: 200, body: undefined, ended: false, headers: new Map() };
  const res = {
    setHeader(name, value) { state.headers.set(String(name).toLowerCase(), value); },
    status(code) { state.statusCode = code; return res; },
    json(value) { state.body = value; return value; },
    end() { state.ended = true; return undefined; }
  };
  return { res, state };
}

function jwt(claims) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}.test-signature`;
}

function providerPayload(baseUrl, userId = "owner-1") {
  return {
    access_token: jwt({
      iss: `${baseUrl}/auth/v1`,
      aud: "authenticated",
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 3600
    }),
    refresh_token: "rotated-refresh-token",
    expires_in: 3600,
    user: { id: userId }
  };
}

test("non-production owner-session rejects protected production backend before network access", async () => {
  await withEnv({
    CC_ENVIRONMENT: "staging",
    CC_SUPABASE_URL: "https://gmlsucpwliegwlxymjvp.supabase.co",
    CC_SUPABASE_PROJECT_REF: "gmlsucpwliegwlxymjvp",
    CC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key"
  }, async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error("network must not be reached"); };
    try {
      const { res, state } = makeResponse();
      await handler(makeRequest(), res);
      assert.equal(state.statusCode, 503);
      assert.deepEqual(state.body, { error: "identity_provider_configuration_unavailable" });
      assert.equal(calls, 0);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test("isolated test backend is validated and config identity is emitted before session establishment", async () => {
  const baseUrl = "https://isolatedtestref.supabase.co";
  await withEnv({
    CC_ENVIRONMENT: "test",
    CC_SUPABASE_URL: baseUrl,
    CC_SUPABASE_PROJECT_REF: "isolatedtestref",
    CC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    CC_BACKEND_CLASSIFICATION: "isolated"
  }, async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, init });
      return new Response(JSON.stringify(providerPayload(baseUrl)), { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
      const { res, state } = makeResponse();
      await handler(makeRequest(), res);
      assert.equal(state.statusCode, 200);
      assert.equal(state.body.user.id, "owner-1");
      assert.match(String(state.headers.get("x-command-center-config-digest") ?? ""), /^[a-f0-9]{64}$/);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, `${baseUrl}/auth/v1/token?grant_type=refresh_token`);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test("project-ref mismatch and pinned configuration-digest mismatch fail before provider fetch", async () => {
  for (const env of [
    {
      CC_ENVIRONMENT: "test",
      CC_SUPABASE_URL: "https://actualref.supabase.co",
      CC_SUPABASE_PROJECT_REF: "differentref",
      CC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
      CC_BACKEND_CLASSIFICATION: "isolated"
    },
    {
      CC_ENVIRONMENT: "test",
      CC_SUPABASE_URL: "https://isolatedtestref.supabase.co",
      CC_SUPABASE_PROJECT_REF: "isolatedtestref",
      CC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
      CC_BACKEND_CLASSIFICATION: "isolated",
      CC_CONFIGURATION_DIGEST: "0".repeat(64)
    }
  ]) {
    await withEnv(env, async () => {
      const originalFetch = globalThis.fetch;
      let calls = 0;
      globalThis.fetch = async () => { calls += 1; throw new Error("network must not be reached"); };
      try {
        const { res, state } = makeResponse();
        await handler(makeRequest(), res);
        assert.equal(state.statusCode, 503);
        assert.equal(calls, 0);
      } finally { globalThis.fetch = originalFetch; }
    });
  }
});

test("issuer and audience returned by provider must match trusted binding", async () => {
  const baseUrl = "https://isolatedtestref.supabase.co";
  await withEnv({
    CC_ENVIRONMENT: "test",
    CC_SUPABASE_URL: baseUrl,
    CC_SUPABASE_PROJECT_REF: "isolatedtestref",
    CC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    CC_BACKEND_CLASSIFICATION: "isolated"
  }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      ...providerPayload(baseUrl),
      access_token: jwt({ iss: `${baseUrl}/auth/v1`, aud: "wrong-audience", sub: "owner-1", exp: Math.floor(Date.now() / 1000) + 3600 })
    }), { status: 200, headers: { "content-type": "application/json" } });
    try {
      const { res, state } = makeResponse();
      await handler(makeRequest(), res);
      assert.equal(state.statusCode, 502);
      assert.deepEqual(state.body, { error: "invalid_identity_provider_session" });
    } finally { globalThis.fetch = originalFetch; }
  });
});

test("protected production backend is eligible only when deployment itself is production", async () => {
  const baseUrl = "https://gmlsucpwliegwlxymjvp.supabase.co";
  await withEnv({
    CC_ENVIRONMENT: "production",
    CC_SUPABASE_URL: baseUrl,
    CC_SUPABASE_PROJECT_REF: "gmlsucpwliegwlxymjvp",
    CC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    CC_BACKEND_CLASSIFICATION: "protected-production"
  }, async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify(providerPayload(baseUrl)), { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
      const { res, state } = makeResponse();
      await handler(makeRequest(), res);
      assert.equal(state.statusCode, 200);
      assert.equal(calls, 1);
    } finally { globalThis.fetch = originalFetch; }
  });
});
