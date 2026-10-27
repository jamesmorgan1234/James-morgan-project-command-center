Warning: truncated output (original token count: 1895)
Total output lines: 110

import test from "node:test";
import assert from "node:assert/strict";
import {
  reconcileSync,
  ReconciliationQueue,
  PortabilityCenter,
  stageChatExport,
  validateConversationGraph,
  buildHistoricalLineageIndex,
  createContextSnapshot,
  ProtocolAdapterRegistry,
  rebuildProjection,
  assertProviderReplacement
} from "../dist/data/index.js";

const T0 = "2026-10-23T18:00:00Z";

test("sync reconciliation rejects stale state and exposes equal-version conflicts", () => {
  const local = { entityId: "prj_one", version: 2, updatedAt: T0, contentHash: "hash-local", sourceNode: "phone", payload: { name: "A" } };
  assert.equal(reconcileSync(local, { ...local, version: 1, contentHash: "older", sourceNode: "desktop" }).action, "reject_stale");
  assert.equal(reconcileSync(local, { ...local, contentHash: "different", sourceNode: "desktop" }).action, "conflict");
  assert.equal(reconcileSync(local, { ...local, version: 4, contentHash: "future", sourceNode: "desktop" }).action, "reconcile_gap");
  assert.equal(reconcileSync(local, { ...local, version: 3, contentHash: "next", sourceNode: "desktop" }).action, "accept");

  const queue = new ReconciliationQueue();
  queue.add({ id: "conflict-one", local, incoming: { ...local, contentHash: "different", sourceNode: "desktop" }, createdAt: T0, resolved: false });
  assert.equal(queue.pending().length, 1);
  queue.resolve("conflict-one");
  assert.equal(queue.pending().length, 0);
});

test("P3.6 stale-record detection preserves current truth and ignores an exact replay", () => {
  const local = { entityId: "prj_sync", version: 4, updatedAt: T0, contentHash: "current", sourceNode: "phone", payload: { name: "Current" } };
  const stale = reconcileSync(local, { ...local, version: 3, contentHash: "older", sourceNode: "desktop" });
  assert.equal(stale.action, "reject_stale");
  assert.equal(stale.chosen, local);
  assert.equal(reconcileSync(local, { ...local }).action, "ignore_duplicate");
  assert.equal(reconcileSync(local, { ...local, version: 5, contentHash: "next" }).action, "accept");
});

test("P3.6 version gaps fail to reconciliation instead of overwriting canonical state", () => {
  const local = { entityId: "prj_gap", version: 2, updatedAt: T0, contentHash: "v2", sourceNode: "phone", payload: { name: "Two" } };
  const gap = reconcileSync(local, { ...local, version: 5, contentHash: "v5", sourceNode: "desktop" });
  assert.equal(gap.action, "reconcile_gap");
  assert.equal(gap.chosen, undefined);
  assert.throws(() => reconcileSync(local, { ...local, entityId: "other" }), /different entity ids/);
});

test("portability dry run detects duplicates/conflicts and export redacts secret records by default", () => {
  const center = new PortabilityCenter();
  const existing = [{ id: "one", entityType: "project", version: 1, contentHash: "a", sensitivity: "internal", provenanceRefs: ["src"], data: { name: "One" } }];
  const dry = center.stageImport("batch-one", [
    { id: "one", entityType: "project", version: 1, contentHash: "a", sensitivity: "internal", provenanceRefs: ["src"], data: { name: "One" } },
    { id: "two", entityType: "project", version: 1, contentHash: "b", sensitivity: "secret", provenanceRefs: ["src"], data: { hidden: true } }
  ], existing);
  assert.equal(dry.results[0].disposition, "duplicate");
  assert.equal(dry.results[1].disposition, "create");
  const exported = center.export([...existing, { id: "two", entityType: "project", version: 1, contentHash: "b", sensitivity: "secret", provenanceRefs: ["src"], data: { hidden: true } }]);
  assert.equal(exported.recordCount, 1);
…95 tokens truncated…t: "root", children: [], message: { id: "msg-a", author: { role: "user" }, content: { parts: ["branch A"] } } },
      b: { id: "b", parent: "root", children: [], message: { id: "msg-b", author: { role: "assistant" }, content: { parts: ["branch B"] } } }
    } },
    { id: "conv-2", title: "Standalone", mapping: { only: { id: "only", parent: null, children: [], message: { id: "msg-only", author: { role: "user" }, content: { parts: ["standalone project evidence"] } } } } }
  ];
  const staged = stageChatExport(raw, "hist-batch", (text) => text.includes("standalone") ? "redact" : "keep");
  assert.equal(staged.conversationCount, 2);
  assert.equal(staged.nodeCount, 4);
  assert.equal(staged.redactedNodeCount, 1);
  const graph = validateConversationGraph(staged.conversations[0]);
  assert.equal(graph.valid, true);
  assert.deepEqual(graph.branchPoints, ["root"]);
  const lineage = buildHistoricalLineageIndex(staged.conversations);
  assert.deepEqual(lineage.containers[0].conversationIds, ["conv-1"]);
  assert.deepEqual(lineage.standaloneConversationIds, ["conv-2"]);
});

test("context snapshots inherit scope and sensitivity and exclude cross-project/secret sources", () => {
  const snapshot = createContextSnapshot({ id: "ctx-one", ownerId: "owner-1", projectId: "command-center", createdAt: T0, maxSensitivity: "protected", sources: [
    { id: "global", ownerId: "owner-1", version: 1, sensitivity: "internal", sourceRef: "rule", value: { freeFirst: true } },
    { id: "project", ownerId: "owner-1", projectId: "command-center", version: 1, sensitivity: "protected", sourceRef: "checkpoint", value: { phase: 3 } },
    { id: "other", ownerId: "owner-1", projectId: "edge-finder", version: 1, sensitivity: "internal", sourceRef: "other", value: { shouldNotLeak: true } },
    { id: "secret", ownerId: "owner-1", projectId: "command-center", version: 1, sensitivity: "secret", sourceRef: "vault", value: { shouldNotLeak: true } }
  ] });
  assert.deepEqual(snapshot.sourceIds, ["global", "project"]);
});

test("protocol adapters connect through registry seams without kernel changes", () => {
  const registry = new ProtocolAdapterRegistry();
  registry.register({ key: "protocol:test-mcp", version: 1, enabled: true, protocol: "mcp", capabilities: ["files.read"], securityRouteKey: "security.protocol" });
  assert.equal(registry.forCapability("files.read").length, 1);
  registry.remove("protocol:test-mcp", 1);
  assert.equal(registry.forCapability("files.read").length, 0);
});

test("projection rebuild fails on gaps and provider replacement honors capability and free-first gates", () => {
  assert.equal(rebuildProjection([{ sequence: 1, eventId: "e1", payloadHash: "h1" }, { sequence: 2, eventId: "e2", payloadHash: "h2" }]).eventCount, 2);
  assert.throws(() => rebuildProjection([{ sequence: 1, eventId: "e1", payloadHash: "h1" }, { sequence: 3, eventId: "e3", payloadHash: "h3" }]));
  const oldProvider = { key: "provider:old", version: 1, enabled: true, authMode: "none", capabilities: ["data.read"], scopes: [], freshnessSeconds: 60, cost: "free", health: "available", verification: "tool_result", failureMode: "fail_closed" };
  const freeReplacement = { ...oldProvider, key: "provider:new", version: 1 };
  assert.doesNotThrow(() => assertProviderReplacement(oldProvider, freeReplacement, ["data.read"], true));
  assert.throws(() => assertProviderReplacement(oldProvider, { ...freeReplacement, cost: "paid" }, ["data.read"], true));
  assert.throws(() => assertProviderReplacement(oldProvider, { ...freeReplacement, capabilities: [] }, ["data.read"], false));
});
