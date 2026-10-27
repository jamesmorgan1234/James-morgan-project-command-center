import test from "node:test";
import assert from "node:assert/strict";
import {
  BrainCore,
  AiRouteRegistry,
  BrainMemoryLedger,
  buildBrainContext,
  validateBrainPlan,
  SpecialistBrainRegistry,
  classifyConversationIntent,
  ProjectWorkspaceStore,
  freezeExecutionSnapshot,
  resolveReferent,
  applySteering,
  evaluateOwnerPrecedent,
  voiceIntent,
  createImprovementProposal,
  assertCoreTruthSurvivesAiOutage
} from "../dist/brain/index.js";

const T0 = "2026-10-23T18:00:00Z";

test("Brain core separates intelligence output from canonical write authority", () => {
  const brain = new BrainCore();
  const envelope = brain.wrap({ id: "req1", ownerId: "owner-1", projectId: "edge-finder", intent: "proposal", text: "Improve this", contextSnapshotId: "ctx1" }, { suggestion: "x" }, ["evidence1"]);
  assert.equal(envelope.actionClass, "proposal");
  assert.equal(envelope.canonicalWritesAuthorized, false);
  assert.equal(brain.classifyAction("protected_action_request"), "protected");
});

test("AI routing preserves free-first/privacy/health and can replace providers", () => {
  const routes = new AiRouteRegistry();
  routes.register({ key: "ai-route:local", providerKey: "local", modelId: "local-model", versionRef: "v1", executionMode: "local", enabled: true, capabilities: ["reason"], cost: "free", privacy: "local", health: "available", qualityRank: 5, latencyRank: 1, quotaAvailable: true });
  routes.register({ key: "ai-route:paid", providerKey: "remote", modelId: "paid-model", versionRef: "v2", executionMode: "remote", enabled: true, capabilities: ["reason"], cost: "paid", privacy: "remote", health: "available", qualityRank: 10, latencyRank: 2, quotaAvailable: true });
  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "remote", preferQuality: true }).key, "ai-route:local");
  routes.remove("ai-route:local");
  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "remote", preferQuality: true }), undefined);
});

test("memory correction supersedes rather than erases lineage", () => {
  const memory = new BrainMemoryLedger();
  memory.append({ id: "m1", ownerId: "owner-1", projectId: "cc", kind: "fact", version: 1, state: "current", value: { count: 10 }, confidence: 1, sensitivity: "internal", sourceRefs: ["source1"], recordedAt: T0 });
  memory.append({ id: "m2", ownerId: "owner-1", projectId: "cc", kind: "fact", version: 2, state: "current", value: { count: 11 }, confidence: 1, sensitivity: "internal", sourceRefs: ["source2"], recordedAt: "2026-10-23T18:01:00Z", supersedes: "m1" });
  assert.equal(memory.current("owner-1", "cc")[0].id, "m2");
  assert.equal(memory.history("m1")[0].state, "superseded");
});

test("context builder minimizes by owner/project/relevance/sensitivity/freshness", () => {
  const packet = buildBrainContext({ ownerId: "owner-1", projectId: "cc", now: "2026-10-23T19:00:00Z", maxSensitivityRank: 2, minRelevance: 0.5, maxItems: 3 }, [
    { id: "good", ownerId: "owner-1", projectId: "cc", kind: "checkpoint", relevance: 1, sensitivityRank: 2, observedAt: T0, sourceRef: "cp", value: { phase: 6 } },
    { id: "other", ownerId: "owner-1", projectId: "edge", kind: "checkpoint", relevance: 1, sensitivityRank: 1, observedAt: T0, sourceRef: "cp2", value: {} },
    { id: "secret", ownerId: "owner-1", projectId: "cc", kind: "secret", relevance: 1, sensitivityRank: 3, observedAt: T0, sourceRef: "vault", value: {} },
    { id: "stale", ownerId: "owner-1", projectId: "cc", kind: "fact", relevance: 1, sensitivityRank: 1, observedAt: T0, staleAfter: "2026-10-23T18:30:00Z", sourceRef: "old", value: {} }
  ]);
  assert.deepEqual(packet.items.map((item) => item.id), ["good"]);
  assert.deepEqual(packet.omittedStaleIds, ["stale"]);
});

test("plans distinguish evidence-backed facts from uncertainty", () => {
  assert.doesNotThrow(() => validateBrainPlan({ id: "p1", objective: "Choose path", claims: [{ id: "c1", class: "verified_fact", statement: "CI passed", evidenceRefs: ["run1"] }, { id: "c2", class: "estimate", statement: "May take two stages", evidenceRefs: [], confidence: 0.6 }], proposedActions: ["next"], requiresOwnerDecision: false }));
  assert.throws(() => validateBrainPlan({ id: "p2", objective: "Bad", claims: [{ id: "c1", class: "verified_fact", statement: "Unsupported", evidenceRefs: [] }], proposedActions: [], requiresOwnerDecision: false }));
});

test("specialist Brains and shared patterns remain registry-driven and scoped", () => {
  const registry = new SpecialistBrainRegistry();
  registry.registerBrain({ key: "brain:books", version: 1, scope: "books", capabilities: ["book-context"], allowedMemoryKinds: ["decision", "asset"] });
  registry.registerPattern({ id: "pat1", version: 1, provenanceRefs: ["verified-book"], applicableScopes: ["books"], deprecated: false });
  assert.equal(registry.usablePatterns("books").length, 1);
  registry.removeBrain("brain:books");
});

test("conversation identifies execution and protected-action intent without side effects", () => {
  assert.equal(classifyConversationIntent("go ahead with that").intent, "agent_request");
  assert.equal(classifyConversationIntent("deploy this now").intent, "protected_action_request");
  assert.equal(classifyConversationIntent("what changed?").intent, "question");
});

test("project workspace persists execution/evidence state independently of chat session", () => {
  const store = new ProjectWorkspaceStore();
  store.save({ projectId: "cc", version: 1, specVersion: 2, turnIds: ["t1"], decisionRefs: ["d1"], executionRunId: "r1", blockerRefs: [], evidenceRefs: ["e1"], verifiedResultRefs: [], updatedAt: T0 });
  store.save({ projectId: "cc", version: 2, specVersion: 2, turnIds: ["t1", "t2"], decisionRefs: ["d1"], executionRunId: "r1", blockerRefs: [], evidenceRefs: ["e1", "e2"], verifiedResultRefs: ["v1"], updatedAt: "2026-10-23T18:02:00Z" }, 1);
  assert.deepEqual(store.get("cc").verifiedResultRefs, ["v1"]);
});

test("referent snapshot freezes exact proposal version and later edits cannot mutate it", () => {
  const p1 = { id: "proposal-1", projectId: "cc", version: 3, title: "Build clean room", decisionRefs: ["d1"], requirementRefs: ["r1"], actionRefs: ["a1"] };
  assert.equal(resolveReferent("go ahead with that", p1, [p1]).version, 3);
  const snapshot = freezeExecutionSnapshot(p1, "owner-message", "snap1");
  const p2 = { ...p1, version: 4, actionRefs: ["a2"] };
  assert.equal(snapshot.proposalVersion, 3);
  assert.deepEqual(snapshot.actionRefs, ["a1"]);
  assert.notDeepEqual(snapshot.actionRefs, p2.actionRefs);
  assert.throws(() => resolveReferent("that", undefined, [p1]));
});

test("live steering preserves verified unaffected output and invalidates downstream dependencies", () => {
  const result = applySteering("change", ["b"], [
    { id: "a", dependencyIds: [], verified: true, authorizationScope: ["project"] },
    { id: "b", dependencyIds: ["a"], verified: false, authorizationScope: ["project"] },
    { id: "c", dependencyIds: ["b"], verified: false, authorizationScope: ["project"] }
  ]);
  assert.deepEqual(result.preservedVerifiedIds, ["a"]);
  assert.deepEqual([...result.invalidatedIds].sort(), ["b", "c"]);
  assert.equal(result.requiresAuthorizationRecheck, true);
});

test("owner precedent never inherits authorization and rejects material context differences", () => {
  const precedent = { decisionRef: "d1", context: { projectType: "software", accountScope: "cc", riskClass: "low", costClass: "free", actionClass: "build" }, reusableAsDefault: true, grantsAuthorization: true };
  assert.deepEqual(evaluateOwnerPrecedent(precedent, precedent.context), { applies: true, reason: "same_material_context_default_only", authorizationInherited: false });
  assert.equal(evaluateOwnerPrecedent(precedent, { ...precedent.context, costClass: "paid" }).applies, false);
});

test("voice uses same intent engine and cannot bypass microphone/finality gates", () => {
  const adapter = { key: "speech:test", available: true, permission: "granted" };
  assert.equal(voiceIntent(adapter, { text: "deploy this", final: true, adapterKey: "speech:test" }).intent, "protected_action_request");
  assert.throws(() => voiceIntent({ ...adapter, permission: "denied" }, { text: "go ahead", final: true, adapterKey: "speech:test" }));
  assert.throws(() => voiceIntent(adapter, { text: "go ahead", final: false, adapterKey: "speech:test" }));
});

test("improvements never self-install", () => {
  assert.equal(createImprovementProposal({ id: "imp1", area: "quality", title: "Add replay fixture", evidenceRefs: ["audit"], confidence: 0.9 }).installsAutomatically, false);
});

test("core truth/control survives external AI outage", () => {
  assert.doesNotThrow(() => assertCoreTruthSurvivesAiOutage([
    { key: "project.read", requiresAi: false, availableOffline: true },
    { key: "checkpoint.read", requiresAi: false, availableOffline: true },
    { key: "decision.read", requiresAi: false, availableOffline: true },
    { key: "rule.read", requiresAi: false, availableOffline: true },
    { key: "needs-me.read", requiresAi: false, availableOffline: true },
    { key: "brain.reason", requiresAi: true, availableOffline: false }
  ]));
});
