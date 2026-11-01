/**
 * P15.1 reuse batch three.
 *
 * Rows already implemented and asserted by existing named tests.
 */

const T = "clean-room/tests";

const rows = [
  {
    id: "CCR-01919",
    phase: "P7.2",
    capability: "Deployment / Release / Provenance / Rollback",
    anchor: "clean-room/src/deployment/release-identity.ts#assertNoTemporaryExceptions",
    test: `${T}/category7-release-identity.test.mjs :: P7.2 no hidden temporary exceptions at acceptance`,
    note: "Any non-permanent exception present at acceptance fails the gate."
  },
  {
    id: "CCR-04993",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/data-sensitivity.ts#SENSITIVITY_CLASSES",
    test: `${T}/category7-data-sensitivity.test.mjs :: P7.2 sensitivity classes are public private sensitive and secret`,
    note: "The four sensitivity classes are declared explicitly."
  },
  {
    id: "CCR-05007",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/data-sensitivity.ts#projectForSurface",
    test: `${T}/category7-data-sensitivity.test.mjs :: P7.2 sensitive data is minimized in logs`,
    note: "Log projection redacts sensitive and secret values."
  },
  {
    id: "CCR-05092",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/leak-prevention.ts#registerComplianceModule",
    test: `${T}/category7-leak-prevention.test.mjs :: P7.2 regulatory requirements register through compliance modules`,
    note: "Future compliance modules register through a bounded module contract."
  },
  {
    id: "CCR-05562",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/data-sensitivity.ts#projectForSurface",
    test: `${T}/category7-data-sensitivity.test.mjs :: P7.2 sensitive data is minimized in notifications`,
    note: "Notification projection redacts private, sensitive and secret values."
  },
  {
    id: "CCR-05363",
    phase: "P7.2",
    capability: "Client Shell / PWA / Navigation",
    anchor: "clean-room/src/deployment/final-acceptance.ts#productionAcceptance",
    test: `${T}/category7-final-acceptance.test.mjs :: P7.2 final Samsung installed-PWA acceptance`,
    note: "Samsung installed-PWA acceptance is an independent gate on production acceptance."
  },
  {
    id: "CCR-05809",
    phase: "P7.2",
    capability: "Deployment / Release / Provenance / Rollback",
    anchor: "clean-room/src/deployment/final-acceptance.ts#productionAcceptance",
    test: `${T}/category7-final-acceptance.test.mjs :: P7.2 final Samsung installed-PWA acceptance`,
    note: "Technical deployment does not satisfy the physical Samsung acceptance gate."
  },
  {
    id: "CCR-02562",
    phase: "P13.6",
    capability: "Projects / Portfolio / Roadmaps / Progress",
    anchor: "clean-room/src/analytics/recommendation-impact.ts#linkAcceptedRecommendation",
    test: `${T}/category13-recommendation-impact.test.mjs :: P13.6 accepted recommendation links to a roadmap unit`,
    note: "Adding a recommendation to the roadmap produces a roadmap unit link."
  },
  {
    id: "CCR-04373",
    phase: "P13.6",
    capability: "Projects / Portfolio / Roadmaps / Progress",
    anchor: "clean-room/src/analytics/recommendation-impact.ts#linkAcceptedRecommendation",
    test: `${T}/category13-recommendation-impact.test.mjs :: P13.6 accepted recommendation links to a roadmap unit`,
    note: "The Add to Roadmap action binds the recommendation to a roadmap unit."
  }
];

const provenance =
  "Reuse mapping: the behavior already exists in the current tree and the named test asserts it at the qualified HEAD; no new implementation was required.";

export function reviewedReuseBatchThreeMappings() {
  return rows.map((row) => ({
    id: row.id,
    owningPhases: [row.phase],
    dependencies: row.phase === "P13.6" ? ["C0", "C1", "C2", "C3"] : ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", row.capability],
    implementationLocations: [row.anchor],
    tests: {
      positive: { applicable: true, references: [row.test], justification: null },
      negative: { applicable: true, references: [row.test], justification: null },
      failurePath: { applicable: true, references: [row.test], justification: null }
    },
    evidence: [`${provenance} ${row.note}`],
    closureNotes: row.note
  }));
}
