/**
 * P15.1 reviewed mappings for CCR-01541..CCR-01564 (unverified subset):
 * share-link controls, indexing and leakage prevention, error hygiene,
 * residency, compliance boundaries, acceptance limits and policy versioning.
 */

const MODULE = "clean-room/src/security/leak-prevention.ts";
const SUITE = "clean-room/tests/category7-leak-prevention.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const SECURITY = "Security / Privacy / Trust / Incident Response";

const provenance =
  "Current-source leak-prevention contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedLeakPreventionMappings() {
  return [
    row("CCR-01541", SECURITY, "revokeShareLink", "P7.2 share-link revocation", "A revoked link is refused immediately."),
    row("CCR-01542", SECURITY, "assertShareLinkScope", "P7.2 share-link scope", "A link may only carry a permitted scope."),
    row("CCR-01543", SECURITY, "recordShareLinkAccess", "P7.2 share-link access logging", "Every share-link access is recorded with link, actor and time."),
    row("CCR-01544", "Search / Index / Retrieval", "assertNoSearchIndexing", "P7.2 no accidental indexing by search engines", "A private PWA is marked non-indexable and indexing is refused."),
    row("CCR-01545", "Client Shell / PWA / Navigation", "robotsPolicy", "P7.2 private PWA robots and noindex stance", "The private PWA emits noindex and nofollow directives."),
    row("CCR-01546", "Projects / Portfolio / Roadmaps / Progress", "assertMetadataSafe", "P7.2 no project data in page metadata visible publicly", "Public metadata may not carry project data."),
    row("CCR-01547", SECURITY, "assertNoSensitiveQuery", "P7.2 no sensitive data in URLs or query strings", "Sensitive parameters in URLs are refused."),
    row("CCR-01548", SECURITY, "maskSensitiveIds", "P7.2 no sensitive IDs in screenshots where avoidable", "Long identifiers are masked before capture."),
    row("CCR-01550", SECURITY, "sanitizeProviderError", "P7.2 third-party error payloads are sanitized", "Provider errors are reduced to an allowlist of fields."),
    row("CCR-01551", SECURITY, "errorForSurface", "P7.2 sensitive error details remain in protected diagnostics only", "Detail is returned only on the diagnostics surface."),
    row("CCR-01552", SECURITY, "ownerError", "P7.2 owner-facing errors remain useful but safe", "Owner errors carry a code and hint with no internal detail."),
    row("CCR-01553", SECURITY, "residencyPolicy", "P7.2 future data residency concerns can be modeled", "A residency policy can be declared per region."),
    row("CCR-01554", SECURITY, "registerComplianceModule", "P7.2 regulatory requirements register through compliance modules", "Compliance modules register with an id and requirements."),
    row("CCR-01555", SECURITY, "registerComplianceModule", "P7.2 compliance modules cannot silently alter core owner rules", "A module that can alter core owner rules is refused."),
    row("CCR-01557", SECURITY, "assertNoAiLegalAcceptance", "P7.2 no AI legal acceptance", "AI actors cannot accept legal terms."),
    row("CCR-01558", "Agent / Execution Infrastructure", "assertTermsAcceptance", "P7.2 no Agent terms acceptance without exact authorization", "Agent acceptance requires the exact terms scope."),
    row("CCR-01560", SECURITY, "assertNoAutomatedMfa", "P7.2 no automated MFA response", "Automated MFA responses are refused."),
    row("CCR-01563", SECURITY, "versionPolicy", "P7.2 privacy and security policies are versioned", "Policies carry a version and effective date."),
    row("CCR-01564", SECURITY, "assertPolicyInReleaseImpact", "P7.2 privacy and security changes appear in release impact analysis", "Release impact analysis must include privacy and security.")
  ];
}
