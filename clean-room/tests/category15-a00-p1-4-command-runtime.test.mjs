import test from "node:test";
import assert from "node:assert/strict";
import { resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

test("A00 P1.4 command-runtime idempotency and deduplication rows are strictly grounded", () => {
  const idempotency = rows["CCR-05111"];
  assert.equal(idempotency.requirement, "idempotency");
  assert.deepEqual(idempotency.canonicalSourceIds, ["P2-0015"]);
  assert.deepEqual(idempotency.owningPhases, ["P1.4"]);
  assert.deepEqual(idempotency.dependencies, ["C0"]);
  assert.equal(idempotency.truthState, "VERIFIED");
  assert.ok(idempotency.implementationLocations.some((ref) => ref.includes("command-runtime.ts#CommandRuntime.execute")));
  assert.ok(idempotency.evidenceVersion.includes("git:f5f92dab5394b9f926ca6bcd062e631643d8a7e3"));
  assert.ok(idempotency.evidenceVersion.includes("ci:40341930516"));

  const deduplication = rows["CCR-05112"];
  assert.equal(deduplication.requirement, "deduplication");
  assert.deepEqual(deduplication.canonicalSourceIds, ["P2-0016"]);
  assert.deepEqual(deduplication.owningPhases, ["P1.4"]);
  assert.deepEqual(deduplication.dependencies, ["C0"]);
  assert.equal(deduplication.truthState, "VERIFIED");
  assert.ok(deduplication.tests.positive.references.some((ref) => ref.includes("deduplication scope includes command type")));
  assert.ok(deduplication.evidenceVersion.includes("ci:40341930516"));
});

test("resolved A00 closure advances only by the two newly evidenced P1.4 rows", () => {
  assert.deepEqual(report.closureSummary, { total: 489, verified: 16, unverified: 473, notApplicable: 0 });
  assert.equal(report.fullP15_1ClosureSatisfied, false);
});
