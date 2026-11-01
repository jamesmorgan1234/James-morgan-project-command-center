import test from "node:test";
import assert from "node:assert/strict";
import {
  ToolRegistry,
  SecurityActionRegistry,
  DeploymentTargetRegistry,
  VoiceProviderRegistry,
  projectTypeTemplate,
  agentCapabilityTemplate
} from "../dist/kernel/index.js";

const entry = (key, overrides = {}) => ({ key, version: 1, enabled: true, ...overrides });

test("P1.2 tool registry requires a declared capability and risk class", () => {
  const registry = new ToolRegistry();
  const tool = registry.register(entry("read-projects", { capabilityKeys: ["projects.read"], risk: "low" }));
  assert.equal(tool.key, "read-projects");
  assert.equal(registry.size, 1);
  assert.throws(() => registry.register(entry("read-projects", { capabilityKeys: ["projects.read"], risk: "low" })), /already exists/);
  assert.throws(() => registry.register(entry("no-capability", { capabilityKeys: [], risk: "low" })), /declared capability/);
  assert.throws(() => registry.register(entry("bad-risk", { capabilityKeys: ["x"], risk: "extreme" })), /supported risk class/);
  assert.throws(() => registry.register(entry("bad-version", { version: 0, capabilityKeys: ["x"], risk: "low" })), /positive safe integer/);
});

test("P1.2 security action registry requires approval for protected actions", () => {
  const registry = new SecurityActionRegistry();
  assert.doesNotThrow(() => registry.register(entry("revoke-session", { protectedAction: true, requiresApproval: true })));
  assert.doesNotThrow(() => registry.register(entry("view-audit", { protectedAction: false, requiresApproval: false })));
  assert.throws(() => registry.register(entry("delete-account", { protectedAction: true, requiresApproval: false })), /require approval/);
});

test("P1.2 deployment target registry requires authorization for production", () => {
  const registry = new DeploymentTargetRegistry();
  assert.doesNotThrow(() => registry.register(entry("preview", { environment: "preview", productionAuthorizationRequired: false })));
  assert.doesNotThrow(() => registry.register(entry("production", { environment: "production", productionAuthorizationRequired: true })));
  assert.throws(() => registry.register(entry("prod-unsafe", { environment: "production", productionAuthorizationRequired: false })), /explicit authorization/);
  assert.throws(() => registry.register(entry("moon", { environment: "moon", productionAuthorizationRequired: false })), /supported environment/);
});

test("P1.2 voice provider registry preserves availability and permission state", () => {
  const registry = new VoiceProviderRegistry();
  assert.doesNotThrow(() => registry.register(entry("web-speech", { available: true, permission: "granted" })));
  assert.doesNotThrow(() => registry.register(entry("native-speech", { available: false, permission: "denied" })));
  assert.throws(() => registry.register(entry("unknown-permission", { available: true, permission: "maybe" })), /supported permission state/);
});

test("P1.2 project type templates declare required sections and capabilities", () => {
  const template = projectTypeTemplate({ key: "software-platform", requiredSections: ["roadmap", "releases"], capabilityKeys: ["projects.write"] });
  assert.equal(template.version, 1);
  assert.deepEqual([...template.requiredSections], ["roadmap", "releases"]);
  assert.throws(() => projectTypeTemplate({ key: "empty", requiredSections: [], capabilityKeys: ["x"] }), /declared sections/);
  assert.throws(() => projectTypeTemplate({ key: "no-capability", requiredSections: ["roadmap"], capabilityKeys: [] }), /declared capabilities/);
});

test("P1.2 agent capability templates declare capabilities and risk", () => {
  const template = agentCapabilityTemplate({ key: "project-reader", capabilityKeys: ["projects.read"], risk: "low" });
  assert.equal(template.version, 1);
  assert.equal(template.risk, "low");
  assert.throws(() => agentCapabilityTemplate({ key: "no-capability", capabilityKeys: [], risk: "low" }), /declared capabilities/);
  assert.throws(() => agentCapabilityTemplate({ key: "bad-risk", capabilityKeys: ["x"], risk: "extreme" }), /supported risk class/);
});
