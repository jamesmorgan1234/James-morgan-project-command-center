import test from "node:test";
import assert from "node:assert/strict";
import { ModuleRegistry, validateModuleContract } from "../dist/kernel/index.js";

function moduleContract(overrides = {}) {
  return {
    key: "mod:example",
    version: 1,
    enabled: false,
    owner: "command-center",
    ownsData: [],
    ownsCapabilities: [],
    usesData: [],
    usesCapabilities: [],
    dependencies: [],
    permissions: [],
    routes: [],
    events: [],
    migrations: [],
    healthCheckKey: "health:example",
    securityClass: "internal",
    activation: "manual",
    failureBehavior: "fail-closed",
    canDisable: true,
    canUninstall: true,
    tests: ["tests/category1-p1-3-module-ownership-lifecycle.test.mjs"],
    ...overrides
  };
}

test("P1.3 module contracts require explicit ownership lifecycle failure and verification declarations", () => {
  assert.doesNotThrow(() => validateModuleContract(moduleContract()));
  assert.throws(() => validateModuleContract(moduleContract({ owner: "" })), /Module owner is required/);
  assert.throws(() => validateModuleContract(moduleContract({ activation: "implicit" })), /Invalid module activation policy/);
  assert.throws(() => validateModuleContract(moduleContract({ failureBehavior: "ignore" })), /Invalid module failure behavior/);
  assert.throws(() => validateModuleContract(moduleContract({ tests: [] })), /Module tests are required/);
});

test("P1.3 registry rejects duplicate ownership and hidden or unknown cross-module reach-in", () => {
  const registry = new ModuleRegistry();
  registry.register(moduleContract({
    key: "mod:owner",
    enabled: true,
    ownsData: ["data:owner"],
    ownsCapabilities: ["capability:owner"]
  }));

  assert.throws(() => registry.register(moduleContract({
    key: "mod:duplicate-owner",
    ownsData: ["data:owner"]
  })), /data ownership conflict/);

  assert.throws(() => registry.register(moduleContract({
    key: "mod:hidden-reach-in",
    usesData: ["data:owner"]
  })), /Hidden cross-module data reach-in/);

  assert.throws(() => registry.register(moduleContract({
    key: "mod:unknown-reach-in",
    usesCapabilities: ["capability:missing"]
  })), /Unknown module capability reach-in/);
});

test("P1.3 declared dependency permits only explicitly declared cross-module data and capability access", () => {
  const registry = new ModuleRegistry();
  registry.register(moduleContract({
    key: "mod:owner",
    enabled: true,
    ownsData: ["data:owner"],
    ownsCapabilities: ["capability:owner"]
  }));
  registry.register(moduleContract({
    key: "mod:consumer",
    enabled: true,
    dependencies: ["mod:owner"],
    usesData: ["data:owner"],
    usesCapabilities: ["capability:owner"]
  }));

  assert.doesNotThrow(() => registry.assertDataAccess("mod:consumer", "data:owner"));
  assert.doesNotThrow(() => registry.assertCapabilityAccess("mod:consumer", "capability:owner"));
  assert.throws(() => registry.assertDataAccess("mod:consumer", "data:not-declared"), /Undeclared cross-module data reach-in/);
  assert.throws(() => registry.assertCapabilityAccess("mod:consumer", "capability:not-declared"), /Undeclared cross-module capability reach-in/);
});

test("P1.3 activation fails closed when dependencies are disabled and prevents disabling an active dependency", () => {
  const registry = new ModuleRegistry();
  registry.register(moduleContract({
    key: "mod:owner",
    enabled: false,
    ownsData: ["data:owner"]
  }));
  registry.register(moduleContract({
    key: "mod:consumer",
    enabled: false,
    dependencies: ["mod:owner"],
    usesData: ["data:owner"]
  }));

  assert.throws(() => registry.enable("mod:consumer", 1, 2), /Enabled module dependency is not enabled/);
  registry.enable("mod:owner", 1, 2);
  registry.enable("mod:consumer", 1, 2);
  assert.throws(() => registry.disable("mod:owner", 2, 3), /Enabled module dependency is not enabled/);
});

test("P1.3 dependency cycles are rejected on lifecycle contract replacement", () => {
  const registry = new ModuleRegistry();
  registry.register(moduleContract({ key: "mod:a" }));
  registry.register(moduleContract({ key: "mod:b", dependencies: ["mod:a"] }));

  assert.throws(() => registry.replace(moduleContract({
    key: "mod:a",
    version: 2,
    dependencies: ["mod:b"]
  }), 1), /Module dependency cycle detected/);
});
