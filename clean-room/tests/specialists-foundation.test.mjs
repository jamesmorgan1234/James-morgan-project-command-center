import test from "node:test";
import assert from "node:assert/strict";
import {
  SpecialistRegistry,
  SPECIALIST_ARCHETYPES,
  ARO_PROFILE,
  ARO_GOVERNING_INVARIANTS,
  assertAroOpportunityEligible,
  assertSpecialistIsolation,
  canReactivate,
  renameSpecialist
} from "../dist/specialists/index.js";

test("generic specialist framework registers new project types without kernel rewrite", () => {
  const registry = new SpecialistRegistry();
  registry.registerType("custom");
  registry.register({ projectId: "custom-1", typeKey: "custom", displayName: "Custom", contract: { key: "custom", truthOwner: "specialist:custom", dataDomains: ["records"], brainCapabilities: [], agencyCapabilities: [], projectDetailSections: ["overview"], metricKeys: [], providerCapabilities: [], isolationClass: "specialist:custom" }, sourceRefs: ["owner"], active: true });
  assert.equal(registry.get("custom-1").displayName, "Custom");
  assert.equal(registry.remove("custom-1").projectId, "custom-1");
});

test("canonical specialist archetypes preserve truth ownership rather than duplicate it in Command Center", () => {
  assert.equal(SPECIALIST_ARCHETYPES.shopping.truthOwner, "specialist:shopping");
  assert.ok(SPECIALIST_ARCHETYPES.media.dataDomains.includes("rights"));
  assert.ok(SPECIALIST_ARCHETYPES.commerce.dataDomains.includes("suppliers"));
  assert.ok(SPECIALIST_ARCHETYPES.digital_products.projectDetailSections.includes("delivery"));
  assert.ok(SPECIALIST_ARCHETYPES.service_business.dataDomains.includes("contracts"));
  assert.ok(SPECIALIST_ARCHETYPES.software_platform.dataDomains.includes("repository"));
});

test("ARO is a first-class private revenue-operation specialist with banked-revenue truth", () => {
  assert.equal(ARO_PROFILE.typeKey, "revenue_operation");
  assert.equal(ARO_GOVERNING_INVARIANTS.privateSingleOwner, true);
  assert.equal(ARO_GOVERNING_INVARIANTS.publicSaasFeaturesAllowed, false);
  assert.equal(ARO_GOVERNING_INVARIANTS.finalRevenueState, "BANKED");
  assert.equal(ARO_GOVERNING_INVARIANTS.currentRegressionEvidence, "333/333");
  assert.equal(ARO_GOVERNING_INVARIANTS.realProductionProofState, "FIRST_REAL_BANKED_DOLLAR_NOT_YET_VERIFIED");
});

test("ARO opportunity admission requires real/open/AI-allowed/economic/executable/payable evidence", () => {
  assert.doesNotThrow(() => assertAroOpportunityEligible({ real: true, open: true, aiAllowed: true, economicallyWorthwhile: true, executable: true, payable: true }));
  assert.throws(() => assertAroOpportunityEligible({ real: true, open: true, aiAllowed: false, economicallyWorthwhile: true, executable: true, payable: true }));
});

test("specialist truth collisions fail closed and rename preserves canonical project identity", () => {
  assert.throws(() => assertSpecialistIsolation([{ projectId: "a", typeKey: "shopping", truthOwner: "specialist:shopping", canonicalRef: "offer:1", providerRefs: [], sourceRefs: ["a"], status: "active" }, { projectId: "b", typeKey: "shopping", truthOwner: "personal-core", canonicalRef: "offer:1", providerRefs: [], sourceRefs: ["b"], status: "active" }]));
  const renamed = renameSpecialist(ARO_PROFILE, "ARO Revenue Org");
  assert.equal(renamed.projectId, "aro");
  assert.equal(renamed.displayName, "ARO Revenue Org");
});

test("dormant specialist reactivation requires all declared provider capabilities", () => {
  assert.equal(canReactivate({ ...ARO_PROFILE, active: false }, ["opportunity_read", "submission_prepare", "payment_read"]), true);
  assert.equal(canReactivate({ ...ARO_PROFILE, active: false }, ["opportunity_read"]), false);
});
