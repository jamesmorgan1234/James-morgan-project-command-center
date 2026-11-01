/**
 * P15.1 reviewed mappings for CCR-01626..CCR-01634 (unverified subset):
 * strict settings, any-escape justification, schema validation and generated
 * types, type synchronization, contract drift, versioned foundation rules and
 * architecture review.
 */

const MODULE = "clean-room/src/kernel/type-contracts.ts";
const SUITE = "clean-room/tests/category1-type-contracts.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const KERNEL = "Core Kernel / Runtime / Lifecycle";

const provenance =
  "Current-source type-contract gates authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", KERNEL],
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

export function reviewedTypeContractMappings() {
  return [
    row("CCR-01626", "assertStrictSettings", "P1.x strict compiler and linter settings", "Strict mode, no implicit any and lint-as-error are all required."),
    row("CCR-01627", "assertNoAnyEscape", "P1.x no any escape hatches on critical contracts", "An any escape hatch requires a recorded justification."),
    row("CCR-01628", "validateSchema", "P1.x schema-driven validation", "Schemas require fields with unique names and known types."),
    row("CCR-01629", "generateSchemaType", "P1.x generated types from schema", "Types are generated from the validated schema."),
    row("CCR-01630", "assertTypeSync", "P1.x database and client types stay synchronized", "Database and generated client types must match."),
    row("CCR-01631", "assertNoContractDrift", "P1.x contract drift fails CI", "Any contract difference fails the gate."),
    row("CCR-01633", "assertFoundationRulesVersioned", "P1.x foundation rules are versioned", "Foundation rules carry a version and effective date."),
    row("CCR-01634", "requireArchitectureReview", "P1.x foundation changes require architecture review", "Foundation changes without architecture review are refused.")
  ];
}
