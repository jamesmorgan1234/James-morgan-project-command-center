import test from "node:test";
import assert from "node:assert/strict";
import {
  createIdentifier,
  parseIdentifier,
  assertIdentifierKind,
  Registry,
  ModuleRegistry,
  CommandRuntime,
  StateMachine,
  evaluateGovernance,
  VersionedLedger,
  evidenceMeets,
  assertCompletionEvidence,
  createCheckpoint,
  validateRuntimeConfig,
  decideStartup,
  assertNoLegacyRuntimeImports,
  assertSingleOwners
} from "../dist/kernel/index.js";

test("canonical identifiers are deterministic and typed", () => {
  const id = createIdentifier("project", "Edge-Finder");
  assert.equal(id, "prj_edge-finder");
  assert.deepEqual(parseIdentifier(id), { kind: "project", prefix: "prj", token: "edge-finder", value: id });
  assert.equal(assertIdentifierKind(id, "project"), id);
  assert.throws(() => assertIdentifierKind(id, "asset"));
  assert.throws(() => createIdentifier("project", "bad token!"));
});

test("generic registry enforces uniqueness and optimistic version replacement", () => {
  const registry = new Registry();
  registry.register({ key: "one", version: 1, enabled: true });
  assert.equal(registry.size, 1);
  assert.throws(() => registry.register({ key: "one", version: 1, enabled: true }));
  assert.throws(() => registry.replace({ key: "one", version: 2, enabled: false }, 2));
  registry.replace({ key: "one", version: 2, enabled: false }, 1);
  assert.equal(registry.get("one").enabled, false);
  assert.throws(() => registry.remove("one", 1));
  registry.remove("one", 2);
  assert.equal(registry.size, 0);
});

test("module registry blocks unknown dependencies, cycles, and removal with dependents", () => {
  const modules = new ModuleRegistry();
  modules.register({ key: "mod:core", version: 1, enabled: true, ownsData: ["core"], ownsCapabilities: ["kernel"], dependencies: [], permissions: [], routes: [], events: [], migrations: [], healthCheckKey: "core", securityClass: "internal", canDisable: false, canUninstall: false });
  modules.register({ key: "mod:projects", version: 1, enabled: true, ownsData: ["projects"], ownsCapabilities: ["project-registry"], dependencies: ["mod:core"], permissions: [], routes: ["/projects"], events: [], migrations: [], healthCheckKey: "projects", securityClass: "sensitive", canDisable: true, canUninstall: true });
  assert.throws(() => modules.remove("mod:core", 1));
  assert.throws(() => modules.register({ key: "mod:bad", version: 1, enabled: true, ownsData: [], ownsCapabilities: [], dependencies: ["mod:missing"], permissions: [], routes: [], events: [], migrations: [], healthCheckKey: "bad", securityClass: "internal", canDisable: true, canUninstall: true }));
  modules.remove("mod:projects", 1);
  assert.equal(modules.list().length, 1);
});

test("command runtime provides idempotent duplicate protection", () => {
  const runtime = new CommandRuntime();
  runtime.register("project.rename", (command) => [{ id: "evt_rename-1", type: "project.renamed", version: 1, correlationId: command.correlationId, causationId: command.id, payload: command.payload }]);
  const command = { id: "cmd_rename-1", type: "project.rename", version: 1, correlationId: "corr-1", idempotencyKey: "same-request", actor: "owner", payload: { name: "Torevi" } };
  const first = runtime.execute(command);
  const second = runtime.execute({ ...command, id: "cmd_rename-2" });
  assert.equal(first[0].sequence, 1);
  assert.strictEqual(first, second);
});

test("state machine rejects invalid transitions", () => {
  const machine = new StateMachine([{ from: "queued", event: "claim", to: "working" }, { from: "working", event: "verify", to: "verified" }]);
  assert.equal(machine.next("queued", "claim"), "working");
  assert.throws(() => machine.next("queued", "verify"));
});

test("governance enforces newest instruction, free-first, and protected authorization", () => {
  assert.equal(evaluateGovernance({ ownerId: "owner", newestInstructionAllows: false, freeFirst: true, introducesCost: false, action: "read", now: "2026-10-23T18:00:00Z" }).allowed, false);
  assert.equal(evaluateGovernance({ ownerId: "owner", newestInstructionAllows: true, freeFirst: true, introducesCost: true, action: "local_reversible_write", now: "2026-10-23T18:00:00Z" }).allowed, false);
  assert.equal(evaluateGovernance({ ownerId: "owner", newestInstructionAllows: true, freeFirst: true, introducesCost: false, action: "deploy_production", now: "2026-10-23T18:00:00Z" }).allowed, false);
  assert.equal(evaluateGovernance({ ownerId: "owner", newestInstructionAllows: true, freeFirst: true, introducesCost: false, action: "deploy_production", projectId: "command-center", authorization: { ownerId: "owner", action: "deploy_production", projectId: "command-center", authorizedAt: "2026-10-23T17:59:00Z", expiresAt: "2026-10-23T18:01:00Z" }, now: "2026-10-23T18:00:00Z" }).allowed, true);
});

test("ledger requires explicit supersession for a new current entry", () => {
  const ledger = new VersionedLedger();
  ledger.append({ id: "rul_one", version: 1, scope: "global", state: "current", sourceRef: "owner-1", effectiveAt: "2026-10-01T00:00:00Z", value: { freeFirst: true } });
  assert.throws(() => ledger.append({ id: "rul_two", version: 2, scope: "global", state: "current", sourceRef: "owner-2", effectiveAt: "2026-10-02T00:00:00Z", value: { freeFirst: false } }));
  ledger.append({ id: "rul_two", version: 2, scope: "global", state: "current", sourceRef: "owner-2", effectiveAt: "2026-10-02T00:00:00Z", supersedes: "rul_one", value: { freeFirst: false } });
  assert.equal(ledger.current("global").id, "rul_two");
  assert.equal(ledger.history("global")[0].state, "superseded");
});

test("completion and checkpoints require verified evidence", () => {
  const evidence = [{ id: "evd_one", subjectId: "phase-1", strength: "tool_result", sourceRef: "test", recordedAt: "2026-10-23T18:00:00Z", verified: true }];
  assert.equal(evidenceMeets(evidence[0], "recorded"), true);
  assertCompletionEvidence(evidence, "phase-1", "tool_result");
  assert.throws(() => assertCompletionEvidence(evidence, "phase-2", "tool_result"));
  assert.equal(createCheckpoint({ id: "chk_one", subjectId: "phase-1", summary: "verified", exactNextAction: "phase-2", evidenceIds: ["evd_one"], createdAt: "2026-10-23T18:00:00Z" }).exactNextAction, "phase-2");
});

test("runtime configuration fails closed on incompatible versions", () => {
  const valid = validateRuntimeConfig({ environment: "test", releaseId: "rel_test", schemaVersion: 1, apiVersion: 1, compatibleSchema: { min: 1, max: 1 }, compatibleApi: { min: 1, max: 1 }, features: { agency: false } });
  assert.equal(valid.releaseId, "rel_test");
  assert.throws(() => validateRuntimeConfig({ ...valid, schemaVersion: 2 }));
  assert.equal(decideStartup({ configValid: true, schemaCompatible: true, releaseCompatible: true, knownGoodReleaseAvailable: true }).mode, "normal");
  assert.equal(decideStartup({ configValid: true, schemaCompatible: false, releaseCompatible: true, knownGoodReleaseAvailable: true }).mode, "recovery");
});

test("clean-room invariants reject legacy imports and multiple owners", () => {
  assertNoLegacyRuntimeImports(["./kernel/index.js", "@command-center/contracts"]);
  assert.throws(() => assertNoLegacyRuntimeImports(["../legacy/agent.js"]));
  assertSingleOwners({ startup: ["kernel"], router: ["application-shell"] });
  assert.throws(() => assertSingleOwners({ renderer: ["old", "new"] }));
});
