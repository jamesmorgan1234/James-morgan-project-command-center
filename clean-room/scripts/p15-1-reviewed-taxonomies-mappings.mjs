/**
 * P15.1 reviewed mappings for CCR-00009..CCR-00015:
 * glossary, shared state vocabulary, and the five canonical taxonomies.
 */

const MODULE = "clean-room/src/kernel/taxonomies.ts";
const SUITE = "clean-room/tests/category1-taxonomies.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source vocabulary and taxonomy contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedTaxonomyMappings() {
  return [
    row("CCR-00009", "Projects / Portfolio / Roadmaps / Progress", "glossaryTerm",
      "P1.x terminology glossary defines one meaning per term",
      "Project, Run, Task, Checkpoint, Verified and Ready each have exactly one definition."),
    row("CCR-00010", "Agent / Execution Infrastructure", "assertSharedVocabulary",
      "P1.x canonical state vocabulary is shared across surfaces",
      "Database, frontend, Brain, Agent and test vocabularies must be identical."),
    row("CCR-00011", "Finance / Budgets / Runway / Forecasts", "defineTaxonomy",
      "P1.x canonical error taxonomy",
      "Errors are defined once with stable lowercase codes."),
    row("CCR-00012", "Finance / Budgets / Runway / Forecasts", "defineTaxonomy",
      "P1.x canonical blocker taxonomy",
      "Blockers are defined once and completeness can be asserted."),
    row("CCR-00013", "Finance / Budgets / Runway / Forecasts", "defineTaxonomy",
      "P1.x canonical authorization taxonomy",
      "Authorization states are defined once and looked up by code."),
    row("CCR-00014", "Finance / Budgets / Runway / Forecasts", "defineTaxonomy",
      "P1.x canonical risk taxonomy",
      "Risk levels are defined once with duplicate codes refused."),
    row("CCR-00015", "Finance / Budgets / Runway / Forecasts", "defineTaxonomy",
      "P1.x canonical evidence taxonomy",
      "Evidence strengths are defined once with an empty taxonomy refused.")
  ];
}
