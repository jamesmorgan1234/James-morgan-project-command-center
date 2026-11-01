/**
 * P15.1 reviewed mappings for CCR-00007, CCR-00008, CCR-00077, CCR-00078,
 * CCR-00080 and CCR-00094: decisions, rationale and typed registries.
 */

const MODULE = "clean-room/src/kernel/decisions.ts";
const SUITE = "clean-room/tests/category1-decisions.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source decision and registry contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, capability, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
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

export function reviewedDecisionMappings() {
  return [
    row("CCR-00007", "Owner Authority / Governance", "architectureDecisionRecord",
      "P1.x architecture decision records capture significant choices",
      "Significant architectural choices require a complete ADR with context, decision and consequences."),
    row("CCR-00008", "Owner Authority / Governance", "assertDecisionHistory",
      "P1.x decision rationale is preserved",
      "Rationale is mandatory and preserved across the decision history."),
    row("CCR-00077", "Client Shell / PWA / Navigation", "defineRegistry",
      "P1.x screen registry",
      "Screens register once with unique keys and are looked up by key."),
    row("CCR-00078", "Client Shell / PWA / Navigation", "registerInto",
      "P1.x home module registry",
      "Home modules register uniquely and duplicates are refused."),
    row("CCR-00080", "Projects / Portfolio / Roadmaps / Progress", "defineRegistry",
      "P1.x project detail section registry",
      "Project detail sections register once and unknown sections are refused."),
    row("CCR-00094", "Registries / Catalogs / Capability Index", "defineRegistry",
      "P1.x storage provider registry",
      "Storage providers register once with a declared description.")
  ];
}
