/**
 * P15.1 reviewed mappings for the design-system batch:
 * CCR-00227, 00235, 00236, 00241, 00242, 00251-00252, 00254, 00256-00259,
 * 00261-00262, 00264-00265, 00267, 00279-00281.
 */

const TEMPLATES = "clean-room/src/design/templates.ts";
const LAYOUT = "clean-room/src/design/layout-compliance.ts";
const TARGETS = "clean-room/src/design/targets.ts";
const SUITE = "clean-room/tests/category1-design-system.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const CAP = "Client Shell / PWA / Navigation";
const provenance = "Current-source design-system contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, module, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", CAP],
    implementationLocations: [`${module}#${fn}`],
    tests: {
      positive: { applicable: true, references: [t(test)], justification: null },
      negative: { applicable: true, references: [t(test)], justification: null },
      failurePath: { applicable: true, references: [t(test)], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

export function reviewedDesignSystemMappings() {
  return [
    row("CCR-00227", TARGETS, "exactMeasurements", "P1.x exact approved screenshot measurements", "Measurements are exact integers and must be positive."),
    row("CCR-00235", TEMPLATES, "artworkSafeArea", "P1.x artwork safe areas", "Every artwork edge has a declared nonnegative safe area."),
    row("CCR-00236", TEMPLATES, "chevronSafeArea", "P1.x chevron safe area", "Chevrons reserve a safe area of twice their size."),
    row("CCR-00241", TEMPLATES, "screenTemplate", "P1.x screen-template system", "Screens are built from named templates with unique sections."),
    row("CCR-00242", TEMPLATES, "sectionTemplate", "P1.x section-template system", "Sections must use a declared template kind."),
    row("CCR-00251", TEMPLATES, "blockedStateTemplate", "P1.x blocked-state template", "A blocked state requires both a reason and an action."),
    row("CCR-00252", TEMPLATES, "offlineStateTemplate", "P1.x offline-state template", "An offline state requires a valid last-sync timestamp."),
    row("CCR-00254", LAYOUT, "assertNoLocalOverride", "P1.x no local CSS overrides that undermine tokens", "Local CSS overrides are refused."),
    row("CCR-00256", LAYOUT, "assertConsistentTileSizes", "P1.x no inconsistent tile sizes", "Tiles in one group share a size."),
    row("CCR-00257", LAYOUT, "assertNoRoundedSaaSCards", "P1.x no random rounded SaaS cards", "Corner radius is bounded by the design limit."),
    row("CCR-00258", LAYOUT, "assertSemanticColor", "P1.x no arbitrary blue UI elements", "Colour must come from the semantic palette."),
    row("CCR-00259", TEMPLATES, "componentGallery", "P1.x component gallery shows canonical appearance", "The gallery lists each canonical component once."),
    row("CCR-00261", TARGETS, "assertMobileTarget", "P1.x Samsung mobile-first target", "The target viewport is a Samsung-class mobile width."),
    row("CCR-00262", TARGETS, "assertPortrait", "P1.x portrait-first layout", "The layout is portrait-first."),
    row("CCR-00264", LAYOUT, "assertNoHorizontalOverflow", "P1.x no horizontal overflow", "Content width never exceeds the viewport."),
    row("CCR-00265", LAYOUT, "assertNativeScrolling", "P1.x native vertical scrolling", "Scrolling is native vertical scrolling."),
    row("CCR-00267", LAYOUT, "assertControlsAboveSystemUi", "P1.x no controls underneath Android system UI", "Controls stay above the system inset."),
    row("CCR-00279", LAYOUT, "assertSingleTruthSystem", "P1.x no separate mobile and desktop truth systems", "Exactly one truth system is permitted."),
    row("CCR-00280", LAYOUT, "assertSameContracts", "P1.x same data and contracts regardless of presentation size", "Mobile and desktop share one contract version."),
    row("CCR-00281", TARGETS, "assertStartupBudget", "P1.x startup performance budget", "Startup must stay within the declared budget.")
  ];
}
