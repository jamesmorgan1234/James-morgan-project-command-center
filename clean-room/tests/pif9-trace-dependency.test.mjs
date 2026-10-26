import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IntelligenceTraceFabric, validateIntelligenceTraceNode } from "../dist/data/index.js";

const AT = "2026-10-26T05:00:00Z";

function node(id, kind, version = 1, recordedAt = AT) {
  return { id, kind, version, ownerId: "owner-1", privacy: "ecosystem_shared", reference: `ref:${id}:${version}`, recordedAt, evidenceRefs: [`evd_${id.replace(/[^a-z0-9]+/gi, "-")}`] };
}

function edge(id, relation, fromId, toId, fromVersion = 1, toVersion = 1) {
  return { id, relation, fromId, fromVersion, toId, toVersion, version: 1, recordedAt: AT, evidenceRefs: [`evd_${id.replace(/[^a-z0-9]+/gi, "-")}`] };
}

function lineageFabric() {
  const fabric = new IntelligenceTraceFabric();
  const nodes = [
    ["intent:1", "intent"], ["context:1", "context"], ["policy:1", "policy"], ["router:1", "router"],
    ["specialist:1", "specialist"], ["method:1", "method"], ["tool:1", "tool"], ["evidence:1", "evidence"],
    ["verifier:1", "verifier"], ["state:1", "state"], ["decision:1", "decision"], ["outcome:1", "outcome"], ["learning:1", "learning"]
  ];
  for (const [id, kind] of nodes) fabric.registerNode(node(id, kind));
  const edges = [
    ["tr-01", "context_for", "intent:1", "context:1"], ["tr-02", "governs", "context:1", "policy:1"],
    ["tr-03", "routes_to", "policy:1", "router:1"], ["tr-04", "selects", "router:1", "specialist:1"],
    ["tr-05", "selects", "specialist:1", "method:1"], ["tr-06", "invokes", "method:1", "tool:1"],
    ["tr-07", "produces_evidence", "tool:1", "evidence:1"], ["tr-08", "verified_by", "evidence:1", "verifier:1"],
    ["tr-09", "transitions_to", "verifier:1", "state:1"], ["tr-10", "records_decision", "state:1", "decision:1"],
    ["tr-11", "records_outcome", "decision:1", "outcome:1"], ["tr-12", "produces_learning", "outcome:1", "learning:1"]
  ];
  for (const [id, relation, from, to] of edges) fabric.connect(edge(id, relation, from, to));
  return fabric;
}

test("PIF.9 resolves exact intent-to-learning lineage without payload duplication", () => {
  const result = lineageFabric().explain("learning:1", 1);
  const kinds = new Set(result.nodes.map((item) => item.kind));
  for (const kind of ["intent","context","policy","router","specialist","method","tool","evidence","verifier","state","decision","outcome","learning"]) assert.ok(kinds.has(kind), `missing ${kind}`);
  assert.equal(result.targetRef, "learning:1@1");
  assert.ok(result.edgeIds.includes("tr-12"));
});

test("PIF.9 changed method/evaluator/ontology versions invalidate only affected dependents", () => {
  const fabric = new IntelligenceTraceFabric();
  for (const item of [
    node("decision:primary", "decision"), node("outcome:primary", "outcome"), node("learning:primary", "learning"),
    node("method:primary", "method"), node("evaluator:primary", "evaluator"), node("ontology:shared", "ontology"),
    node("decision:unrelated", "decision"), node("method:unrelated", "method")
  ]) fabric.registerNode(item);
  fabric.connect(edge("dep-method", "depends_on", "decision:primary", "method:primary"));
  fabric.connect(edge("dep-eval", "evaluated_by", "decision:primary", "evaluator:primary"));
  fabric.connect(edge("dep-ontology", "uses_ontology", "decision:primary", "ontology:shared"));
  fabric.connect(edge("flow-outcome", "records_outcome", "decision:primary", "outcome:primary"));
  fabric.connect(edge("flow-learning", "produces_learning", "outcome:primary", "learning:primary"));
  fabric.connect(edge("dep-unrelated", "depends_on", "decision:unrelated", "method:unrelated"));

  const impact = fabric.affectedDependents("method:primary", 2);
  assert.ok(impact.staleDependentRefs.includes("decision:primary@1"));
  assert.ok(impact.staleDependentRefs.includes("outcome:primary@1"));
  assert.ok(impact.staleDependentRefs.includes("learning:primary@1"));
  assert.ok(!impact.staleDependentRefs.includes("decision:unrelated@1"));
});

test("PIF.9 exact dependency compatibility fails closed before stale versions are used", () => {
  const fabric = new IntelligenceTraceFabric();
  for (const item of [node("decision:1", "decision"), node("method:1", "method"), node("evaluator:1", "evaluator"), node("ontology:1", "ontology")]) fabric.registerNode(item);
  fabric.connect(edge("dep-method", "depends_on", "decision:1", "method:1"));
  fabric.connect(edge("dep-eval", "evaluated_by", "decision:1", "evaluator:1"));
  fabric.connect(edge("dep-ontology", "uses_ontology", "decision:1", "ontology:1"));
  assert.doesNotThrow(() => fabric.assertCompatible("decision:1", 1, { "method:1": 1, "evaluator:1": 1, "ontology:1": 1 }));
  assert.throws(() => fabric.assertCompatible("decision:1", 1, { "method:1": 2, "evaluator:1": 1, "ontology:1": 1 }), /compatibility failed/i);
});

test("PIF.9 trace references are privacy-safe pointers, not secret-bearing payloads", () => {
  assert.throws(() => validateIntelligenceTraceNode({ ...node("tool:unsafe", "tool"), reference: "provider://call?token=abc123" }), /sensitive payload/i);
});

test("PIF.9 durable schema stores typed versioned trace edges and targeted invalidations", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026035000_pif9_trace_dependency_version.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_intelligence_trace_nodes/i);
  assert.match(sql, /command_center_intelligence_trace_edges/i);
  assert.match(sql, /from_version/i);
  assert.match(sql, /to_version/i);
  assert.match(sql, /privacy_class/i);
  assert.match(sql, /reference_ptr/i);
  assert.match(sql, /command_center_dependency_invalidations/i);
  assert.match(sql, /stale_dependent_refs/i);
  assert.doesNotMatch(sql, /secret_value|raw_payload|access_token/i);
});
