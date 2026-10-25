import test from "node:test";
import assert from "node:assert/strict";
import {
  ProjectTypeRegistry,
  ProjectRegistry,
  ProjectLineageLedger,
  validateRoadmap,
  workReadiness,
  ProjectCheckpointStore,
  calculateProjectProgress,
  calculateAgencyProgress,
  activeLiveView,
  nextUpView,
  createCoreProjectSections,
  discoverDuplicateSignals,
  assertOwnerGovernedCandidateDecision,
  advanceFoundry,
  compileUltimateSpec,
  CORE_SPEC_DIMENSIONS,
  validatePrototypeFeedback,
  validateRecoveryPlan
} from "../dist/projects/index.js";

const T0 = "2026-10-23T18:00:00Z";
const T1 = "2026-10-23T18:01:00Z";

function typeRegistry() {
  const types = new ProjectTypeRegistry();
  types.register({ key: "project-type:software", version: 1, label: "Software", capabilities: ["build", "deploy"], requiredDetailSections: ["snapshot", "roadmap"], domainPlaybookKey: "playbook:software" });
  return types;
}

function project(overrides = {}) {
  return { id: "edge-finder", typeKey: "project-type:software", ownerId: "owner-1", name: "Edge Finder", mission: "Find evidence-backed sports betting edges with strict no-bet safety", lifecycle: "active", status: "building", verification: "verified", priority: "high", version: 1, createdAt: T0, updatedAt: T0, agentAccessEnabled: true, portfolioAutoEnabled: true, protected: false, ...overrides };
}

test("project types and projects register without project-engine surgery", () => {
  const types = typeRegistry();
  const registry = new ProjectRegistry(types);
  registry.create(project());
  types.register({ key: "project-type:book-series", version: 1, label: "Book Series", capabilities: ["write"], requiredDetailSections: ["publication"], domainPlaybookKey: "playbook:books" });
  assert.equal(types.list().length, 2);
  assert.equal(registry.get("edge-finder").name, "Edge Finder");
  assert.throws(() => registry.create(project({ id: "bad", typeKey: "project-type:missing" })));
});

test("rename lineage preserves one stable identity", () => {
  const lineage = new ProjectLineageLedger();
  lineage.append({ id: "lin-create", projectId: "torevi", kind: "created", occurredAt: T0, evidenceRefs: ["source"] });
  lineage.append({ id: "lin-rename", projectId: "torevi", kind: "renamed", occurredAt: T1, ownerDecisionRef: "owner-rename", fromName: "HireReady AI", toName: "Torevi", evidenceRefs: ["owner-chat"] });
  assert.equal(lineage.currentName("torevi", "HireReady AI"), "Torevi");
  assert.equal(lineage.history("torevi").length, 2);
});

test("roadmap DAG cannot advance past dependencies or gates and rejects cycles", () => {
  const roadmap = { projectId: "edge-finder", version: 1, gates: [{ id: "g1", satisfied: false, evidenceRefs: [] }], workUnits: [
    { id: "w1", categoryId: "c1", phaseId: "p1", title: "Foundation", status: "verified", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["passes"] },
    { id: "w2", categoryId: "c1", phaseId: "p2", title: "Next", status: "planned", applicable: true, dependencyIds: ["w1"], gateIds: ["g1"], acceptanceCriteria: ["passes"] }
  ] };
  validateRoadmap(roadmap);
  assert.deepEqual(workReadiness(roadmap, "w2"), { ready: false, unmetDependencies: [], unmetGates: ["g1"] });
  const ready = { ...roadmap, gates: [{ id: "g1", satisfied: true, evidenceRefs: ["e1"] }] };
  assert.equal(workReadiness(ready, "w2").ready, true);
  assert.throws(() => validateRoadmap({ projectId: "x", version: 1, gates: [], workUnits: [
    { id: "a", categoryId: "c", phaseId: "p", title: "A", status: "planned", applicable: true, dependencyIds: ["b"], gateIds: [], acceptanceCriteria: ["x"] },
    { id: "b", categoryId: "c", phaseId: "p", title: "B", status: "planned", applicable: true, dependencyIds: ["a"], gateIds: [], acceptanceCriteria: ["x"] }
  ] }));
});

test("checkpoint persists exact next task and owner boundary without chat reconstruction", () => {
  const store = new ProjectCheckpointStore();
  store.append({ id: "cp1", projectId: "edge-finder", roadmapVersion: 3, createdAt: T0, exactNextWorkUnitId: "w17", blocker: "provider login", requiredEnvironment: "local_browser", ownerAction: "Authenticate provider", verificationMethod: "live provider check", evidenceRefs: ["evt1"], resumeStateHash: "a".repeat(64) });
  assert.equal(store.latest("edge-finder").exactNextWorkUnitId, "w17");
  assert.equal(store.latest("edge-finder").requiredEnvironment, "local_browser");
  assert.throws(() => store.append({ id: "cp2", projectId: "edge-finder", roadmapVersion: 3, createdAt: T1, exactNextWorkUnitId: "w18", verificationMethod: "tests", evidenceRefs: ["evt2"], resumeStateHash: "hash1" }), /SHA-256/i);
});

test("project progress and Agency progress remain separate and N/A when denominator is unknown", () => {
  const roadmap = { projectId: "edge-finder", version: 2, gates: [], workUnits: [
    { id: "w1", categoryId: "c", phaseId: "p", title: "One", status: "verified", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["x"] },
    { id: "w2", categoryId: "c", phaseId: "p", title: "Two", status: "planned", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["x"] }
  ] };
  assert.deepEqual(calculateProjectProgress(roadmap, true), { kind: "percent", verified: 1, applicable: 2, percent: 50, roadmapVersion: 2 });
  assert.equal(calculateProjectProgress(roadmap, false).kind, "na");
  assert.deepEqual(calculateAgencyProgress({ runId: "r1", completedDurableTasks: 1 }), { kind: "na", label: "N/A" });
});

test("Active / Live only shows genuinely claimed fresh working executors", () => {
  const projects = [project()];
  const fresh = activeLiveView(projects, [{ projectId: "edge-finder", runId: "r1", taskId: "t1", status: "working", executorClaimed: true, lastHeartbeatAt: "2026-10-23T18:00:30Z", currentTaskTitle: "Harden stats_player" }], T1);
  assert.equal(fresh.length, 1);
  const stale = activeLiveView(projects, [{ projectId: "edge-finder", runId: "r1", taskId: "t1", status: "working", executorClaimed: true, lastHeartbeatAt: "2026-10-23T17:00:00Z" }], T1);
  assert.equal(stale.length, 0);
  const fake = activeLiveView(projects, [{ projectId: "edge-finder", runId: "r1", taskId: "t1", status: "working", executorClaimed: false, lastHeartbeatAt: "2026-10-23T18:00:30Z" }], T1);
  assert.equal(fake.length, 0);
});

test("Next Up includes only evidence-backed ready work", () => {
  const p = project();
  const items = nextUpView([
    { project: p, workUnitId: "w1", title: "Ready", readiness: { ready: true, unmetDependencies: [], unmetGates: [] }, priorityRank: 1, evidenceRefs: ["roadmap"] },
    { project: p, workUnitId: "w2", title: "Blocked", readiness: { ready: false, unmetDependencies: ["w1"], unmetGates: [] }, priorityRank: 0, evidenceRefs: ["roadmap"] },
    { project: p, workUnitId: "w3", title: "Unsupported", readiness: { ready: true, unmetDependencies: [], unmetGates: [] }, priorityRank: 0, evidenceRefs: [] }
  ]);
  assert.deepEqual(items.map((item) => item.workUnitId), ["w1"]);
});

test("project detail sections extend by registration without renderer injection", () => {
  const sections = createCoreProjectSections();
  sections.register({ key: "project-section:kdp-performance", order: 45, projectTypeKeys: ["project-type:book-series"], title: "KDP Performance" });
  assert.ok(sections.forProjectType("project-type:book-series").some((section) => section.key === "project-section:kdp-performance"));
  assert.equal(sections.remove("project-section:kdp-performance").title, "KDP Performance");
});

test("project discovery flags near-duplicate missions and owner controls disposition", () => {
  const signals = discoverDuplicateSignals({ id: "cand", proposedName: "Clip Engine", mission: "automated clipping system for livestream vod content into short videos", sourceRefs: ["conversation"] }, [
    { projectId: "veloclip", name: "VeloClip", mission: "automated clipping system for live streams and VOD content into short-form videos" },
    { projectId: "edge-finder", name: "Edge Finder", mission: "sports data edge analysis" }
  ], 0.25);
  assert.equal(signals[0].projectId, "veloclip");
  assert.doesNotThrow(() => assertOwnerGovernedCandidateDecision({ candidateId: "cand", disposition: "merge", ownerDecisionRef: "owner-1", targetProjectId: "veloclip" }));
  assert.throws(() => assertOwnerGovernedCandidateDecision({ candidateId: "cand", disposition: "add", ownerDecisionRef: "" }));
});

test("Foundry cannot enter Agency execution without exact owner authorization", () => {
  let state = { projectId: "new-project", stage: "idea", specVersion: 1, requirementRefs: ["r1"], decisionRefs: [], artifactRefs: [] };
  for (const [next, evidence] of [["research", "e1"], ["ultimate_spec", "e2"], ["architecture", "e3"], ["roadmap", "e4"], ["owner_authorization", "e5"]]) state = advanceFoundry(state, next, evidence);
  assert.throws(() => advanceFoundry(state, "agency_execution", "e6"));
  state = advanceFoundry(state, "agency_execution", "e6", "owner-approved-snapshot");
  assert.equal(state.ownerAuthorizationRef, "owner-approved-snapshot");
});

test("Ultimate Spec completeness requires every applicable dimension addressed or explicitly excluded", () => {
  const dimensions = CORE_SPEC_DIMENSIONS.map((key) => ({ key, applicable: true, state: key === "monetization" ? "excluded_with_reason" : "addressed", evidenceRefs: key === "monetization" ? [] : [`spec:${key}`], ...(key === "monetization" ? { exclusionReason: "Personal-only project" } : {}) }));
  assert.equal(compileUltimateSpec("project-one", 1, dimensions).complete, true);
  const incomplete = [...dimensions, { key: "domain-extra", applicable: true, state: "unknown", evidenceRefs: [] }];
  assert.deepEqual(compileUltimateSpec("project-one", 2, incomplete).unresolvedKeys, ["domain-extra"]);
});

test("prototype feedback cannot override protected design without owner authorization", () => {
  const prototype = { id: "proto-1", projectId: "command-center", specVersion: 2, requirementRefs: ["r-ui"], protectedDesignAssetRefs: ["approved-screen"], artifactRef: "wireframe" };
  assert.throws(() => validatePrototypeFeedback(prototype, { id: "f1", prototypeId: "proto-1", requirementRefs: ["r-ui"], decisionRef: "feedback", changesProtectedDesign: true }));
  assert.doesNotThrow(() => validatePrototypeFeedback(prototype, { id: "f2", prototypeId: "proto-1", requirementRefs: ["r-ui"], decisionRef: "feedback", changesProtectedDesign: true, protectedDesignOwnerAuthorizationRef: "owner-change" }));
});

test("archived revival and rescue preserve lineage/checkpoint governance", () => {
  assert.throws(() => validateRecoveryPlan({ projectId: "old", mode: "archived_revival", lineageRefs: ["lin"], assetRefs: [], decisionRefs: ["decision"], checkpointRefs: ["cp"] }));
  assert.doesNotThrow(() => validateRecoveryPlan({ projectId: "old", mode: "archived_revival", lineageRefs: ["lin"], assetRefs: [], decisionRefs: ["decision"], checkpointRefs: ["cp"], ownerReactivationRef: "owner-reactivate" }));
  assert.throws(() => validateRecoveryPlan({ projectId: "broken", mode: "rescue", lineageRefs: ["lin"], assetRefs: [], decisionRefs: ["decision"], checkpointRefs: [] }));
});
