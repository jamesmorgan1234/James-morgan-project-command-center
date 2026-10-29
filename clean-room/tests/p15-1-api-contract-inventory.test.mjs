import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  CURRENT_RUNTIME_API_VERSION,
  CURRENT_RUNTIME_CONFIG_VERSION,
  CURRENT_RUNTIME_SCHEMA_VERSION,
  SUPPORTED_RUNTIME_API_RANGE,
  SUPPORTED_RUNTIME_SCHEMA_RANGE,
  validateVersionedRuntimeConfig
} from "../dist/kernel/index.js";
import {
  FIRST_PARTY_API_CONTRACTS,
  getFirstPartyApiContract,
  validateFirstPartyApiContract
} from "../dist/runtime/index.js";

function runtimeConfig(overrides = {}) {
  return {
    configVersion: CURRENT_RUNTIME_CONFIG_VERSION,
    environment: "test",
    releaseId: "rel_p15_api_contract",
    schemaVersion: CURRENT_RUNTIME_SCHEMA_VERSION,
    apiVersion: CURRENT_RUNTIME_API_VERSION,
    compatibleSchema: { ...SUPPORTED_RUNTIME_SCHEMA_RANGE },
    compatibleApi: { ...SUPPORTED_RUNTIME_API_RANGE },
    features: {},
    ...overrides
  };
}

test("P15.1 first-party API inventory declares only the runtime-supported v1 contract set", () => {
  assert.equal(CURRENT_RUNTIME_SCHEMA_VERSION, 1);
  assert.equal(CURRENT_RUNTIME_API_VERSION, 1);
  assert.deepEqual(SUPPORTED_RUNTIME_SCHEMA_RANGE, { min: 1, max: 1 });
  assert.deepEqual(SUPPORTED_RUNTIME_API_RANGE, { min: 1, max: 1 });
  assert.deepEqual(FIRST_PARTY_API_CONTRACTS.map((entry) => entry.key), ["runtime-snapshot-read", "owner-session"]);
  for (const contract of FIRST_PARTY_API_CONTRACTS) {
    assert.equal(contract.version, 1);
    assert.deepEqual(contract.compatibleApi, { min: 1, max: 1 });
    assert.equal(contract.pagination, "none");
    assert.equal(contract.correlation, "none");
    assert.equal(contract.retryPolicy, "none");
    assert.equal(contract.timeoutMs, 8000);
  }
});

test("P15.1 versioned startup fails closed on internally consistent unsupported API or schema versions", () => {
  assert.equal(validateVersionedRuntimeConfig(runtimeConfig()).apiVersion, 1);
  assert.throws(
    () => validateVersionedRuntimeConfig(runtimeConfig({ apiVersion: 2, compatibleApi: { min: 2, max: 2 } })),
    /Unsupported apiVersion 2; supported range is 1-1/
  );
  assert.throws(
    () => validateVersionedRuntimeConfig(runtimeConfig({ schemaVersion: 2, compatibleSchema: { min: 2, max: 2 } })),
    /Unsupported schemaVersion 2; supported range is 1-1/
  );
});

test("P15.1 first-party local API handlers cannot appear without a contract inventory entry", async () => {
  const entries = await readdir(new URL("../api/", import.meta.url), { withFileTypes: true });
  const localHandlers = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mjs"))
    .map((entry) => `/api/${entry.name.slice(0, -4)}`)
    .sort();
  const inventoriedHandlers = FIRST_PARTY_API_CONTRACTS
    .map((entry) => entry.binding)
    .filter((binding) => binding.startsWith("/api/"))
    .sort();
  assert.deepEqual(inventoriedHandlers, localHandlers);
});

test("P15.1 runtime and owner-session contracts stay bound to their implemented transport behavior", async () => {
  const [providerSource, ownerSessionSource] = await Promise.all([
    readFile(new URL("../src/runtime/provider.ts", import.meta.url), "utf8"),
    readFile(new URL("../api/owner-session.mjs", import.meta.url), "utf8")
  ]);
  const runtime = getFirstPartyApiContract("runtime-snapshot-read");
  assert.equal(runtime.binding, "startup-meta:command-center-runtime-endpoint");
  assert.deepEqual(runtime.methods, ["GET"]);
  assert.equal(runtime.responseSchema, "cc-runtime-snapshot-v1");
  assert.match(providerSource, /command-center-runtime-endpoint/);
  assert.match(providerSource, /method:\s*"GET"/);
  assert.match(providerSource, /cache:\s*"no-store"/);
  assert.match(providerSource, /credentials:\s*"same-origin"/);
  assert.match(providerSource, /DEFAULT_RUNTIME_REQUEST_TIMEOUT_MS\s*=\s*8_?000/);

  const ownerSession = getFirstPartyApiContract("owner-session");
  assert.equal(ownerSession.binding, "/api/owner-session");
  assert.deepEqual(ownerSession.methods, ["POST"]);
  assert.equal(ownerSession.access, "session-control");
  assert.deepEqual(ownerSession.capabilities, ["owner-session:establish", "owner-session:refresh", "owner-session:clear"]);
  assert.match(ownerSessionSource, /request\.method\s*!==\s*"POST"/);
  assert.match(ownerSessionSource, /"establish"/);
  assert.match(ownerSessionSource, /"refresh"/);
  assert.match(ownerSessionSource, /"clear"/);
  assert.match(ownerSessionSource, /8_?000/);
});

test("P15.1 API contract validation rejects unsupported versions and duplicate capability declarations", () => {
  const runtime = getFirstPartyApiContract("runtime-snapshot-read");
  assert.throws(
    () => validateFirstPartyApiContract({ ...runtime, version: 2, compatibleApi: { min: 2, max: 2 } }),
    /Unsupported API contract version 2; supported range is 1-1/
  );
  assert.throws(
    () => validateFirstPartyApiContract({ ...runtime, capabilities: ["runtime-snapshot:read", "runtime-snapshot:read"] }),
    /capabilities must not contain duplicates/
  );
  assert.throws(() => getFirstPartyApiContract("missing-contract"), /Unknown first-party API contract/);
});
