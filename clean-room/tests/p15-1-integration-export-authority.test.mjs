import test from "node:test";
import assert from "node:assert/strict";
import { PortabilityCenter, ProviderRegistry, RESTRICTED_DATA_EXPORT_SCOPE } from "../dist/data/index.js";

const providerKey = "provider:integration-export";
const scope = { ownerId: "owner-1", projectId: "command-center" };

function provider(overrides = {}) {
  return {
    key: providerKey,
    version: 1,
    enabled: true,
    authMode: "oauth",
    capabilities: ["read"],
    scopes: ["data:read"],
    freshnessSeconds: 60,
    cost: "free",
    health: "available",
    verification: "tool_result",
    failureMode: "fail_closed",
    ...overrides
  };
}

function record(id, sensitivity) {
  return {
    id,
    entityType: "artifact",
    version: 1,
    contentHash: `${id}-hash`,
    sensitivity,
    provenanceRefs: [`source:${id}`],
    data: { id }
  };
}

const records = [record("internal-1", "internal"), record("sensitive-1", "sensitive")];

function authorization() {
  return {
    authorized: true,
    ownerDecisionRef: "decision:ccr-01529",
    scope,
    encrypted: true,
    encryptionKeyRef: "sec_export_encryption_key",
    allowedSensitivities: ["sensitive"]
  };
}

function integration(providerVersion, key = providerKey) {
  return { providerKey: key, providerVersion };
}

test("P15.1 CCR-01529 integration read scope does not grant export authority", () => {
  const registry = new ProviderRegistry();
  registry.register(provider());
  const center = new PortabilityCenter(registry);

  assert.deepEqual(registry.forCapability("read").map((item) => item.key), [providerKey]);
  assert.throws(
    () => center.export(records, { scope, authorization: authorization(), integration: integration(1) }),
    /scope not granted/
  );
  assert.throws(
    () => new PortabilityCenter().export(records, { scope, authorization: authorization(), integration: integration(1) }),
    /current provider registry/
  );
});

test("P15.1 CCR-01529 current explicit export scope permits only the already-authorized restricted classes", () => {
  const registry = new ProviderRegistry();
  registry.register(provider({ scopes: ["data:read", RESTRICTED_DATA_EXPORT_SCOPE] }));
  const center = new PortabilityCenter(registry);

  const authorized = center.export(records, { scope, authorization: authorization(), integration: integration(1) });
  assert.deepEqual(authorized.records.map((item) => item.id), ["internal-1", "sensitive-1"]);

  const withoutOwnerAuthorization = center.export(records, { scope, integration: integration(1) });
  assert.deepEqual(withoutOwnerAuthorization.records.map((item) => item.id), ["internal-1"]);
  assert.equal(withoutOwnerAuthorization.redactedCount, 1);
});

test("P15.1 CCR-01529 stale mismatched or revoked integration export authority fails closed immediately", () => {
  const registry = new ProviderRegistry();
  registry.register(provider({ scopes: ["data:read", RESTRICTED_DATA_EXPORT_SCOPE] }));
  const center = new PortabilityCenter(registry);

  assert.throws(
    () => center.export(records, { scope, authorization: authorization(), integration: integration(1, "provider:wrong-integration") }),
    /Unknown provider/
  );

  registry.replace(provider({ version: 2, scopes: ["data:read", RESTRICTED_DATA_EXPORT_SCOPE] }), 1);
  assert.throws(
    () => center.export(records, { scope, authorization: authorization(), integration: integration(1) }),
    /version conflict/
  );
  assert.equal(center.export(records, { scope, authorization: authorization(), integration: integration(2) }).recordCount, 2);

  registry.replace(provider({ version: 3, scopes: ["data:read"] }), 2);
  assert.deepEqual(registry.forCapability("read").map((item) => item.key), [providerKey]);
  assert.throws(
    () => center.export(records, { scope, authorization: authorization(), integration: integration(3) }),
    /scope not granted/
  );
  assert.throws(
    () => center.export(records, { scope, authorization: authorization(), integration: integration(2) }),
    /version conflict/
  );

  registry.remove(providerKey, 3);
  assert.throws(
    () => center.export(records, { scope, authorization: authorization(), integration: integration(3) }),
    /Unknown provider/
  );
});
