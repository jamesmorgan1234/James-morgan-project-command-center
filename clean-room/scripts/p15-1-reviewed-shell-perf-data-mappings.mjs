/** P15.1 reviewed mappings: row templates, loading strategy and data paths (20 rows). */

const ROWS = "clean-room/src/shell/row-templates.ts";
const LOAD = "clean-room/src/perf/loading.ts";
const DATA = "clean-room/src/perf/data.ts";
const SUITE = "clean-room/tests/category1-shell-perf-data.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const CAP = "Client Shell / PWA / Navigation";
const provenance = "Current-source contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedShellPerfDataMappings() {
  return [
    row("CCR-00243", ROWS, "projectRow", "P1.x project-row template", "Every project row carries a title and status."),
    row("CCR-00244", ROWS, "activeRow", "P1.x active-row template", "An active row must state why it is active."),
    row("CCR-00245", ROWS, "nextUpRow", "P1.x Next-Up-row template", "Next-Up rows carry a positive rank."),
    row("CCR-00248", ROWS, "loadingStateTemplate", "P1.x loading-state template", "A loading state always renders skeleton rows."),
    row("CCR-00249", ROWS, "emptyStateTemplate", "P1.x empty-state template", "An empty state requires a message and an action."),
    row("CCR-00250", ROWS, "errorStateTemplate", "P1.x error-state template", "An error state requires a message and retry policy."),
    row("CCR-00260", ROWS, "visualRegressionSuite", "P1.x visual regression suite", "Screens are registered once in the visual suite."),
    row("CCR-00263", ROWS, "safeAreaHandling", "P1.x safe-area handling", "Safe-area insets must be nonnegative."),
    row("CCR-00286", LOAD, "splitEntrypoints", "P1.x code splitting", "Each route resolves to its own chunk."),
    row("CCR-00287", LOAD, "lazyOptionalModule", "P1.x lazy optional-module loading", "Only optional modules may load lazily."),
    row("CCR-00288", LOAD, "lazyArtwork", "P1.x lazy artwork loading", "Artwork is never inlined as data."),
    row("CCR-00289", LOAD, "optimizedImage", "P1.x image optimization", "Images use optimized formats within display bounds."),
    row("CCR-00292", LOAD, "incrementalBatch", "P1.x incremental loading", "Batches advance a cursor until exhausted."),
    row("CCR-00296", LOAD, "shouldPrefetch", "P1.x prefetch only when beneficial", "Prefetch requires likely navigation under the cost cap."),
    row("CCR-00294", DATA, "assertIndexed", "P1.x database indexes based on actual query paths", "Every query path requires a covering index."),
    row("CCR-00297", DATA, "assertBackpressure", "P1.x backpressure for high-volume events", "Queue depth beyond the limit applies backpressure."),
    row("CCR-00298", DATA, "rateLimit", "P1.x rate limiting for expensive actions", "Expensive actions throttle at the limit."),
    row("CCR-00299", DATA, "assertCheapWork", "P1.x mobile battery and CPU awareness", "Work respects low battery and high CPU load."),
    row("CCR-00308", DATA, "navigationStrategy", "P1.x navigation network-first", "Navigation is network-first when preferred."),
    row("CCR-00304", DATA, "launcherArt", "P1.x exact approved launcher art", "Launcher art uses approved sizes and a content hash.")
  ];
}
