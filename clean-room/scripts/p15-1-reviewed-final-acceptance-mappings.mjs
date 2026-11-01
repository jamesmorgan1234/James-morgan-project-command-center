/**
 * P15.1 reviewed mappings for CCR-01481..CCR-01494 (unverified subset):
 * seven final audits, Samsung installed-PWA acceptance, acceptance only after
 * every audit, a locked checkpoint and new-cycle handling after acceptance.
 */

const MODULE = "clean-room/src/deployment/final-acceptance.ts";
const SUITE = "clean-room/tests/category7-final-acceptance.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const DEPLOY = "Deployment / Release / Provenance / Rollback";

const provenance =
  "Current-source final-acceptance contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedFinalAcceptanceMappings() {
  return [
    row("CCR-01481", DEPLOY, "finalAudit", "P7.2 final legacy-reference audit",
      "The legacy-reference audit passes only with no findings."),
    row("CCR-01482", "Security / Privacy / Trust / Incident Response", "finalAudit", "P7.2 final security audit",
      "The security audit passes only with no findings."),
    row("CCR-01483", DEPLOY, "finalAudit", "P7.2 final architecture audit",
      "The architecture audit passes only with no findings."),
    row("CCR-01484", "Client Shell / PWA / Navigation", "finalAudit", "P7.2 final visual audit",
      "The visual audit passes only with no findings."),
    row("CCR-01485", "Agent / Execution Infrastructure", "finalAudit", "P7.2 final Agent E2E audit",
      "The Agent end-to-end audit passes only with no findings."),
    row("CCR-01486", "Brain / Reason / Contradiction", "finalAudit", "P7.2 final Brain audit",
      "The Brain audit passes only with no findings."),
    row("CCR-01488", "Interoperability / Export / Portable Data", "finalAudit", "P7.2 final portability and export audit",
      "The portability and export audit passes only with no findings."),
    row("CCR-01491", "Client Shell / PWA / Navigation", "productionAcceptance", "P7.2 final Samsung installed-PWA acceptance",
      "Acceptance is blocked until Samsung installed-PWA acceptance is recorded."),
    row("CCR-01492", DEPLOY, "productionAcceptance", "P7.2 production is declared accepted only after every audit",
      "Production acceptance is blocked by any failed audit and clears only when all pass."),
    row("CCR-01493", "Projects / Portfolio / Roadmaps / Progress", "lockAcceptance", "P7.2 acceptance checkpoint is locked",
      "The acceptance checkpoint is frozen and a missing lock is refused."),
    row("CCR-01494", DEPLOY, "assertPostAcceptanceChangeStartsNewCycle", "P7.2 post-acceptance changes start a new roadmap and release cycle",
      "Any change after acceptance requires a new roadmap and release cycle.")
  ];
}
