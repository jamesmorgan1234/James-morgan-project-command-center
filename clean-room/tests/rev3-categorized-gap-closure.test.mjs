import test from "node:test";
import assert from "node:assert/strict";
import { DecisionRightsRegistry, inspectShiftManager } from "../dist/agency/index.js";
import { ProjectWorkspaceStore } from "../dist/brain/index.js";
import { validateOnboardingManifest, groupSetupByUnlockImpact } from "../dist/personal/index.js";
import { stageChatExport, validateConversationGraph, buildHistoricalLineageIndex } from "../dist/data/index.js";

test("CCR-05836 integrated Shift Manager contains ordinary faults and escalates only explicit owner boundaries", () => {
  const assessment = inspectShiftManager({
    workers: [
      { workerId: "healthy", projectId: "p", taskId: "healthy-task", state: "working", lastHeartbeatAt: "2026-10-26T12:09:59Z" },
      { workerId: "stalled", projectId: "p", taskId: "stalled-task", state: "working", lastHeartbeatAt: "2026-10-26T12:00:00Z" },
      { workerId: "blocked", projectId: "p", taskId: "owner-task", state: "blocked", lastHeartbeatAt: "2026-10-26T12:09:59Z" }
    ],
    queueDepth: 10,
    queueCapacity: 10,
    resourcePressure: 0.95,
    coordinationFaults: [
      { taskId: "deadlock-task", kind: "deadlock", ownerBoundaryRequired: false },
      { taskId: "legal-task", kind: "authorization_boundary", ownerBoundaryRequired: true }
    ],
    ownerBoundaryTaskIds: ["owner-task"]
  }, "2026-10-26T12:10:00Z", 60000);
  assert.equal(assessment.containmentRequired, true);
  assert.deepEqual(assessment.safeHandoffTaskIds, ["stalled-task"]);
  assert.deepEqual(assessment.recoverableFaultTaskIds, ["deadlock-task"]);
  assert.deepEqual(assessment.ownerBoundaryTaskIds, ["legal-task", "owner-task"]);
  assert.equal(assessment.incidents.find((incident) => incident.taskId === "owner-task").ownerAttentionRequired, true);
  assert.equal(assessment.incidents.find((incident) => incident.taskId === "stalled-task").ownerAttentionRequired, false);
  assert.throws(() => inspectShiftManager({ workers: [], queueDepth: -1, queueCapacity: 1, resourcePressure: 0, coordinationFaults: [], ownerBoundaryTaskIds: [] }, "2026-10-26T12:10:00Z", 60000));
});

test("CCR-05838 decision-rights registry distinguishes self/default/recommend/protected/prohibited and never inherits protected authority", () => {
  const registry = new DecisionRightsRegistry();
  registry.register({ key: "routine", version: 1, right: "self_decidable", evidenceRefs: ["policy:routine"] });
  registry.register({ key: "default", version: 1, right: "defaultable", ownerDefaultRef: "owner:default", evidenceRefs: ["policy:default"] });
  registry.register({ key: "recommend", version: 1, right: "recommend", evidenceRefs: ["policy:recommend"] });
  registry.register({ key: "deploy", version: 1, right: "protected", protectedActionKey: "production.deploy", evidenceRefs: ["policy:deploy"] });
  registry.register({ key: "forbidden", version: 1, right: "prohibited", evidenceRefs: ["policy:forbidden"] });
  assert.equal(registry.assess("routine", "execute", false).allowed, true);
  assert.equal(registry.assess("default", "prepare", false).allowed, true);
  assert.equal(registry.assess("recommend", "propose", false).allowed, true);
  assert.deepEqual(registry.assess("deploy", "continuous", false), { key: "deploy", version: 1, right: "protected", allowed: false, ownerBoundaryRequired: true, reason: "protected_authorization_required" });
  assert.equal(registry.assess("deploy", "execute", true).allowed, true);
  assert.equal(registry.assess("forbidden", "continuous", true).allowed, false);
  assert.throws(() => registry.register({ key: "default-missing", version: 1, right: "defaultable", evidenceRefs: ["e"] }));
  assert.throws(() => registry.register({ key: "deploy", version: 1, right: "protected", protectedActionKey: "production.deploy", evidenceRefs: ["e2"] }));
});

test("CCR-05842 durable project workspace rejects stale or non-monotonic resume writes", () => {
  const store = new ProjectWorkspaceStore();
  const base = { projectId: "p", version: 1, specVersion: 1, turnIds: ["t1"], decisionRefs: ["d1"], blockerRefs: [], evidenceRefs: ["e1"], verifiedResultRefs: [], updatedAt: "2026-10-26T12:00:00Z" };
  store.save(base);
  store.save({ ...base, version: 2, turnIds: ["t1", "t2"], evidenceRefs: ["e1", "e2"], updatedAt: "2026-10-26T12:01:00Z" }, 1);
  assert.deepEqual(store.get("p").turnIds, ["t1", "t2"]);
  assert.throws(() => store.save({ ...base, version: 3, updatedAt: "2026-10-26T12:02:00Z" }, 1), /version conflict/);
  assert.throws(() => store.save({ ...base, projectId: "new", version: 2 }, undefined), /version 1/);
});

test("CCR-05845 Foundry onboarding manifest fails early on unknown/cyclic setup and groups valid unlock impact", () => {
  const manifest = { projectId: "p", specVersion: 1, requirements: [
    { id: "account", kind: "account", title: "Account", dependencyIds: [], unlockRefs: ["provider"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true },
    { id: "credential", kind: "credential", title: "Credential", dependencyIds: ["account"], unlockRefs: ["provider", "launch"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true }
  ] };
  assert.doesNotThrow(() => validateOnboardingManifest(manifest));
  assert.equal(groupSetupByUnlockImpact(manifest)[0].unlockRef, "provider");
  assert.throws(() => validateOnboardingManifest({ ...manifest, requirements: [{ ...manifest.requirements[1], dependencyIds: ["missing"] }] }), /Unknown setup dependency/);
  assert.throws(() => validateOnboardingManifest({ ...manifest, requirements: [
    { ...manifest.requirements[0], dependencyIds: ["credential"] },
    { ...manifest.requirements[1], dependencyIds: ["account"] }
  ] }), /cycle/);
});

test("CCR-05847 historical export adapter stages supported exports, redacts by policy, and rejects malformed batches", () => {
  const raw = [{ id: "conv", title: "History", mapping: {
    root: { id: "root", parent: null, children: ["a"], message: null },
    a: { id: "a", parent: "root", children: [], message: { id: "m1", author: { role: "user" }, content: { parts: ["secret text"] } } }
  } }];
  const staged = stageChatExport(raw, "batch", () => "redact");
  assert.equal(staged.conversationCount, 1);
  assert.equal(staged.nodeCount, 2);
  assert.equal(staged.redactedNodeCount, 1);
  assert.equal(staged.conversations[0].nodes[1].text, undefined);
  assert.throws(() => stageChatExport({}, "batch"), /array/);
  assert.throws(() => stageChatExport([{ id: "bad" }], "batch"), /mapping/);
});

test("CCR-05848 complete historical graph import accounts for every available mapping node and refuses malformed entries", () => {
  const staged = stageChatExport([{ id: "conv", title: "Graph", mapping: {
    root: { id: "root", parent: null, children: ["a", "b"], message: null },
    a: { id: "a", parent: "root", children: [], message: { id: "ma", author: { role: "user" }, content: { parts: ["A"] } } },
    b: { id: "b", parent: "root", children: [], message: { id: "mb", author: { role: "assistant" }, content: { parts: ["B"] } } }
  } }], "batch");
  assert.equal(staged.nodeCount, 3);
  assert.deepEqual(staged.conversations[0].nodes.map((node) => node.id).sort(), ["a", "b", "root"]);
  assert.throws(() => stageChatExport([null], "batch"), /object/);
});

test("CCR-05849 branch-aware lineage preserves branch points and surfaces broken parent-child lineage instead of flattening", () => {
  const valid = { conversationId: "c", title: "T", nodes: [
    { id: "root", children: ["a", "b"], contentState: "none" },
    { id: "a", parent: "root", children: [], contentState: "keep", text: "A" },
    { id: "b", parent: "root", children: [], contentState: "keep", text: "B" }
  ] };
  const good = validateConversationGraph(valid);
  assert.equal(good.valid, true);
  assert.deepEqual(good.branchPoints, ["root"]);
  const broken = validateConversationGraph({ ...valid, nodes: [
    { id: "root", children: ["missing"], contentState: "none" },
    { id: "a", parent: "wrong", children: [], contentState: "keep", text: "A" }
  ] });
  assert.equal(broken.valid, false);
  assert.equal(broken.errors.some((error) => error.startsWith("missing_child:")), true);
  assert.equal(broken.errors.some((error) => error.startsWith("missing_parent:")), true);
});

test("CCR-05850 historical project-container lineage preserves container membership without converting standalone evidence into container truth", () => {
  const index = buildHistoricalLineageIndex([
    { conversationId: "in-container", title: "A", templateId: "template-1", nodes: [] },
    { conversationId: "standalone", title: "B", nodes: [] },
    { conversationId: "same-container", title: "C", templateId: "template-1", nodes: [] }
  ]);
  assert.deepEqual(index.containers, [{ templateId: "template-1", conversationIds: ["in-container", "same-container"] }]);
  assert.deepEqual(index.standaloneConversationIds, ["standalone"]);
  assert.equal(index.containers[0].conversationIds.includes("standalone"), false);
});
