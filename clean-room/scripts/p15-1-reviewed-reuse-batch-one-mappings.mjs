/**
 * P15.1 reuse batch one.
 *
 * Rows whose behavior already exists in the current tree and is asserted by an
 * existing named test. No new implementation is introduced; only the reviewed
 * requirement-to-anchor bindings.
 */

const T = "clean-room/tests";

const rows = [
  {
    id: "CCR-02647",
    phase: "P7.2",
    capability: "Agent / Execution Infrastructure",
    anchor: "clean-room/src/agency/blocked-status.ts#blockedStatus",
    test: `${T}/category7-blocked-status.test.mjs :: P7.2 agent surfaces capability missing instead of inventing execution`,
    note: "A missing capability yields the distinct capability-missing status without fabricated execution."
  },
  {
    id: "CCR-05006",
    phase: "P7.2",
    capability: "Brain / Reason / Contradiction",
    anchor: "clean-room/src/security/data-sensitivity.ts#projectForSurface",
    test: `${T}/category7-data-sensitivity.test.mjs :: P7.2 sensitive data is minimized in brain context`,
    note: "Brain context projection redacts sensitive and secret values."
  },
  {
    id: "CCR-05008",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/data-sensitivity.ts#projectForSurface",
    test: `${T}/category7-data-sensitivity.test.mjs :: P7.2 sensitive data is minimized in notifications`,
    note: "Notification projection redacts private, sensitive and secret values."
  },
  {
    id: "CCR-05009",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/data-sensitivity.ts#projectForSurface",
    test: `${T}/category7-data-sensitivity.test.mjs :: P7.2 sensitive data is minimized in exports by default`,
    note: "Default export projection redacts sensitive and secret values."
  },
  {
    id: "CCR-05093",
    phase: "P7.2",
    capability: "Security / Privacy / Trust / Incident Response",
    anchor: "clean-room/src/security/leak-prevention.ts#registerComplianceModule",
    test: `${T}/category7-leak-prevention.test.mjs :: P7.2 compliance modules cannot silently alter core owner rules`,
    note: "A compliance module that can alter core owner rules is refused registration."
  },
  {
    id: "CCR-02567",
    phase: "P13.6",
    capability: "Projects / Portfolio / Roadmaps / Progress",
    anchor: "clean-room/src/analytics/recommendation-impact.ts#linkAcceptedRecommendation",
    test: `${T}/category13-recommendation-impact.test.mjs :: P13.6 accepted recommendation links to a roadmap unit`,
    note: "An accepted recommendation must carry a roadmap unit reference."
  },
  {
    id: "CCR-00850",
    phase: "P7.2",
    capability: "Deployment / Release / Provenance / Rollback",
    anchor: "clean-room/src/agency/cutover.ts#validateCutoverPlan",
    test: `${T}/category7-cutover.test.mjs :: P7.2 cutover dry run is required`,
    note: "The cutover rehearsal is enforced as a completed dry run before cutover."
  }
];

const deps = ["C1", "C2", "C3", "C5", "C6"];
const provenance =
  "Reuse mapping: the behavior already exists in the current tree and the named test asserts it at the qualified HEAD; no new implementation was required.";

export function reviewedReuseBatchOneMappings() {
  return rows.map((row) => ({
    id: row.id,
    owningPhases: [row.phase],
    dependencies: row.phase === "P13.6" ? ["C0", "C1", "C2", "C3"] : deps,
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
