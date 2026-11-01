/** P15.1 reviewed mappings: CCR-00168, CCR-00172, CCR-00174, CCR-00180, CCR-00181, CCR-00183, CCR-00184, CCR-00185. */

const MODULE = "clean-room/src/projects/relationships.ts";
const SUITE = "clean-room/tests/category1-relationships.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const CAP = "Projects / Portfolio / Roadmaps / Progress";
const provenance = "Current-source relationship contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", CAP],
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

export function reviewedRelationshipMappings() {
  return [
    row("CCR-00168", "bankReference", "P1.x bank-reference relationships do not expose secrets", "Bank references are opaque tokens and only the last four characters are exposed."),
    row("CCR-00172", "projectDependencies", "P1.x project dependencies", "Dependencies resolve transitively and cycles are refused."),
    row("CCR-00174", "linkProject", "P1.x project-to-domain relationships", "Projects link to domains through typed relationships."),
    row("CCR-00180", "linkProject", "P1.x rule-to-project relationships", "Rules link to projects and unknown kinds are refused."),
    row("CCR-00181", "linkProject", "P1.x decision-to-project relationships", "Decisions link to projects through the same typed relationship."),
    row("CCR-00183", "linkProject", "P1.x agent-run-to-project relationships", "Agent runs link to their project."),
    row("CCR-00184", "linkProject", "P1.x recommendation-to-project relationships", "Recommendations link to their project."),
    row("CCR-00185", "linkProject", "P1.x integration-to-project relationships", "Integrations link to projects and duplicate links are refused.")
  ];
}
