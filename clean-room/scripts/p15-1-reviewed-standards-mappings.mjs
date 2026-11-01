/**
 * P15.1 reviewed mappings for CCR-01581..CCR-01600 (unverified subset):
 * shared-utility limits, naming, folder stability, private imports, CSS
 * scoping, design tokens, dynamic styles and duplication detection.
 */

const MODULE = "clean-room/src/kernel/standards.ts";
const SUITE = "clean-room/tests/category1-standards.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const KERNEL = "Core Kernel / Runtime / Lifecycle";

const provenance =
  "Current-source engineering-standards contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedStandardsMappings() {
  return [
    row("CCR-01581", KERNEL, "assertSharedUtility", "P1.x shared utilities are limited to shared primitives", "Primitive helpers are the only accepted shared utilities."),
    row("CCR-01582", KERNEL, "assertSharedUtility", "P1.x domain logic is not dumped into generic utilities", "Domain logic in the shared library is refused."),
    row("CCR-01583", KERNEL, "assertNaming", "P1.x naming conventions are consistent", "Names are checked against the declared convention."),
    row("CCR-01584", KERNEL, "assertStableFolders", "P1.x folder structure is stable", "Folder drift from the approved layout is refused."),
    row("CCR-01587", KERNEL, "assertNoPrivateImport", "P1.x private internals are not imported cross-module", "Imports of internal paths are refused."),
    row("CCR-01588", KERNEL, "assertNoCrossModuleSelector", "P1.x no CSS selector reaches into another module", "Selectors may not target another module's scope."),
    row("CCR-01589", KERNEL, "assertScopedCss", "P1.x CSS is scoped", "Every selector must be scoped to a module."),
    row("CCR-01590", KERNEL, "assertTokenSource", "P1.x design tokens are centralized", "Design values must come from tokens."),
    row("CCR-01591", KERNEL, "assertInlineStyle", "P1.x inline styles are only deliberate dynamic values", "Non-dynamic inline styles are refused."),
    row("CCR-01592", KERNEL, "assertControlledStyleApi", "P1.x dynamic styles pass through controlled APIs", "Dynamic styles must use a controlled component API."),
    row("CCR-01593", KERNEL, "assertTokenValue", "P1.x no magic z-index values", "Z-index values must come from tokens."),
    row("CCR-01594", KERNEL, "assertTokenValue", "P1.x no magic spacing values", "Spacing values must come from tokens."),
    row("CCR-01595", KERNEL, "assertNoDuplicates", "P1.x no duplicated color literals", "Duplicate color literals are refused."),
    row("CCR-01596", KERNEL, "assertNoDuplicates", "P1.x no duplicated breakpoints", "Duplicate breakpoints are refused."),
    row("CCR-01597", KERNEL, "assertNoDuplicateStatusColors", "P1.x no duplicated status colors", "Two statuses may not share a color."),
    row("CCR-01598", KERNEL, "assertNoDuplicates", "P1.x no duplicated transition timings", "Duplicate transition timings are refused."),
    row("CCR-01599", "Agent / Execution Infrastructure", "assertNoDuplicateLabels", "P1.x no duplicated Agent state labels", "Agent state labels must be distinct."),
    row("CCR-01600", "Projects / Portfolio / Roadmaps / Progress", "assertNoDuplicateLabels", "P1.x no duplicated project state labels", "Project state labels must be distinct.")
  ];
}
