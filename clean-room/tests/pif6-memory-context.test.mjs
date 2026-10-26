import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileLayeredBrainContext } from "../dist/brain/index.js";

const NOW = "2026-10-26T04:00:00Z";

function candidate(id, overrides = {}) {
  const memory = {
    id,
    ownerId: "owner-1",
    projectId: "prj_alpha",
    kind: "fact",
    version: 1,
    state: "current",
    value: Object.freeze({ statement: id }),
    confidence: 0.9,
    sensitivity: "internal",
    sourceRefs: [`source:${id}`],
    recordedAt: "2026-10-26T01:00:00Z"
  };
  const metadata = {
    memoryId: id,
    memoryVersion: 1,
    layer: "ecosystem_validated",
    companyId: "cmp_alpha",
    brainId: "brn_command-center",
    taskClasses: ["planning"],
    conditionRefs: [],
    dependencyRefs: [`dependency:${id}`],
    methodRefs: ["mth_planning"],
    permissionRefs: ["permission:read"],
    budgetRefs: ["budget:free-first"],
    contradictionRefs: [],
    operationalEligible: true,
    expiresAt: "2026-11-26T01:00:00Z",
    revalidateAfter: "2026-11-15T01:00:00Z",
    invalidationEvidenceRefs: []
  };
  return {
    memory: { ...memory, ...(overrides.memory ?? {}) },
    metadata: { ...metadata, ...(overrides.metadata ?? {}) },
    relevance: overrides.relevance ?? 0.9,
    sensitivityRank: overrides.sensitivityRank ?? 1,
    budgetUnits: overrides.budgetUnits ?? 1
  };
}

const REQUEST = {
  ownerId: "owner-1",
  projectId: "prj_alpha",
  companyId: "cmp_alpha",
  taskClass: "planning",
  now: NOW,
  maxSensitivityRank: 2,
  minRelevance: 0.5,
  maxItems: 10,
  maxBudgetUnits: 10
};

test("PIF.6 context compiler prevents unrelated company/project leakage", () => {
  const packet = compileLayeredBrainContext(REQUEST, [candidate("mem-good"), candidate("mem-other-company", { metadata: { companyId: "cmp_beta" } })]);
  assert.deepEqual(packet.items.map((item) => item.memoryId), ["mem-good"]);
  assert.equal(packet.omitted.find((item) => item.memoryId === "mem-other-company")?.reason, "company_boundary");
});

test("PIF.6 expired and invalidated learning is excluded with explicit reasons", () => {
  const packet = compileLayeredBrainContext(REQUEST, [
    candidate("mem-expired", { metadata: { expiresAt: "2026-10-25T01:00:00Z" } }),
    candidate("mem-invalidated", { metadata: { invalidatedAt: "2026-10-26T03:00:00Z", invalidationEvidenceRefs: ["evd_revoke"] } })
  ]);
  assert.equal(packet.items.length, 0);
  assert.equal(packet.omitted.find((item) => item.memoryId === "mem-expired")?.reason, "memory_expired");
  assert.equal(packet.omitted.find((item) => item.memoryId === "mem-invalidated")?.reason, "memory_invalidated");
});

test("PIF.6 budget overflow is explicit and exact included versions are pinned", () => {
  const packet = compileLayeredBrainContext({ ...REQUEST, maxBudgetUnits: 2 }, [candidate("mem-one", { budgetUnits: 2 }), candidate("mem-two", { relevance: 0.8, budgetUnits: 1 })]);
  assert.deepEqual(packet.exactVersionRefs, ["mem-one@1"]);
  assert.equal(packet.usedBudgetUnits, 2);
  assert.equal(packet.omitted.find((item) => item.memoryId === "mem-two")?.reason, "budget_overflow");
});

test("PIF.6 historical provenance remains visible but cannot be operationally reactivated", () => {
  const historical = candidate("mem-history", { metadata: { layer: "historical", operationalEligible: false } });
  const packet = compileLayeredBrainContext(REQUEST, [historical]);
  assert.equal(packet.items.length, 0);
  const omission = packet.omitted[0];
  assert.equal(omission.reason, "layer_historical_nonoperational");
  assert.deepEqual(omission.sourceRefs, ["source:mem-history"]);
});

test("PIF.6 compiled context carries scoped method, permission and budget references", () => {
  const packet = compileLayeredBrainContext(REQUEST, [candidate("mem-context")]);
  assert.deepEqual(packet.methodRefs, ["mth_planning"]);
  assert.deepEqual(packet.permissionRefs, ["permission:read"]);
  assert.deepEqual(packet.budgetRefs, ["budget:free-first"]);
});

test("PIF.6 durable schema records layer/applicability/freshness/dependencies and exact compiled versions", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026034000_pif6_layered_memory_context.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_memory_layers/i);
  assert.match(sql, /memory_version/i);
  assert.match(sql, /layer/i);
  assert.match(sql, /company_id/i);
  assert.match(sql, /project_id/i);
  assert.match(sql, /dependency_refs/i);
  assert.match(sql, /revalidate_after/i);
  assert.match(sql, /invalidated_at/i);
  assert.match(sql, /command_center_context_compilations/i);
  assert.match(sql, /exact_version_refs/i);
  assert.match(sql, /omitted_refs/i);
});
