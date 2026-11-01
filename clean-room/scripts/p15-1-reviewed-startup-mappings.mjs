/**
 * P15.1 reviewed mappings for CCR-00030..CCR-00045 (unverified subset):
 * singletons, startup and session machines, readiness, module classing and
 * ordering, timeout, stuck-loading refusal, Safe Mode and deep links.
 */

const MODULE = "clean-room/src/kernel/startup.ts";
const SUITE = "clean-room/tests/category1-startup.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const KERNEL = "Core Kernel / Runtime / Lifecycle";

const provenance =
  "Current-source startup contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedStartupMappings() {
  return [
    row("CCR-00030", "Client Shell / PWA / Navigation", "scrollRestorationOwner", "P1.x exactly one scroll-restoration owner", "Exactly one scroll-restoration owner is registered."),
    row("CCR-00031", KERNEL, "globalStateCoordinator", "P1.x exactly one global application-state coordinator", "Exactly one global state coordinator is permitted."),
    row("CCR-00033", KERNEL, "errorBoundaryRoot", "P1.x exactly one error boundary hierarchy", "Exactly one error boundary root is permitted."),
    row("CCR-00034", KERNEL, "startupTransition", "P1.x explicit startup state machine", "Startup transitions are explicit and invalid transitions are refused."),
    row("CCR-00035", KERNEL, "sessionTransition", "P1.x explicit authenticated-session state machine", "Session transitions are explicit and invalid transitions are refused."),
    row("CCR-00036", KERNEL, "applicationReady", "P1.x explicit application-readiness state", "Readiness requires every core module to be ready."),
    row("CCR-00037", KERNEL, "classifyModule", "P1.x core versus optional module distinction", "Modules are classified core or optional."),
    row("CCR-00038", KERNEL, "runStartup", "P1.x optional modules cannot block startup", "A failing optional module is skipped while startup still reaches ready."),
    row("CCR-00039", KERNEL, "startupOrder", "P1.x deterministic startup ordering", "Startup order is deterministic and duplicate orders are refused."),
    row("CCR-00040", KERNEL, "startModuleWithin", "P1.x startup timeout and failure handling", "A module start times out explicitly and core failure stops startup."),
    row("CCR-00041", KERNEL, "assertNotStuckLoading", "P1.x no infinite loading state", "Loading past the limit is refused."),
    row("CCR-00043", KERNEL, "runStartup", "P1.x Safe Mode disables optional modules", "Safe Mode starts core modules only and skips optionals."),
    row("CCR-00045", "Client Shell / PWA / Navigation", "parseDeepLink", "P1.x deep-link support", "Deep links parse application-relative paths and parameters only.")
  ];
}
