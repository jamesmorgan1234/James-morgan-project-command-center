import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateRequirementTraceability } from "../scripts/category15-requirement-traceability-validation.mjs";

const builder=readFileSync(new URL("../scripts/category15-build-requirement-traceability.mjs",import.meta.url),"utf8");
const gate=readFileSync(new URL("../scripts/category15-phase-gate-audit.mjs",import.meta.url),"utf8");
const authority=JSON.parse(readFileSync(new URL("../evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json",import.meta.url),"utf8"));

const testDimension = (applicable=false) => ({ applicable, references: applicable ? ["clean-room/tests/example.test.mjs"] : [], justification: applicable ? null : "This test dimension is explicitly not applicable to the requirement." });
const closedRow = (overrides={}) => ({
  id: "CCR-00001",
  requirement: "Example requirement",
  authoritativeSource: "RECOVERED_ORIGINAL:04_MASTER_RECONCILED_REQUIREMENTS(1).csv#CCR-00001",
  sourceVersion: "1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2",
  applicableCompaniesOrCapabilities: ["COMMAND_CENTER"],
  owningPhases: ["P15.1"],
  dependencies: [],
  dependenciesVerified: true,
  implementationLocations: ["clean-room/src/example.mjs"],
  tests: { positive: testDimension(true), negative: testDimension(false), failurePath: testDimension(false) },
  evidence: ["clean-room/evidence/example.json"],
  evidenceVersion: "example-sha",
  evidenceEnvironment: "CI",
  truthState: "VERIFIED",
  blocker: null,
  justification: null,
  ...overrides
});
const traceability = (row) => ({
  schemaVersion: 2,
  status: "P15_1_REQUIREMENT_CLOSURE",
  generatedFromAuthoritativeSource: true,
  canonicalRequirementCount: 1,
  requirements: [row]
});

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

test("P15.1 traceability builder requires exact recovered CSV hash and emits explicit unverified schema-v2 fields",()=>{
  assert.match(builder,/1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2/);
  assert.match(builder,/parsed\.length !== 5825/);
  assert.match(builder,/new_canonical_requirement_count !== 27/);
  assert.match(builder,/owner_review_canonical_requirement_total !== 5852/);
  assert.match(builder,/schemaVersion: 2/);
  assert.match(builder,/dependenciesVerified: false/);
  assert.match(builder,/failurePath:/);
  assert.match(builder,/evidenceEnvironment: ""/);
  assert.match(builder,/truthState: "UNVERIFIED"/);
  assert.match(builder,/TRACEABILITY_SCAFFOLD_UNVERIFIED/);
});

test("P15.1 validator accepts a genuinely closed verified row",()=>{
  const result=validateRequirementTraceability(traceability(closedRow()),{expectedCount:1});
  assert.equal(result.structureValid,true);
  assert.equal(result.closureComplete,true);
  assert.equal(result.verifiedCount,1);
  assert.equal(result.unverifiedCount,0);
});

test("P15.1 validator never treats an UNVERIFIED scaffold row as closure",()=>{
  const row=closedRow({
    applicableCompaniesOrCapabilities:[], owningPhases:[], dependenciesVerified:false, implementationLocations:[],
    tests:{
      positive:{applicable:null,references:[],justification:null},
      negative:{applicable:null,references:[],justification:null},
      failurePath:{applicable:null,references:[],justification:null}
    },
    evidence:[], evidenceVersion:"", evidenceEnvironment:"", truthState:"UNVERIFIED",
    blocker:"Requirement-level current implementation/test/evidence mapping has not yet been proven for this row."
  });
  const result=validateRequirementTraceability(traceability(row),{expectedCount:1});
  assert.equal(result.structureValid,true);
  assert.equal(result.closureComplete,false);
  assert.equal(result.unverifiedCount,1);
});

test("P15.1 validator requires every UNVERIFIED row to name its blocker",()=>{
  const row=closedRow({
    applicableCompaniesOrCapabilities:[], owningPhases:[], dependenciesVerified:false, implementationLocations:[],
    tests:{
      positive:{applicable:null,references:[],justification:null},
      negative:{applicable:null,references:[],justification:null},
      failurePath:{applicable:null,references:[],justification:null}
    },
    evidence:[], evidenceVersion:"", evidenceEnvironment:"", truthState:"UNVERIFIED", blocker:null
  });
  const result=validateRequirementTraceability(traceability(row),{expectedCount:1});
  assert.equal(result.structureValid,false);
  assert.equal(result.closureComplete,false);
  assert.equal(result.structurallyInvalidRowCount,1);
});

test("P15.1 validator rejects VERIFIED rows with empty implementation/test/evidence closure",()=>{
  const row=closedRow({
    applicableCompaniesOrCapabilities:[], owningPhases:[], dependenciesVerified:false, implementationLocations:[],
    tests:{
      positive:{applicable:null,references:[],justification:null},
      negative:{applicable:null,references:[],justification:null},
      failurePath:{applicable:null,references:[],justification:null}
    },
    evidence:[], evidenceVersion:"", evidenceEnvironment:""
  });
  const result=validateRequirementTraceability(traceability(row),{expectedCount:1});
  assert.equal(result.structureValid,true);
  assert.equal(result.closureComplete,false);
  assert.equal(result.closureInvalidRowCount,1);
});

test("P15.1 validator requires evidence-backed justification for NOT_APPLICABLE rows",()=>{
  const missing=closedRow({truthState:"NOT_APPLICABLE",implementationLocations:[],justification:null});
  assert.equal(validateRequirementTraceability(traceability(missing),{expectedCount:1}).closureComplete,false);
  const justified=closedRow({truthState:"NOT_APPLICABLE",implementationLocations:[],justification:"The recovered requirement is superseded by an explicitly evidenced non-applicability condition for this implementation."});
  const result=validateRequirementTraceability(traceability(justified),{expectedCount:1});
  assert.equal(result.closureComplete,true);
  assert.equal(result.notApplicableCount,1);
});

test("P15.1 validator rejects broken canonical ID continuity",()=>{
  const result=validateRequirementTraceability(traceability(closedRow({id:"CCR-00002"})),{expectedCount:1});
  assert.equal(result.structureValid,false);
  assert.equal(result.closureComplete,false);
});

test("P15.1 gate distinguishes source recovery, structure, and complete row-level closure",()=>{
  assert.match(gate,/SOURCE_RECOVERED_TRACEABILITY_OPEN/);
  assert.match(gate,/requirementTraceabilityStructureValid/);
  assert.match(gate,/requirementTraceabilityClosureComplete/);
  assert.match(gate,/validateRequirementTraceability/);
  assert.match(gate,/p15_1_through_14_unverified_count/);
  assert.match(gate,/n >= 1 && n <= 14/);
});
