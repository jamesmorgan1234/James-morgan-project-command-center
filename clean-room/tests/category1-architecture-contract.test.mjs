import test from "node:test";
import assert from "node:assert/strict";
import {
  ArchitectureResponsibilityRegistry,
  CORE_ARCHITECTURE_RESPONSIBILITIES,
  createCoreArchitectureResponsibilityRegistry
} from "../dist/kernel/index.js";

function contract(overrides = {}) {
  return {
    responsibility: "example",
    owner: "example-owner",
    truthSource: "example truth",
    expandable: true,
    extensionPath: "example registry",
    critical: true,
    recoveryPath: "example recovery",
    failureBehavior: "fail closed",
    verificationPath: "example tests",
    ...overrides
  };
}

test("P1 architecture inventory assigns exactly one owner and one truth source to every core responsibility", () => {
  const registry = createCoreArchitectureResponsibilityRegistry();
  registry.assertCoreCoverage();
  assert.equal(registry.list().length, CORE_ARCHITECTURE_RESPONSIBILITIES.length);
  for (const responsibility of CORE_ARCHITECTURE_RESPONSIBILITIES) {
    const item = registry.get(responsibility);
    assert.ok(item, responsibility);
    assert.ok(item.owner.trim(), responsibility);
    assert.ok(item.truthSource.trim(), responsibility);
    assert.ok(item.failureBehavior.trim(), responsibility);
    assert.ok(item.verificationPath.trim(), responsibility);
  }
});

test("P1 duplicate architectural ownership is rejected instead of becoming competing authority", () => {
  const registry = new ArchitectureResponsibilityRegistry();
  registry.register(contract());
  assert.throws(() => registry.register(contract({ owner: "competing-owner" })), /already has an owner/);
});

test("P1 every declared expandable subsystem requires a defined extension path", () => {
  const registry = createCoreArchitectureResponsibilityRegistry();
  for (const item of registry.list()) {
    if (item.expandable) assert.ok(item.extensionPath?.trim(), item.responsibility);
  }
  assert.throws(() => new ArchitectureResponsibilityRegistry().register(contract({ extensionPath: "" })), /extensionPath is required/);
});

test("P1 architecture contracts reject missing truth ownership failure or verification semantics", () => {
  const registry = new ArchitectureResponsibilityRegistry();
  assert.throws(() => registry.register(contract({ owner: "" })), /owner is required/);
  assert.throws(() => registry.register(contract({ truthSource: "" })), /truthSource is required/);
  assert.throws(() => registry.register(contract({ failureBehavior: "" })), /failureBehavior is required/);
  assert.throws(() => registry.register(contract({ verificationPath: "" })), /verificationPath is required/);
});

test("P1 core architecture coverage fails closed when even one responsibility is absent", () => {
  const registry = new ArchitectureResponsibilityRegistry();
  registry.register(contract({ responsibility: "startup", expandable: false, extensionPath: undefined }));
  assert.throws(() => registry.assertCoreCoverage(), /Missing architectural responsibility contracts/);
});
