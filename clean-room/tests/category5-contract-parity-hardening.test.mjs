import test from "node:test";
import assert from "node:assert/strict";
import {
  ProjectTypeRegistry,
  ProjectRegistry,
  ProjectLineageLedger,
  validateRoadmap,
  discoverDuplicateSignals,
  assertOwnerGovernedCandidateDecision,
  validatePrototypeFeedback,
  validateRecoveryPlan
} from "../dist/projects/index.js";

const T0 = "2026-10-25T12:00:00Z";
const T1 = "2026-10-25T12:01:00Z";
const T2 = "2026-10-25T12:02:00Z";

function softwareTypes() {
  const types = new ProjectTypeRegistry();
  types.register({
    key: "project-type:software",
    version: 1,
    label: "Software",
    capabilities: ["build", "deploy"],
    requiredDetailSections: ["snapshot", "roadmap"],
    domainPlaybookKey: "playbook:software"
  });
  return types;
}

function project(id = "p1", overrides = {}) {
  return {
    id,
    typeKey: "project-type:software",
    ownerId: "owner-1",
    companyId: "company-1",
    name: `Project ${id}`,
    mission: "Build a verified project system",
    lifecycle: "active",
    status: "building",
    verification: "verified",
    priority: "normal",
    version: 1,
    createdAt: T0,
    updatedAt: T0,
    agentAccessEnabled: false,
    portfolioAutoEnabled: false,
    protected: false,
    ...overrides
  };
}

test("P5.1 runtime project type contract matches durable key and array constraints", () => {
  const types = new ProjectTypeRegistry();
  assert.throws(() => types.register({ key: "project-type:Bad Key", version: 1, label: "Bad", capabilities: [], requiredDetailSections: [], domainPlaybookKey: "playbook:bad" }), /Invalid project type key/);
  assert.throws(() => types.register({ key: "project-type:blank-capability", version: 1, label: "Bad", capabilities: [""], requiredDetailSections: [], domainPlaybookKey: "playbook:bad" }), /cannot be blank/);
  assert.throws(() => types.register({ key: "project-type:duplicate-section", version: 1, label: "Bad", capabilities: [], requiredDetailSections: ["snapshot", "snapshot"], domainPlaybookKey: "playbook:bad" }), /must be unique/);
});

test("P5.1 referenced project types cannot be removed and canonical status is mandatory", () => {
  const types = softwareTypes();
  types.register({ key: "project-type:unused", version: 1, label: "Unused", capabilities: [], requiredDetailSections: [], domainPlaybookKey: "playbook:unused" });
  assert.equal(types.remove("project-type:unused", 1).key, "project-type:unused");

  const registry = new ProjectRegistry(types);
  registry.create(project());
  assert.throws(() => types.remove("project-type:software", 1), /still referenced/);
  assert.throws(() => registry.create(project("p2", { status: "" })), /status are required/);
});

test("P5.1/P5.2 generic replacement cannot bypass governed identity, authorization, or protected lifecycle seams", () => {
  const types = softwareTypes();
  const registry = new ProjectRegistry(types);
  const original = project();
  registry.create(original);

  assert.throws(() => registry.replace({ ...original, name: "Renamed without lineage", version: 2, updatedAt: T1 }, 1), /governed lineage/);
  assert.throws(() => registry.replace({ ...original, mission: "Changed without lineage", version: 2, updatedAt: T1 }, 1), /governed lineage/);
  assert.throws(() => registry.replace({ ...original, agentAccessEnabled: true, version: 2, updatedAt: T1 }, 1), /governed authorization/);
  assert.throws(() => registry.replace({ ...original, lifecycle: "archived", version: 2, updatedAt: T1 }, 1), /governed recovery\/lineage/);

  registry.replace({ ...original, lifecycle: "paused", status: "paused", verification: "partial", version: 2, updatedAt: T1 }, 1);
  assert.equal(registry.get("p1")?.version, 2);
  assert.equal(registry.get("p1")?.lifecycle, "paused");
});

test("P5.2 lineage replay is deterministic by occurredAt even when historical events arrive out of order", () => {
  const ledger = new ProjectLineageLedger();
  ledger.append({ id: "created", projectId: "p1", kind: "created", occurredAt: T0, evidenceRefs: ["source:create"] });
  ledger.append({ id: "rename-late", projectId: "p1", kind: "renamed", occurredAt: T2, ownerDecisionRef: "owner:late", fromName: "Middle", toName: "Newest", evidenceRefs: ["source:late"] });
  ledger.append({ id: "rename-early", projectId: "p1", kind: "renamed", occurredAt: T1, ownerDecisionRef: "owner:early", fromName: "Original", toName: "Middle", evidenceRefs: ["source:early"] });

  assert.deepEqual(ledger.history("p1").map((event) => event.id), ["created", "rename-early", "rename-late"]);
  assert.equal(ledger.currentName("p1", "Original"), "Newest");
});

test("P5.3 roadmap runtime rejects evidence-free satisfied gates and malformed list contracts", () => {
  const base = {
    projectId: "p1",
    version: 1,
    workUnits: [{ id: "w1", categoryId: "c1", phaseId: "p1", title: "One", status: "planned", applicable: true, dependencyIds: [], gateIds: ["g1"], acceptanceCriteria: ["done"] }],
    gates: [{ id: "g1", satisfied: true, evidenceRefs: [] }]
  };
  assert.throws(() => validateRoadmap(base), /Satisfied roadmap gate requires evidence/);
  assert.throws(() => validateRoadmap({ ...base, gates: [{ id: "g1", satisfied: false, evidenceRefs: [] }], workUnits: [{ ...base.workUnits[0], acceptanceCriteria: ["done", "done"] }] }), /must be unique/);
  assert.throws(() => validateRoadmap({ ...base, gates: [{ id: "g1", satisfied: false, evidenceRefs: [] }], workUnits: [{ ...base.workUnits[0], acceptanceCriteria: [""] }] }), /cannot be blank/);
});

test("P5.10 discovery requires nonblank unique provenance and disposition-specific target semantics", () => {
  const projects = [{ projectId: "p1", name: "Existing", mission: "automated clipping for live video into short clips" }];
  assert.throws(() => discoverDuplicateSignals({ id: "c1", proposedName: "Candidate", mission: "automated clipping for live video", sourceRefs: [""] }, projects), /cannot be blank/);
  assert.throws(() => discoverDuplicateSignals({ id: "c1", proposedName: "Candidate", mission: "automated clipping for live video", sourceRefs: ["chat", "chat"] }, projects), /must be unique/);
  assert.throws(() => discoverDuplicateSignals({ id: "c1", proposedName: "Candidate", mission: "automated clipping for live video", sourceRefs: ["chat"] }, projects, 1.1), /between 0 and 1/);
  assert.throws(() => assertOwnerGovernedCandidateDecision({ candidateId: "c1", disposition: "park", ownerDecisionRef: "owner:decision", targetProjectId: "p1" }), /Only merge disposition/);
});

test("P5.13 prototype feedback must remain inside the prototype requirement lineage", () => {
  const prototype = { id: "proto:1", projectId: "p1", specVersion: 2, requirementRefs: ["req:one"], protectedDesignAssetRefs: ["asset:locked"], artifactRef: "artifact:wireframe" };
  assert.throws(() => validatePrototypeFeedback(prototype, { id: "feedback:1", prototypeId: "proto:1", requirementRefs: ["req:outside"], decisionRef: "decision:1", changesProtectedDesign: false }), /outside prototype lineage/);
  assert.throws(() => validatePrototypeFeedback({ ...prototype, requirementRefs: ["req:one", "req:one"] }, { id: "feedback:2", prototypeId: "proto:1", requirementRefs: ["req:one"], decisionRef: "decision:2", changesProtectedDesign: false }), /must be unique/);
});

test("P5.14 recovery references are nonblank and unique just like the durable RPC contract", () => {
  assert.throws(() => validateRecoveryPlan({ projectId: "p1", mode: "migration", lineageRefs: ["lineage:1"], assetRefs: [], decisionRefs: ["decision:1"], checkpointRefs: [""] }), /cannot be blank/);
  assert.throws(() => validateRecoveryPlan({ projectId: "p1", mode: "rescue", lineageRefs: ["lineage:1", "lineage:1"], assetRefs: [], decisionRefs: ["decision:1"], checkpointRefs: ["checkpoint:1"] }), /must be unique/);
});

test("P5.14 project registry remains generic at many-project scale without a fixed project list", () => {
  const types = softwareTypes();
  const registry = new ProjectRegistry(types);
  const projectCount = 2048;
  for (let index = 0; index < projectCount; index += 1) registry.create(project(`scale-${index}`, { name: `Scale Project ${index}` }));
  assert.equal(registry.list().length, projectCount);
  assert.equal(registry.get("scale-2047")?.name, "Scale Project 2047");
});
