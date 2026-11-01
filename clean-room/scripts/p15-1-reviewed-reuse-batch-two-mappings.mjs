/**
 * P15.1 reuse batch two.
 *
 * Rows whose behavior already exists and is asserted by an existing named test,
 * with no new implementation.
 */

const T = "clean-room/tests";

const rows = [
  {
    id: "CCR-00686",
    phase: "P7.2",
    capability: "Deployment / Release / Provenance / Rollback",
    anchor: "clean-room/src/deployment/release-identity.ts#manifestDigest",
    test: `${T}/category7-release-identity.test.mjs :: P7.2 release manifest is signed by hashes`,
    note: "The release manifest is hashed over every entry and the digest identifies the candidate."
  },
  {
    id: "CCR-01007",
    phase: "P7.2",
    capability: "Deployment / Release / Provenance / Rollback",
    anchor: "clean-room/src/deployment/release-identity.ts#verifyManifest",
    test: `${T}/category7-release-identity.test.mjs :: P7.2 release manifest is signed by hashes`,
    note: "Manifest checksums are verified and tampering fails verification."
  },
  {
    id: "CCR-00846",
    phase: "P7.2",
    capability: "Deployment / Release / Provenance / Rollback",
    anchor: "clean-room/src/agency/cutover.ts#validateCutoverPlan",
    test: `${T}/category7-cutover.test.mjs :: P7.2 cutover ships a full replacement developed off production`,
    note: "Production never becomes the test environment; the cutover must ship a full replacement built off production."
  },
  {
    id: "CCR-05597",
    phase: "P13.6",
    capability: "Projects / Portfolio / Roadmaps / Progress",
    anchor: "clean-room/src/analytics/recommendation-impact.ts#linkAcceptedRecommendation",
    test: `${T}/category13-recommendation-impact.test.mjs :: P13.6 accepted recommendation links to a roadmap unit`,
    note: "Acceptance produces a structured roadmap unit link rather than silent code."
  }
];

const provenance =
  "Reuse mapping: the behavior already exists in the current tree and the named test asserts it at the qualified HEAD; no new implementation was required.";

export function reviewedReuseBatchTwoMappings() {
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
