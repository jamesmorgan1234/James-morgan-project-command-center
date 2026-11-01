/**
 * P15.1 reviewed mappings for CCR-01454..CCR-01480 (unverified subset):
 * release candidate identity and immutability, manifest signing, provenance,
 * diagnostics, measured health, separated owner acceptance and final audits.
 */

const MODULE = "clean-room/src/deployment/release-identity.ts";
const SUITE = "clean-room/tests/category7-release-identity.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const DEPLOY = "Deployment / Release / Provenance / Rollback";

const provenance =
  "Current-source release identity contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedReleaseIdentityMappings() {
  return [
    row("CCR-01454", DEPLOY, "compatibilityBridge", "P7.2 compatibility bridge covers forward-only schema changes",
      "A forward-only schema change requires an expand-then-contract bridge and must advance the version."),
    row("CCR-01455", DEPLOY, "createReleaseCandidate", "P7.2 release candidate identifier",
      "A release candidate carries an id, code SHA and config fingerprint."),
    row("CCR-01456", DEPLOY, "assertCandidateUnchanged", "P7.2 accepted release candidate is immutable",
      "An accepted candidate cannot be reused without an acceptance record."),
    row("CCR-01457", DEPLOY, "assertCandidateUnchanged", "P7.2 code change after acceptance requires a new candidate",
      "A code SHA change after acceptance forces a new release candidate."),
    row("CCR-01458", DEPLOY, "assertCandidateUnchanged", "P7.2 critical config change after acceptance requires a new candidate",
      "A critical config change after acceptance forces a new release candidate."),
    row("CCR-01459", DEPLOY, "manifestDigest", "P7.2 release manifest is signed by hashes",
      "The release manifest is hashed over every entry and tampering fails verification."),
    row("CCR-01461", "Agent / Execution Infrastructure", "releaseProvenance", "P7.2 CI run provenance is recorded",
      "CI run and job identifiers are recorded and required."),
    row("CCR-01462", DEPLOY, "releaseProvenance", "P7.2 deployment run provenance is recorded",
      "The deployment run identifier is recorded and required."),
    row("CCR-01463", DEPLOY, "healthDiagnostics", "P7.2 live version is diagnosable",
      "Health diagnostics expose the live production version."),
    row("CCR-01464", DEPLOY, "healthDiagnostics", "P7.2 production SHA is retrievable from health diagnostics",
      "The production SHA is retrievable from health/advanced diagnostics."),
    row("CCR-01465", DEPLOY, "healthDiagnostics", "P7.2 schema version is retrievable",
      "The schema version is retrievable from diagnostics."),
    row("CCR-01466", "Client Shell / PWA / Navigation", "healthDiagnostics", "P7.2 PWA cache version is retrievable",
      "The PWA cache version is retrievable from diagnostics."),
    row("CCR-01467", DEPLOY, "healthDiagnostics", "P7.2 module versions are retrievable",
      "Module versions are retrievable from diagnostics."),
    row("CCR-01468", "Brain / Reason / Contradiction", "healthDiagnostics", "P7.2 brain policy version is retrievable",
      "The brain policy version is retrievable from diagnostics."),
    row("CCR-01469", "Agent / Execution Infrastructure", "healthDiagnostics", "P7.2 agent policy version is retrievable",
      "The agent policy version is retrievable from diagnostics."),
    row("CCR-01470", "Client Shell / PWA / Navigation", "diagnosticsVisible", "P7.2 diagnostics do not clutter normal screens",
      "Internal versions are visible only on the health surface, not normal screens."),
    row("CCR-01471", DEPLOY, "releaseHealthScore", "P7.2 release health is composed from measured checks",
      "Release health is a measured pass ratio over named checks, not an arbitrary percentage."),
    row("CCR-01473", DEPLOY, "acceptanceState", "P7.2 owner visual acceptance is separate",
      "Owner visual acceptance is tracked separately and blocks completion on its own."),
    row("CCR-01474", DEPLOY, "acceptanceState", "P7.2 owner behavioral acceptance is separate",
      "Owner behavioral acceptance is tracked separately and blocks completion on its own."),
    row("CCR-01477", DEPLOY, "assertNoTemporaryExceptions", "P7.2 no hidden temporary exceptions at acceptance",
      "Any non-permanent exception present at acceptance fails the check."),
    row("CCR-01478", DEPLOY, "everyFileAudit", "P7.2 final every-file audit",
      "The final audit is complete only when every file is reviewed."),
    row("CCR-01479", DEPLOY, "dependencyAudit", "P7.2 final dependency audit",
      "Unexpected dependencies are surfaced and block audit completion."),
    row("CCR-01480", DEPLOY, "deadCodeAudit", "P7.2 final dead-code audit",
      "Unreferenced symbols are surfaced and block audit completion.")
  ];
}
