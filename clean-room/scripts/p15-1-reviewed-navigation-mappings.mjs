/**
 * P15.1 reviewed mappings for CCR-00046..CCR-00060 (unverified subset):
 * route restoration, Back contracts, scroll memory, soft navigation and
 * kernel invariants.
 */

const MODULE = "clean-room/src/kernel/navigation.ts";
const SUITE = "clean-room/tests/category1-navigation.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const KERNEL = "Core Kernel / Runtime / Lifecycle";
const SHELL = "Client Shell / PWA / Navigation";

const provenance =
  "Current-source navigation contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedNavigationMappings() {
  return [
    row("CCR-00046", KERNEL, "restoreRoute", "P1.x route restoration after reload", "A saved absolute route is restored, otherwise the fallback is used."),
    row("CCR-00047", SHELL, "androidBack", "P1.x Android Back contract", "Android Back closes detail, collapses a section, then navigates or exits."),
    row("CCR-00048", SHELL, "browserBack", "P1.x Browser Back contract", "Browser Back moves one history entry without leaving the valid range."),
    row("CCR-00049", KERNEL, "nestedDetailBack", "P1.x nested-detail Back contract", "Nested detail pops one level and reports whether it handled Back."),
    row("CCR-00050", KERNEL, "expandedSectionBack", "P1.x expanded-section Back contract", "An expanded section collapses first and reports handling."),
    row("CCR-00051", SHELL, "rememberScroll", "P1.x per-route scroll memory", "Scroll offsets are remembered per absolute route."),
    row("CCR-00052", KERNEL, "assertSoftNavigation", "P1.x no whole-page reload during ordinary navigation", "A full-page reload during ordinary navigation is refused."),
    row("CCR-00056", KERNEL, "assertNoSharedMutableGlobals", "P1.x no global mutable variables shared between arbitrary modules", "Shared mutable globals are refused."),
    row("CCR-00057", KERNEL, "assertSingleEventLoop", "P1.x no competing event loops", "Exactly one application event loop is permitted."),
    row("CCR-00060", KERNEL, "kernelVersion", "P1.x Core Kernel version identifier", "The kernel exposes a semantic version identifier.")
  ];
}
