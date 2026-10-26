import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const crosswalk = readFileSync("../roadmap/portfolio-future-architecture/126_34_FAMILY_POST_AUDIT_COVERAGE_CROSSWALK.md", "utf8");
const authorityAudit = readFileSync("scripts/current-authority-audit.mjs", "utf8");

const EXPECTED_FAMILIES = Object.freeze([
  "Stable identity, tenancy and scope",
  "Machine identity and delegation",
  "Policy and protected-action intents",
  "Source registry and incremental refresh",
  "Untrusted input / prompt injection",
  "Provenance and immutable evidence",
  "Typed lineage graph",
  "Machine contracts and compatibility",
  "Provider/integration registry",
  "Durable events, queues and replay",
  "Temporal engine",
  "Document/file/multimodal pipeline",
  "Sensitivity/privacy/purpose metadata",
  "Retention/deletion/hold/portability",
  "Sovereignty/provider-region routing",
  "Brain Factory/domain packs",
  "Agent Factory/delegated execution",
  "Model/provider routing and AI resources",
  "Resource governor",
  "Financial governor/truth",
  "Metering/billing/entitlements",
  "Testing/evals/independent verification",
  "Release/deployment/migration",
  "Reliability/incidents/safe mode/kill",
  "Backup/restore/recovery proof",
  "Customer/company operations",
  "Public presence/communications",
  "Supply-chain/software integrity",
  "Marketplace/transaction primitives",
  "Regulated/jurisdiction packs",
  "Internationalization/accessibility",
  "Mobile/voice/multimodal",
  "Experimentation/improvement",
  "Portability/sunset/decommission"
]);

function parseFamilyRows(markdownSection) {
  return [...markdownSection.matchAll(/^\|\s*(\d+)\.\s*([^|]+?)\s*\|/gm)].map((match) => ({
    number: Number(match[1]),
    name: match[2].trim()
  }));
}

const additiveMarker = "## Ecosystem-intelligence additive mapping (PIF)";
const coverageRulesMarker = "## Coverage rules";
const additiveStart = crosswalk.indexOf(additiveMarker);
const coverageRulesStart = crosswalk.indexOf(coverageRulesMarker);
assert.notEqual(additiveStart, -1, "PIF additive mapping section missing");
assert.notEqual(coverageRulesStart, -1, "Coverage rules section missing");

const primarySection = crosswalk.slice(0, additiveStart);
const additiveSection = crosswalk.slice(additiveStart, coverageRulesStart);
const primaryRows = parseFamilyRows(primarySection);
const additiveRows = parseFamilyRows(additiveSection);
const expectedNumbers = Array.from({ length: 34 }, (_, index) => index + 1);

test("Task 10: the canonical capability-family taxonomy remains exactly 34 families", () => {
  assert.equal(primaryRows.length, 34);
  assert.deepEqual(primaryRows.map((row) => row.number), expectedNumbers);
  assert.deepEqual(primaryRows.map((row) => row.name), EXPECTED_FAMILIES);
  assert.equal(new Set(primaryRows.map((row) => row.number)).size, 34);
  assert.equal(new Set(primaryRows.map((row) => row.name)).size, 34);
});

test("Task 10: PIF integration preserves all 34 families one-for-one without replacement or a competing taxonomy", () => {
  assert.equal(additiveRows.length, 34);
  assert.deepEqual(additiveRows.map((row) => row.number), expectedNumbers);
  assert.deepEqual(additiveRows.map((row) => row.name), EXPECTED_FAMILIES);
  assert.deepEqual(additiveRows, primaryRows);
  assert.match(crosswalk, /This additive mapping closes the Work-audit gap without replacing the 34-family taxonomy/);
  assert.match(crosswalk, /does not create a second capability taxonomy/);
});

test("Task 10: the 34-family crosswalk remains current authority-linked and preserves isolation and truth-status boundaries", () => {
  assert.match(crosswalk, /Status:\*\* CURRENT P0\.11 \+ POST-INTEGRATION PIF COVERAGE EVIDENCE/);
  assert.match(crosswalk, /20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT\.md/);
  assert.match(crosswalk, /23_CURRENT_199_PHASE_MACHINE_MANIFEST\.json/);
  assert.match(crosswalk, /Every family remains subject to company\/project\/environment isolation and proven-before-share rules/);
  assert.match(crosswalk, /Coverage is not operational proof/);
  assert.match(crosswalk, /All 34 existing capability families have explicit accepted control ownership, phase\/timing ownership, and additive ecosystem-intelligence coverage/);
});

test("Task 10: current-authority audit independently requires exactly families 1 through 34 in the PIF mapping", () => {
  assert.match(authorityAudit, /126_34_FAMILY_POST_AUDIT_COVERAGE_CROSSWALK\.md/);
  assert.match(authorityAudit, /uniqueFamilyNumbers\.size !== 34/);
  assert.match(authorityAudit, /\[\.\.\.Array\(34\)\]/);
  assert.match(authorityAudit, /pifMappedCapabilityFamilyCount: uniqueFamilyNumbers\.size/);
});
