import test from "node:test";
import assert from "node:assert/strict";
import { CapabilityRegistry } from "../dist/kernel/index.js";

function capability(overrides = {}) {
  return {
    key: "capability:dummy",
    version: 1,
    enabled: false,
    inputVersion: 1,
    outputVersion: 1,
    compatibleInputVersions: [1],
    compatibleOutputVersions: [1],
    maturity: "local",
    criticalShared: false,
    securityClass: "internal",
    canPin: true,
    canFork: true,
    ...overrides
  };
}

test("P1.2 capability fabric registers discovers enables disables and unregisters an extensible capability", () => {
  const registry = new CapabilityRegistry();
  registry.register(capability());

  assert.equal(registry.has("capability:dummy"), true);
  assert.equal(registry.get("capability:dummy").enabled, false);
  assert.deepEqual(registry.list().map((item) => item.key), ["capability:dummy"]);
  assert.throws(() => registry.assertCompatible("capability:dummy", 1, 1), /Capability unavailable/);

  const enabled = registry.enable("capability:dummy", 1, 2);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.version, 2);
  assert.equal(registry.assertCompatible("capability:dummy", 1, 1).key, "capability:dummy");

  const disabled = registry.disable("capability:dummy", 2, 3);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.version, 3);

  const removed = registry.unregister("capability:dummy", 3);
  assert.equal(removed.key, "capability:dummy");
  assert.equal(registry.has("capability:dummy"), false);
  assert.equal(registry.get("capability:dummy"), undefined);
});

test("P1.2 capability registry fails closed on duplicate invalid and stale lifecycle mutations", () => {
  const registry = new CapabilityRegistry();
  registry.register(capability());

  assert.throws(() => registry.register(capability()), /Registry key already exists/);
  assert.throws(() => registry.enable("capability:dummy", 99, 2), /version conflict/);
  assert.throws(() => registry.unregister("capability:dummy", 99), /version conflict/);

  const invalid = new CapabilityRegistry();
  assert.throws(() => invalid.register(capability({ key: "dummy" })), /Capability key must start with capability:/);
  assert.throws(() => invalid.register(capability({ key: "capability:bad-input", compatibleInputVersions: [] })), /Current inputVersion must be compatible/);
});

test("P1.2 capability discovery is data driven rather than hard coded to one capability key", () => {
  const registry = new CapabilityRegistry();
  registry.register(capability({ key: "capability:alpha" }));
  registry.register(capability({ key: "capability:beta" }));
  registry.register(capability({ key: "capability:gamma" }));

  assert.deepEqual(registry.list().map((item) => item.key).sort(), [
    "capability:alpha",
    "capability:beta",
    "capability:gamma"
  ]);
});
