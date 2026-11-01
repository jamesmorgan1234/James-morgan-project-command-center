/** P15.1 reviewed mappings: CCR-00144, CCR-00145, CCR-00222, CCR-00269, CCR-00271, CCR-00272. */

const MODULE = "clean-room/src/finance/record-integrity.ts";
const SUITE = "clean-room/tests/category1-record-integrity.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const provenance = "Current-source record-integrity contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

const FIN = "Finance / Budgeting / Forecasting / Close";
const SHELL = "Client Shell / PWA / Navigation";
const PROJ = "Projects / Portfolio / Roadmaps / Progress";

export function reviewedIntegrityMappings() {
  return [
    row("CCR-00144", FIN, "deriveRevenue", "P1.x revenue derives only from verified financial evidence", "Revenue sums verified evidence only and refuses unverified entries."),
    row("CCR-00145", SHELL, "assertNoSampleData", "P1.x screenshot sample data cannot enter live records", "Sample and screenshot sources are refused in live records."),
    row("CCR-00222", SHELL, "screenshotReference", "P1.x screenshot references are protected", "Screenshot references must be protected storage keys, not inline data."),
    row("CCR-00269", PROJ, "projectDisplayName", "P1.x long project names", "Long names are truncated for display while the full name is preserved."),
    row("CCR-00271", SHELL, "blockerText", "P1.x long blocker text", "Long blocker text is bounded without losing the record."),
    row("CCR-00272", PROJ, "assertProjectCountSupported", "P1.x large project counts", "Large project counts require paging instead of a full render.")
  ];
}
