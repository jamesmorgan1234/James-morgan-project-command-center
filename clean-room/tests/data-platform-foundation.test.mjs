import test from "node:test";
import assert from "node:assert/strict";
import {
  CanonicalStore,
  known,
  unknown,
  notApplicable,
  KnowledgeLedger,
  isVerifiedKnowledge,
  AssetRegistry,
  CommandGraph,
  ProviderRegistry
} from "../dist/data/index.js";

const T0 = "2026-10-23T18:00:00Z";
const T1 = "2026-10-23T18:01:00Z";

test("truth values keep known zero distinct from unknown and not applicable", () => {
  assert.deepEqual(known(0), { state: "known", value: 0 });
  assert.deepEqual(unknown(), { state: "unknown" });
  assert.deepEqual(notApplicable(), { state: "not_applicable" });
});

test("canonical store enforces identity, optimistic version, and tombstones", () => {
  const store = new CanonicalStore();
  store.create({ id: "prj_edge-finder", entityType: "project", ownerId: "owner-1", projectId: "edge-finder", version: 1, createdAt: T0, updatedAt: T0, payload: { name: "Edge Finder" } });
  assert.throws(() => store.replace({ id: "prj_edge-finder", entityType: "project", ownerId: "owner-1", projectId: "edge-finder", version: 2, createdAt: T0, updatedAt: T1, payload: { name: "Edge Finder" } }, 2));
  store.replace({ id: "prj_edge-finder", entityType: "project", ownerId: "owner-1", projectId: "edge-finder", version: 2, createdAt: T0, updatedAt: T1, payload: { name: "Edge Finder Phase Two" } }, 1);
  store.tombstone("prj_edge-finder", 2, "2026-10-23T18:02:00Z");
  assert.equal(store.list().length, 0);
  assert.equal(store.list(true).length, 1);
});

test("knowledge ledger requires provenance and explicit supersession and never treats inference as verification", () => {
  const ledger = new KnowledgeLedger();
  ledger.append({ id: "kn_one", subjectId: "edge-finder:release", version: 1, kind: "verified", state: "current", value: known("0.7.7"), confidence: 1, sourceRefs: ["checkpoint"], observedAt: T0, recordedAt: T0 });
  assert.equal(isVerifiedKnowledge(ledger.current("edge-finder:release")), true);
  assert.throws(() => ledger.append({ id: "kn_bad", subjectId: "edge-finder:release", version: 2, kind: "inferred", state: "current", value: known("0.8.0"), confidence: 1, sourceRefs: ["guess"], observedAt: T1, recordedAt: T1, supersedes: "kn_one" }));
  ledger.append({ id: "kn_two", subjectId: "edge-finder:release", version: 2, kind: "owner_stated", state: "current", value: known("0.7.7-protected"), confidence: 1, sourceRefs: ["owner"], observedAt: T1, recordedAt: T1, supersedes: "kn_one" });
  assert.equal(ledger.current("edge-finder:release").id, "kn_two");
});

test("asset registry preserves missing originals and gates locked replacement", () => {
  const assets = new AssetRegistry();
  assets.register({ id: "asset_icon", ownerId: "owner-1", projectId: "command-center", name: "Approved icon", sha256: "a".repeat(64), version: 1, sensitivity: "protected", originalState: "available", approvalState: "locked", sourceRef: "approved-source", createdAt: T0, updatedAt: T0 });
  assert.throws(() => assets.replace({ id: "asset_icon", ownerId: "owner-1", projectId: "command-center", name: "Replacement", sha256: "b".repeat(64), version: 2, sensitivity: "protected", originalState: "reconstruction", approvalState: "locked", sourceRef: "generated", createdAt: T0, updatedAt: T1 }, 1));
  assets.replace({ id: "asset_icon", ownerId: "owner-1", projectId: "command-center", name: "Recovered approved icon", sha256: "b".repeat(64), version: 2, sensitivity: "protected", originalState: "available", approvalState: "locked", sourceRef: "owner-approved-recovery", createdAt: T0, updatedAt: T1 }, 1, { authorized: true, ownerDecisionRef: "owner-decision-1" });
  assert.equal(assets.get("asset_icon").version, 2);
});

test("command graph preserves aliases and versioned relationship supersession", () => {
  const graph = new CommandGraph();
  graph.addNode({ id: "prj_torevi", type: "project", ownerId: "owner-1", canonicalName: "Torevi" });
  graph.addNode({ id: "alias_hireready", type: "alias", ownerId: "owner-1", canonicalName: "HireReady AI" });
  graph.addEdge({ id: "edge_alias", from: "alias_hireready", to: "prj_torevi", relation: "aliases", version: 1, sourceRef: "owner-rename", effectiveAt: T0 });
  assert.equal(graph.resolveAlias("alias_hireready").id, "prj_torevi");
  graph.supersedeEdge("edge_alias", T1);
  assert.throws(() => graph.resolveAlias("alias_hireready"));
});

test("provider registry supports replaceable capability adapters without core surgery", () => {
  const providers = new ProviderRegistry();
  providers.register({ key: "provider:test-one", version: 1, enabled: true, authMode: "none", capabilities: ["weather.read"], scopes: [], freshnessSeconds: 60, cost: "free", health: "available", verification: "tool_result", failureMode: "fail_closed" });
  assert.equal(providers.forCapability("weather.read").length, 1);
  providers.register({ key: "provider:test-two", version: 1, enabled: true, authMode: "none", capabilities: ["weather.read"], scopes: [], freshnessSeconds: 60, cost: "free", health: "available", verification: "tool_result", failureMode: "fail_closed" });
  providers.remove("provider:test-one", 1);
  assert.equal(providers.forCapability("weather.read")[0].key, "provider:test-two");
});
