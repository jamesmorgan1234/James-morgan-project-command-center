/**
 * P15.1 reviewed mappings for CCR-01323, CCR-01331 and CCR-01332:
 * recommendation security impact, accepted-to-roadmap linkage and
 * implemented-to-release linkage.
 */

const IMPACT = "clean-room/src/analytics/recommendation-impact.ts";
const RECOMMENDATIONS = "clean-room/src/analytics/recommendations.ts";
const SUITE = "clean-room/tests/category13-recommendation-impact.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source recommendation impact contracts authored for this batch at the qualified HEAD; recommendation validation and lifecycle proof reuse the existing analytics recommendation module.";

function row(id, capability, implementationLocations, test, notes) {
  return {
    id,
    owningPhases: ["P13.6"],
    dependencies: ["C0", "C1", "C2", "C3"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
    implementationLocations,
    tests: {
      positive: { applicable: true, references: [test], justification: null },
      negative: { applicable: true, references: [test], justification: null },
      failurePath: { applicable: true, references: [test], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

export function reviewedRecommendationImpactMappings() {
  return [
    row("CCR-01323", "Security / Privacy / Trust / Incident Response",
      [`${IMPACT}#recommendationSecurityImpact`, `${RECOMMENDATIONS}#validateRecommendation`],
      t("P13.6 recommendation security impact requires review for authorization changes"),
      "A recommendation declares its security impact, and any authorization change is classified protected with review required."),

    row("CCR-01331", "Projects / Portfolio / Roadmaps / Progress",
      [`${IMPACT}#linkAcceptedRecommendation`],
      t("P13.6 accepted recommendation links to a roadmap unit"),
      "An accepted recommendation must carry a nonblank roadmap unit reference and reports accepted status."),

    row("CCR-01332", "Deployment / Release / Provenance / Rollback",
      [`${IMPACT}#linkImplementedRecommendation`],
      t("P13.6 implemented recommendation links to release evidence"),
      "An implemented recommendation must carry release evidence and reports implemented status.")
  ];
}
