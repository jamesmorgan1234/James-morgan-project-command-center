import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const builder=readFileSync(new URL("../scripts/category15-build-requirement-traceability.mjs",import.meta.url),"utf8");
const gate=readFileSync(new URL("../scripts/category15-phase-gate-audit.mjs",import.meta.url),"utf8");
const authority=JSON.parse(readFileSync(new URL("../evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json",import.meta.url),"utf8"));

test("P15.1 recovered original source authority is exact and non-fabricating",()=>{
  assert.equal(authority.status,"RECOVERED_ORIGINAL_VERIFIED");
  assert.equal(authority.canonicalCsv.rowCount,5825);
  assert.equal(authority.canonicalCsv.firstId,"CCR-00001");
  assert.equal(authority.canonicalCsv.lastId,"CCR-05825");
  assert.equal(authority.canonicalCsv.sha256,"1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2");
  assert.equal(authority.canonicalJson.sha256,"0df16348d2117b86f8cbe050dc7263e1f965009034c9715cd45f5f2e72b61a2e");
  assert.equal(authority.historicalPackage.sha256,"fa9d8e57ba595f5ba507074c7eb0d2bc8840ad16b3750f47b6679ff146c6cc8a");
  assert.equal(authority.truth.fullRequirementToImplementationEvidenceClosureComplete,false);
});

test("P15.1 traceability builder requires exact recovered CSV hash and all 5852 IDs",()=>{
  assert.match(builder,/1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2/);
  assert.match(builder,/parsed\.length !== 5825/);
  assert.match(builder,/new_canonical_requirement_count !== 27/);
  assert.match(builder,/owner_review_canonical_requirement_total !== 5852/);
  assert.match(builder,/truthState: "UNVERIFIED"/);
  assert.match(builder,/TRACEABILITY_SCAFFOLD_UNVERIFIED/);
});

test("P15.1 gate distinguishes recovered source from full row-level closure",()=>{
  assert.match(gate,/SOURCE_RECOVERED_TRACEABILITY_OPEN/);
  assert.match(gate,/requirementTraceabilityPath/);
  assert.match(gate,/originalHistoricalLedgerRecovered/);
  assert.match(gate,/implementationLocations/);
  assert.match(gate,/tests/);
  assert.match(gate,/evidence/);
});
