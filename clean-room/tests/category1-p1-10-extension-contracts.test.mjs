import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createCoreArchitectureResponsibilityRegistry, ModuleRegistry } from "../dist/kernel/index.js";
import { ProjectTypeRegistry } from "../dist/projects/registry.js";
import { RuntimeSnapshotProviderRegistry } from "../dist/runtime/provider-registry.js";

function sampleModule() {
  return {
    key: "mod:p1-10-sample",
    version: 1,
    enabled: true,
    owner: "p1-10-test",
    ownsData: ["data:p1-10-sample"],
    ownsCapabilities: ["capability:p1-10-sample"],
    usesData: [],
    usesCapabilities: [],
    dependencies: [],
    permissions: [],
    routes: [],
    events: [],
    migrations: [],
    healthCheckKey: "health:p1-10-sample",
    securityClass: "internal",
    activation: "manual",
    failureBehavior: "isolate",
    canDisable: true,
    canUninstall: true,
    tests: ["category1-p1-10-extension-contracts"]
  };
}

function sampleProjectType() {
  return {
    key: "project-type:p1-10-sample",
    version: 1,
    label: "P1.10 sample project type",
    capabilities: ["capability:p1-10-sample"],
    requiredDetailSections: ["roadmap"],
    domainPlaybookKey: "playbook:p1-10-sample"
  };
}

test("P1.10 keeps a single owner for startup, router, renderer, and scroll", () => {
  const owners = createCoreArchitectureResponsibilityRegistry();
  for (const responsibility of ["startup", "router", "renderer", "scroll"]) {
    assert.ok(owners.get(responsibility)?.owner);
  }
  assert.throws(() => owners.register({
    responsibility: "router",
    owner: "competing-router",
    truthSource: "test",
    expandable: false,
    critical: false,
    failureBehavior: "reject",
    verificationPath: "p1.10 test"
  }), /already has an owner/i);
});

test("P1.10 sample module, provider, and project type install and remove without cross-registry mutation", () => {
  const modules = new ModuleRegistry();
  const providers = new RuntimeSnapshotProviderRegistry();
  const projectTypes = new ProjectTypeRegistry();

  const moduleContract = sampleModule();
  const provider = { id: "runtime:p1-10-sample", async load() { throw new Error("sample provider is never executed"); } };
  const projectType = sampleProjectType();

  modules.install(moduleContract);
  assert.deepEqual(modules.list().map((entry) => entry.key), [moduleContract.key]);
  assert.equal(providers.size, 0);
  assert.equal(projectTypes.list().length, 0);

  providers.install(provider);
  assert.deepEqual(providers.list().map((entry) => entry.id), [provider.id]);
  assert.deepEqual(modules.list().map((entry) => entry.key), [moduleContract.key]);
  assert.equal(projectTypes.list().length, 0);

  projectTypes.register(projectType);
  assert.deepEqual(projectTypes.list().map((entry) => entry.key), [projectType.key]);
  assert.deepEqual(providers.list().map((entry) => entry.id), [provider.id]);
  assert.deepEqual(modules.list().map((entry) => entry.key), [moduleContract.key]);

  assert.equal(projectTypes.remove(projectType.key, 1).key, projectType.key);
  assert.equal(providers.uninstall(provider.id).id, provider.id);
  assert.equal(modules.uninstall(moduleContract.key, 1).key, moduleContract.key);

  assert.equal(projectTypes.list().length, 0);
  assert.equal(providers.size, 0);
  assert.equal(modules.list().length, 0);
});

test("P1.10 extension removal fails closed for unknown or unsafe removals", () => {
  const modules = new ModuleRegistry();
  const providers = new RuntimeSnapshotProviderRegistry();
  const projectTypes = new ProjectTypeRegistry();

  assert.throws(() => providers.remove("runtime:missing"), /Unknown runtime provider/);
  assert.throws(() => projectTypes.remove("project-type:missing", 1), /Unknown project type/);

  const locked = { ...sampleModule(), key: "mod:p1-10-locked", canUninstall: false };
  modules.install(locked);
  assert.throws(() => modules.uninstall(locked.key, 1), /cannot be uninstalled/i);

  const provider = { id: "runtime:p1-10-duplicate", async load() { throw new Error("not executed"); } };
  providers.install(provider);
  assert.throws(() => providers.install(provider), /already installed/i);
});

test("P1.10 architecture source policy passes the clean-room source and rejects representative patch patterns", async () => {
  const script = fileURLToPath(new URL("../scripts/check-architecture-contracts.mjs", import.meta.url));
  const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
  const live = spawnSync(process.execPath, [script, sourceRoot], { encoding: "utf8" });
  assert.equal(live.status, 0, live.stderr || live.stdout);
  assert.match(live.stdout, /no prohibited runtime patch patterns/i);

  const scratch = await mkdtemp(join(tmpdir(), "cc-p1-10-"));
  try {
    await writeFile(join(scratch, "bad.ts"), "HTMLElement.prototype.render = () => {};\ndocument.write('patch');\n", "utf8");
    const blocked = spawnSync(process.execPath, [script, scratch], { encoding: "utf8" });
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /Architecture source violation detected:/);
    assert.match(blocked.stderr, /native prototype assignment/);
    assert.match(blocked.stderr, /document.write runtime patch/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
