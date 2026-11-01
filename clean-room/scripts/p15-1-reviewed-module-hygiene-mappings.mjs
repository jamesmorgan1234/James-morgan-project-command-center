/**
 * P15.1 reviewed mappings for CCR-01565..CCR-01580 (unverified subset):
 * module cohesion, domain boundaries, purity, side-effect isolation, lifecycle,
 * import safety and static analysis.
 */

const MODULE = "clean-room/src/kernel/module-hygiene.ts";
const SUITE = "clean-room/tests/category1-module-hygiene.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const KERNEL = "Core Kernel / Runtime / Lifecycle";

const provenance =
  "Current-source module-hygiene contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedModuleHygieneMappings() {
  return [
    row("CCR-01565", KERNEL, "assessModule", "P1.x modules are small and cohesive", "A module is cohesive only with one responsibility and bounded size and exports."),
    row("CCR-01566", KERNEL, "assertNotGiantFile", "P1.x no giant all-purpose application file", "A single application file above 500 lines is refused."),
    row("CCR-01567", KERNEL, "assertDomainBoundary", "P1.x domain boundaries are clear", "Cross-domain imports are refused except shared and kernel."),
    row("CCR-01568", KERNEL, "classifyFunction", "P1.x domain functions are pure where possible", "Functions are classified pure or effectful."),
    row("CCR-01569", KERNEL, "assertSideEffectsIsolated", "P1.x side effects are isolated", "Domain functions may not perform side effects; adapters may."),
    row("CCR-01571", KERNEL, "assertNoHiddenSingleton", "P1.x no hidden singleton state", "Global state is refused unless it is a deliberate service."),
    row("CCR-01572", KERNEL, "initializeApp", "P1.x initialization is explicit", "Initialization must be an explicit hook that runs."),
    row("CCR-01573", KERNEL, "teardownApp", "P1.x teardown is explicit", "Teardown must be an explicit hook that runs."),
    row("CCR-01574", KERNEL, "assertNoImportTimeDom", "P1.x modules do not require DOM at import", "Import-time DOM access is refused."),
    row("CCR-01575", KERNEL, "assertNoImportSideEffects", "P1.x importing a module has no side effects", "Undesignated import-time side effects are refused."),
    row("CCR-01576", KERNEL, "detectCycles", "P1.x no circular imports", "Cycle detection finds a cycle and the assertion refuses it."),
    row("CCR-01578", KERNEL, "detectDeadCode", "P1.x dead code is detected", "Unreferenced symbols are reported."),
    row("CCR-01579", KERNEL, "detectUnusedExports", "P1.x unused exports are detected", "Exports without usages are reported."),
    row("CCR-01580", KERNEL, "detectDuplicateUtilities", "P1.x duplicate utilities are detected", "Utilities sharing a fingerprint are grouped.")
  ];
}
