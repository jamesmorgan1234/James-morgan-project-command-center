import test from "node:test";
import assert from "node:assert/strict";
import {
  IDENTIFIER_SCHEMA_VERSION,
  LIFECYCLE_VOCABULARY_VERSION,
  MODULE_STATES,
  CAPABILITY_STATES,
  createIdentifier,
  parseIdentifier,
  assertState,
  Registry,
  ModuleRegistry,
  CommandRuntime,
  validateRuntimeConfig
} from "../dist/kernel/index.js";

function moduleContract(overrides = {}) {
  return {
    key: "mod:feature",
    version: 1,
    enabled: true,
    ownsData: ["feature-data"],
    ownsCapabilities: ["feature-capability"],
    dependencies: [],
    permissions: [],
    routes: [],
    events: [],
    migrations: [],
    healthCheckKey: "feature-health",
    securityClass: "internal",
    canDisable: true,
    canUninstall: true,
    ...overrides
  };
}

test("P1 stable typed identifiers carry an explicit identifier schema version and reject invalid identity", () => {
  assert.equal(IDENTIFIER_SCHEMA_VERSION, 1);
  const id = createIdentifier("capability", "project-routing");
  assert.equal(id, "cap_project-routing");
  assert.equal(parseIdentifier(id).kind, "capability");
  assert.throws(() => parseIdentifier("project-routing"), /Invalid canonical identifier/);
});

test("P1 schema compatibility is versioned and rejects unsupported runtime schema versions", () => {
  const base = validateRuntimeConfig({
    environment: "test",
    releaseId: "rel_contract",
    schemaVersion: 3,
    apiVersion: 2,
    compatibleSchema: { min: 2, max: 4 },
    compatibleApi: { min: 2, max: 3 },
    features: {}
  });
  assert.equal(base.schemaVersion, 3);
  assert.throws(() => validateRuntimeConfig({ ...base, schemaVersion: 5 }), /outside compatibleSchema range/);
  assert.throws(() => validateRuntimeConfig({ ...base, schemaVersion: 0 }), /schemaVersion must be a positive safe integer/);
});

test("P1 registry versioning uses optimistic expected-version control and strictly advancing versions", () => {
  const registry = new Registry();
  registry.register({ key: "registry-item", version: 1, enabled: true });
  assert.throws(() => registry.replace({ key: "registry-item", version: 2, enabled: true }, 2), /version conflict/);
  assert.throws(() => registry.replace({ key: "registry-item", version: 1, enabled: true }, 1), /must advance/);
  registry.replace({ key: "registry-item", version: 2, enabled: false }, 1);
  assert.equal(registry.get("registry-item").version, 2);
});

test("P1 command and event envelopes require positive safe version numbers", () => {
  const runtime = new CommandRuntime();
  runtime.register("versioned.command", (command) => [{
    id: "evt_versioned",
    type: "versioned.event",
    version: command.payload.eventVersion,
    correlationId: command.correlationId,
    causationId: command.id,
    payload: {}
  }]);
  const base = { id: "cmd_versioned", type: "versioned.command", version: 2, correlationId: "corr-version", actor: "owner", payload: { eventVersion: 3 } };
  assert.equal(runtime.execute(base)[0].version, 3);
  assert.throws(() => runtime.execute({ ...base, id: "cmd_bad", version: Number.NaN }), /Invalid command version/);
  assert.throws(() => runtime.execute({ ...base, id: "cmd_bad_event", payload: { eventVersion: 0 } }), /Invalid event version/);
});

test("P1 capability and module lifecycle vocabularies are versioned explicit and fail closed on unknown states", () => {
  assert.equal(LIFECYCLE_VOCABULARY_VERSION, 1);
  assert.deepEqual(MODULE_STATES, ["registered", "enabled", "degraded", "disabled", "retired"]);
  assert.deepEqual(CAPABILITY_STATES, ["absent", "dormant", "configured", "connected", "authorized", "enabled", "degraded", "disabled", "retired"]);
  assert.equal(assertState("degraded", MODULE_STATES, "module"), "degraded");
  assert.equal(assertState("authorized", CAPABILITY_STATES, "capability"), "authorized");
  assert.throws(() => assertState("mystery", MODULE_STATES, "module"), /Invalid module state/);
  assert.throws(() => assertState("magic", CAPABILITY_STATES, "capability"), /Invalid capability state/);
});

test("P1 module dependencies are explicit unique existing declarations and cycles fail closed", () => {
  const modules = new ModuleRegistry();
  modules.install(moduleContract({ key: "mod:core", ownsData: ["core"], ownsCapabilities: ["core"], canDisable: false, canUninstall: false }));
  modules.install(moduleContract({ key: "mod:feature", dependencies: ["mod:core"] }));
  assert.deepEqual(modules.get("mod:feature").dependencies, ["mod:core"]);
  assert.throws(() => modules.install(moduleContract({ key: "mod:missing-dep", dependencies: ["mod:not-there"] })), /Unknown module dependency/);
  assert.throws(() => modules.install(moduleContract({ key: "mod:duplicates", dependencies: ["mod:core", "mod:core"] })), /contains duplicate value/);
});

test("P1 install enable disable uninstall contracts enforce module policy and version advancement", () => {
  const modules = new ModuleRegistry();
  modules.install(moduleContract({ key: "mod:optional", enabled: false, version: 1 }));
  const enabled = modules.enable("mod:optional", 1, 2);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.version, 2);
  const disabled = modules.disable("mod:optional", 2, 3);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.version, 3);
  assert.equal(modules.uninstall("mod:optional", 3).key, "mod:optional");

  modules.install(moduleContract({ key: "mod:locked", canDisable: false, canUninstall: false }));
  assert.throws(() => modules.disable("mod:locked", 1, 2), /cannot be disabled/);
  assert.throws(() => modules.replace(moduleContract({ key: "mod:locked", version: 2, enabled: false, canDisable: false, canUninstall: false }), 1), /cannot be disabled/);
  assert.throws(() => modules.uninstall("mod:locked", 1), /cannot be uninstalled/);
});
