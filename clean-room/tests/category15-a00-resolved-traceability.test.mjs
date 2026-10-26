import test from "node:test";
import assert from "node:assert/strict";
import { assertStrictVerifiedA00Row, resolveA00Traceability } from "../scripts/p15-1-a00-traceability-lib.mjs";

const report = resolveA00Traceability();
const rows = report.effectiveRowModel.rowOverrides;

test("resolved A00 strict traceability composes collision-free verified override fragments", () => {
  assert.equal(report.canonicalIdCount, 489);
  assert.equal(report.closureSummary.total, 489);
  assert.equal(report.closureSummary.verified, Object.keys(rows).length);
  assert.equal(report.closureSummary.unverified, 489 - Object.keys(rows).length);
  assert.equal(report.closureSummary.notApplicable, 0);
  assert.equal(report.fullP15_1ClosureSatisfied, false);
  for (const [id, row] of Object.entries(rows)) assert.equal(assertStrictVerifiedA00Row(id, row), true);
});

test("A00 foundational authority fragment strictly closes stable requirement identity and supersession tracking", () => {
  const stableId = rows["CCR-00002"];
  assert.equal(stableId.requirement, "**Single requirements authority** — every approved James requirement gets a stable requirement ID.");
  assert.deepEqual(stableId.canonicalSourceIds, ["F-0002"]);
  assert.deepEqual(stableId.owningPhases, ["P1.1"]);
  assert.deepEqual(stableId.dependencies, ["C0"]);
  assert.ok(stableId.implementationLocations.some((ref) => ref.includes("identifiers.ts#ID_PREFIXES.requirement")));
  assert.ok(stableId.evidenceVersion.includes("ci:40340212006"));

  const supersession = rows["CCR-00006"];
  assert.equal(supersession.requirement, "**Supersession tracking** — newer decisions explicitly supersede older ones.");
  assert.deepEqual(supersession.canonicalSourceIds, ["F-0006"]);
  assert.deepEqual(supersession.owningPhases, ["P1.6"]);
  assert.deepEqual(supersession.dependencies, ["C0"]);
  assert.ok(supersession.implementationLocations.some((ref) => ref.includes("ledger.ts#LedgerEntry.supersedes")));
  assert.ok(supersession.evidenceVersion.includes("ci:40340212006"));
});
