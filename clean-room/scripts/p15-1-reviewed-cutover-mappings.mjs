/**
 * P15.1 reviewed mappings for CCR-01425..CCR-01445 (unverified subset):
 * full-replacement cutover, staging parity, fixtures, checklist, dry run,
 * duration, dependency freshness, locked release order, smoke test,
 * change freeze and branch protection.
 */

const MODULE = "clean-room/src/agency/cutover.ts";
const SUITE = "clean-room/tests/category7-cutover.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const DEPLOY = "Deployment / Release / Provenance / Rollback";

const provenance =
  "Current-source cutover contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", DEPLOY],
    implementationLocations: [`${MODULE}#${fn}`],
    tests: {
      positive: { applicable: true, references: [t(test)], justification: null },
      negative: { applicable: true, references: [t(test)], justification: null },
      failurePath: { applicable: true, references: [t(test)], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

export function reviewedCutoverMappings() {
  return [
    row("CCR-01425", "validateCutoverPlan", "P7.2 cutover ships a full replacement developed off production",
      "The cutover plan must be a full replacement built off production."),
    row("CCR-01427", "validateCutoverPlan", "P7.2 no partial cutover",
      "A partial cutover plan is refused."),
    row("CCR-01428", "validateCutoverPlan", "P7.2 staging matches the production architecture",
      "Staging must mirror the production architecture before cutover."),
    row("CCR-01429", "validateCutoverPlan", "P7.2 production data in staging is read-only",
      "Production data in staging must be read-only unless isolated and tested."),
    row("CCR-01430", "validateCutoverPlan", "P7.2 staging uses synthetic fixtures",
      "Staging must use synthetic test fixtures."),
    row("CCR-01431", "validateCutoverPlan", "P7.2 cutover checklist is required",
      "A cutover without a checklist is refused."),
    row("CCR-01432", "validateCutoverPlan", "P7.2 cutover dry run is required",
      "A cutover without a completed dry run is refused."),
    row("CCR-01434", "validateCutoverPlan", "P7.2 cutover duration expectation is documented",
      "The expected cutover duration must be recorded."),
    row("CCR-01435", "assertDependenciesFresh", "P7.2 cutover dependencies are verified immediately beforehand",
      "Dependencies verified too early, or after cutover, are refused."),
    row("CCR-01437", "validateCutoverPlan", "P7.2 frontend release order is locked",
      "The frontend release must precede the service-worker release."),
    row("CCR-01438", "validateCutoverPlan", "P7.2 service-worker release order is locked",
      "The service-worker release must precede feature-flag activation."),
    row("CCR-01439", "validateCutoverPlan", "P7.2 feature-flag activation order is locked",
      "Feature-flag activation must precede post-cutover validation."),
    row("CCR-01440", "validateCutoverPlan", "P7.2 post-cutover validation sequence is locked",
      "The validation step must come after feature-flag activation."),
    row("CCR-01441", "validateCutoverPlan", "P7.2 critical-path smoke test follows cutover",
      "A cutover without a critical-path smoke test is refused."),
    row("CCR-01443", "validateCutoverPlan", "P7.2 no feature expansion during the cutover window",
      "Feature expansion is refused inside the cutover window."),
    row("CCR-01444", "validateCutoverPlan", "P7.2 cutover freeze applies to unrelated changes",
      "Unrelated changes must be frozen during cutover."),
    row("CCR-01445", "validateCutoverPlan", "P7.2 production branch is protected",
      "Cutover requires the production branch to be protected.")
  ];
}
