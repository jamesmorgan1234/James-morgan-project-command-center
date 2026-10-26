import test from "node:test";
import assert from "node:assert/strict";
import { ModuleRegistry } from "../dist/kernel/index.js";

function moduleContract(overrides = {}) {
  return {
    key: "mod:alpha",
    version: 1,
    enabled: true,
    ownsData: ["alpha-data"],
    ownsCapabilities: ["alpha-capability"],
    dependencies: [],
    permissions: [],
    routes: [],
    events: [],
    migrations: [],
    healthCheckKey: "alpha-health",
    securityClass: "internal",
    canDisable: true,
    canUninstall: true,
    ...overrides
  };
}

test("P1 module isolation rejects duplicate canonical data and capability ownership without partial registration", () => {
  const modules = new ModuleRegistry();
  modules.install(moduleContract());

  assert.throws(() => modules.install(moduleContract({
    key: "mod:data-conflict",
    ownsData: ["alpha-data"],
    ownsCapabilities: ["other-capability"],
    healthCheckKey: "data-conflict-health"
  })), /Module data ownership conflict/);
  assert.equal(modules.get("mod:data-conflict"), undefined);

  assert.throws(() => modules.install(moduleContract({
    key: "mod:capability-conflict",
    ownsData: ["other-data"],
    ownsCapabilities: ["alpha-capability"],
    healthCheckKey: "capability-conflict-health"
  })), /Module capability ownership conflict/);
  assert.equal(modules.get("mod:capability-conflict"), undefined);
  assert.deepEqual(modules.list().map((module) => module.key), ["mod:alpha"]);
});

test("P1 module registry contains failed cyclic replacement and preserves the last valid record", () => {
  const modules = new ModuleRegistry();
  modules.install(moduleContract({ key: "mod:core", ownsData: ["core-data"], ownsCapabilities: ["core-capability"], healthCheckKey: "core-health" }));
  modules.install(moduleContract({ key: "mod:feature", ownsData: ["feature-data"], ownsCapabilities: ["feature-capability"], dependencies: ["mod:core"], healthCheckKey: "feature-health" }));

  assert.throws(() => modules.replace(moduleContract({
    key: "mod:core",
    version: 2,
    ownsData: ["core-data"],
    ownsCapabilities: ["core-capability"],
    dependencies: ["mod:feature"],
    healthCheckKey: "core-health"
  }), 1), /Module dependency cycle detected/);

  assert.equal(modules.get("mod:core").version, 1);
  assert.deepEqual(modules.get("mod:core").dependencies, []);
  assert.deepEqual(modules.get("mod:feature").dependencies, ["mod:core"]);
});
