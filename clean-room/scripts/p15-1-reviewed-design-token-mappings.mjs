/** P15.1 reviewed mappings: CCR-00229, CCR-00230, CCR-00232, CCR-00239, CCR-00253, CCR-00255. */

const MODULE = "clean-room/src/design/tokens.ts";
const SUITE = "clean-room/tests/category1-design-tokens.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const CAP = "Client Shell / PWA / Navigation";
const provenance = "Current-source design-scale contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedDesignTokenMappings() {
  return [
    row("CCR-00229", "defineScale", "P1.x margin scale", "The margin scale is positive and strictly ascending."),
    row("CCR-00230", "defineScale", "P1.x typography scale", "The typography scale is declared and nonempty."),
    row("CCR-00232", "defineScale", "P1.x border scale", "The border scale is positive and ascending."),
    row("CCR-00239", "cardHeightClass", "P1.x card height classes", "Card heights resolve to the compact, standard and tall classes only."),
    row("CCR-00253", "assertTokenValue", "P1.x no arbitrary component sizing", "Sizing must come from a declared token scale."),
    row("CCR-00255", "assertNoGiantGap", "P1.x no giant unexplained vertical gaps", "Vertical gaps beyond the maximum are refused.")
  ];
}
