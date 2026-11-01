/** P15.1 reviewed mappings: geometry, performance budgets and PWA (24 rows). */

const GEOM = "clean-room/src/design/geometry.ts";
const PERF = "clean-room/src/perf/budgets.ts";
const PWA = "clean-room/src/shell/pwa.ts";
const SUITE = "clean-room/tests/category1-design-perf-pwa.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const CAP = "Client Shell / PWA / Navigation";
const FIN = "Finance / Budgeting / Forecasting / Close";
const provenance = "Current-source contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, module, fn, test, capability, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
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

export function reviewedDesignPerfPwaMappings() {
  return [
    row("CCR-00226", GEOM, "designToken", "P1.x design tokens as code", CAP, "Tokens are code with kebab-case names and positive values."),
    row("CCR-00228", GEOM, "spacingScale", "P1.x spacing scale", CAP, "The spacing scale has at least three ascending steps."),
    row("CCR-00231", GEOM, "glowScale", "P1.x glow scale", CAP, "The glow scale starts at zero and ascends."),
    row("CCR-00233", GEOM, "bevelGeometry", "P1.x bevel geometry scale", CAP, "Bevel depth never exceeds its inset."),
    row("CCR-00234", GEOM, "iconFrame", "P1.x icon-frame geometry", CAP, "Icon frames use approved sizes with derived radius."),
    row("CCR-00237", GEOM, "progressRing", "P1.x progress-ring geometry", CAP, "Ring stroke stays thinner than half the radius."),
    row("CCR-00238", GEOM, "statusPill", "P1.x status-pill geometry", CAP, "Pills fit their label at a locked height."),
    row("CCR-00240", GEOM, "homeTileHeight", "P1.x home tile height locked uniformly", CAP, "All home tiles share one locked height."),
    row("CCR-00282", PERF, "navigationBudget", "P1.x navigation performance budget", FIN, "Navigation must stay within its budget."),
    row("CCR-00283", PERF, "renderBudget", "P1.x screen-render performance budget", FIN, "Screen render must stay within its budget."),
    row("CCR-00284", PERF, "queryBudget", "P1.x data-query budget", FIN, "Data queries must stay within their budget."),
    row("CCR-00285", PERF, "requestBudget", "P1.x maximum unnecessary network requests", CAP, "Unnecessary requests are capped."),
    row("CCR-00290", PERF, "listStrategy", "P1.x large-list virtualization", CAP, "Large lists are virtualized and oversized lists refused."),
    row("CCR-00291", PERF, "page", "P1.x pagination", CAP, "Pages are bounded and out-of-range pages refused."),
    row("CCR-00293", PERF, "assertNoNPlusOne", "P1.x avoid N+1 data queries", CAP, "Per-item query fan-out is refused."),
    row("CCR-00295", PERF, "invalidateCache", "P1.x cache invalidation rules", CAP, "Every cache key requires a declared invalidation rule."),
    row("CCR-00302", PWA, "manifestId", "P1.x stable manifest ID", CAP, "The manifest ID is an application-relative path."),
    row("CCR-00303", PWA, "scopeStrategy", "P1.x stable scope and start URL strategy", CAP, "The start URL stays inside the stable scope."),
    row("CCR-00310", PWA, "staleDataIndicator", "P1.x stale-data indicator", CAP, "Staleness is derived from the last sync."),
    row("CCR-00311", PWA, "offlineStateSeparated", "P1.x offline state separated from live state", CAP, "Only live and offline states are permitted."),
    row("CCR-00313", PWA, "updateFailureHandling", "P1.x update failure handling", CAP, "Updates retry a bounded number of times then fall back to manual."),
    row("CCR-00314", PWA, "detectStaleClient", "P1.x stale-client compatibility detection", CAP, "Build mismatch is detected as stale."),
    row("CCR-00315", PWA, "healthDiagnostics", "P1.x PWA health diagnostics", CAP, "Health requires manifest, service worker and cache state."),
    row("CCR-00317", PWA, "blackSystemSurface", "P1.x black Android system surfaces", CAP, "Android system surfaces are black.")
  ];
}
