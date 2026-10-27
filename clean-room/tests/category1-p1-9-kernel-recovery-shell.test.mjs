import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import {
  RecoveryRetryBudget,
  classifyRecoveryFailure,
  createRecoveryShellPlan,
  validateRuntimeStartupContract
} from "../dist/kernel/index.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P1.9 recovery plans fail closed with privacy-safe diagnostics and no owner-state mutation", () => {
  const secret = "owner-secret-should-never-render";
  const cases = [
    [new Error(`config invalid ${secret}`), "invalid_configuration"],
    [new Error(`schema incompatible ${secret}`), "schema_incompatible"],
    [new Error(`release incompatible ${secret}`), "release_incompatible"],
    [{ arbitrary: secret }, "startup_failed"]
  ];

  for (const [failure, expected] of cases) {
    const code = classifyRecoveryFailure(failure);
    assert.equal(code, expected);
    const plan = createRecoveryShellPlan(code, true);
    assert.equal(plan.mode, "recovery");
    assert.equal(plan.privateDataAllowed, false);
    assert.equal(plan.diagnostic.ownerStateMutationAllowed, false);
    assert.equal(plan.diagnostic.privacySafe, true);
    assert.equal(plan.retryAllowed, true);
    assert.equal(plan.knownGoodFallbackAvailable, true);
    assert.doesNotMatch(plan.message, new RegExp(secret));
  }
});

test("P1.9 injected incompatible schema is classified into recovery before runtime execution", () => {
  let failure;
  try {
    validateRuntimeStartupContract({
      runtime: {
        configVersion: 1,
        environment: "test",
        releaseId: "rel_p1-9",
        schemaVersion: 2,
        apiVersion: 1,
        compatibleSchema: { min: 1, max: 1 },
        compatibleApi: { min: 1, max: 1 },
        features: {}
      }
    });
  } catch (error) {
    failure = error;
  }
  assert.ok(failure instanceof Error);
  const code = classifyRecoveryFailure(failure);
  assert.equal(code, "schema_incompatible");
  assert.equal(createRecoveryShellPlan(code, false).privateDataAllowed, false);
});

test("P1.9 retry budget is bounded and fails closed after exhaustion", () => {
  const budget = new RecoveryRetryBudget(2);
  assert.equal(budget.remaining, 2);
  assert.equal(budget.consume(), 1);
  assert.equal(budget.consume(), 2);
  assert.equal(budget.remaining, 0);
  assert.throws(() => budget.consume(), /budget exhausted/);
});

test("P1.9 browser recovery and startup wiring never render raw exception payloads", async () => {
  const recovery = await source("src/runtime/browser-recovery.ts");
  const startup = await source("src/runtime/browser-startup-runtime.ts");
  const entrypoint = await source("src/runtime/browser-entrypoint.ts");

  assert.match(recovery, /Retry startup/);
  assert.match(recovery, /Use last known-good release/);
  assert.doesNotMatch(recovery, /error\.message|error\.stack|event\.reason|innerHTML/);
  assert.match(startup, /renderRecovery\(classifyRecoveryFailure\(error\)\)/);
  assert.match(startup, /renderRecovery\("startup_failed"\)/);
  assert.doesNotMatch(startup, /event\.error|event\.reason|stack/);
  assert.ok(entrypoint.indexOf("installBrowserStartupBoundary()") < entrypoint.indexOf('import("./browser.js")'));
});

class MemoryCache {
  constructor() { this.values = new Map(); }
  key(request, options = {}) {
    const raw = typeof request === "string" ? request : request.url;
    const parsed = new URL(raw, "https://cc.test");
    return options.ignoreSearch ? parsed.pathname : `${parsed.pathname}${parsed.search}`;
  }
  async addAll(paths) { for (const path of paths) this.values.set(this.key(path), new Response(`cached:${path}`)); }
  async put(request, response) { this.values.set(this.key(request), response.clone()); }
  async match(request, options) {
    const response = this.values.get(this.key(request, options));
    return response?.clone();
  }
}

async function serviceWorkerHarness() {
  const handlers = new Map();
  const stores = new Map();
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, new MemoryCache()); return stores.get(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      for (const cache of stores.values()) {
        const found = await cache.match(request);
        if (found) return found;
      }
      return undefined;
    }
  };
  const networkRequests = [];
  const fetcher = async (request) => {
    const url = typeof request === "string" ? request : request.url;
    networkRequests.push(url);
    return new Response(`network:${url}`, { status: 200 });
  };
  const self = {
    location: { origin: "https://cc.test" },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(type, handler) { handlers.set(type, handler); }
  };
  const code = await source("public/sw.js");
  vm.runInNewContext(code, { self, caches, fetch: fetcher, Response, URL, Date, Promise, Set, console });

  async function dispatch(type, event) {
    const pending = [];
    const full = { ...event, waitUntil(value) { pending.push(Promise.resolve(value)); } };
    handlers.get(type)(full);
    await Promise.all(pending);
    return full;
  }
  return { handlers, stores, caches, networkRequests, dispatch };
}

test("P1.9 service worker exposes known-good query/restore without routing protected owner traffic through fallback", async () => {
  const harness = await serviceWorkerHarness();
  await harness.dispatch("install", {});
  const prior = await harness.caches.open("command-center-shell:rel_known-good");
  await prior.put("/__cc-release-meta__", new Response(JSON.stringify({ releaseId: "rel_known-good", installedAt: 10, knownGoodAt: 10 })));
  await prior.put("/index.html", new Response("known-good-index"));
  await prior.put("/app/runtime/browser.js", new Response("known-good-browser"));
  await harness.dispatch("activate", {});

  async function message(data) {
    let result;
    await harness.dispatch("message", { data, ports: [{ postMessage(value) { result = value; } }] });
    return result;
  }

  assert.equal((await message({ type: "QUERY_KNOWN_GOOD" })).ok, true);
  assert.equal((await message({ type: "RESTORE_KNOWN_GOOD" })).ok, true);

  let fallbackResponse;
  harness.handlers.get("fetch")({
    request: { method: "GET", url: "https://cc.test/app/runtime/browser.js", mode: "same-origin" },
    respondWith(value) { fallbackResponse = Promise.resolve(value); }
  });
  assert.equal(await (await fallbackResponse).text(), "known-good-browser");

  let protectedResponse;
  harness.handlers.get("fetch")({
    request: { method: "GET", url: "https://cc.test/api/private-owner-state", mode: "same-origin" },
    respondWith(value) { protectedResponse = Promise.resolve(value); }
  });
  assert.match(await (await protectedResponse).text(), /^network:/);
  assert.ok(harness.networkRequests.some((url) => url.includes("/api/private-owner-state")));
});

test("P1.9 known-good service-worker contract freezes the good cache and keeps explicit update recovery", async () => {
  const sw = await source("public/sw.js");
  for (const protocol of ["QUERY_KNOWN_GOOD", "RESTORE_KNOWN_GOOD", "MARK_RELEASE_KNOWN_GOOD", "ACTIVATE_UPDATE"]) assert.match(sw, new RegExp(protocol));
  assert.match(sw, /knownGoodReleaseId !== RELEASE_ID/);
  assert.match(sw, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(sw, /pathname\.startsWith\("\/__cc_auth__\/"\)/);
  assert.match(sw, /pathname\.startsWith\("\/auth\/"\)/);
  assert.match(sw, /url\.pathname === "\/release\.json" && url\.searchParams\.has\("candidate"\)/);
  assert.match(sw, /\/app\/kernel\/trusted-environment\.mjs/);
});
