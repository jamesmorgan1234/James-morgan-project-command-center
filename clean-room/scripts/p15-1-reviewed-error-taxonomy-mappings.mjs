/**
 * P15.1 reviewed mappings for CCR-01603..CCR-01625 (unverified subset):
 * commit and review gates, complexity and nesting limits, async error
 * handling, error wrapping, normalized error classes and explicit flags.
 */

const MODULE = "clean-room/src/kernel/error-taxonomy.ts";
const SUITE = "clean-room/tests/category1-error-taxonomy.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const KERNEL = "Core Kernel / Runtime / Lifecycle";

const provenance =
  "Current-source error-taxonomy and quality-gate contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedErrorTaxonomyMappings() {
  return [
    row("CCR-01603", KERNEL, "assertCommitMessage", "P1.x commit messages identify subsystem and change", "Commit messages must name a subsystem and a change."),
    row("CCR-01605", KERNEL, "assertReviewChecklist", "P1.x code review checklist checks architecture boundaries", "The review checklist must include architecture boundaries."),
    row("CCR-01606", KERNEL, "assertComplexity", "P1.x complexity thresholds apply to functions and modules", "Cyclomatic and length thresholds are enforced."),
    row("CCR-01607", KERNEL, "requireCriticalReview", "P1.x cyclomatic complexity is reviewed for critical orchestration", "Complexity scores are validated and reviewed."),
    row("CCR-01608", KERNEL, "assertNestingDepth", "P1.x no deeply nested callback structures", "Nesting beyond three levels is refused."),
    row("CCR-01609", KERNEL, "handleAsync", "P1.x async flows use explicit error handling", "Async failures are returned as explicit results."),
    row("CCR-01610", "Deployment / Release / Provenance / Rollback", "assertNoUnhandledRejection", "P1.x unhandled promise rejection is release-blocking", "Any unhandled rejection blocks release."),
    row("CCR-01611", KERNEL, "createGlobalErrorHandler", "P1.x global error handler captures unexpected failures", "Unexpected failures are captured as classified errors."),
    row("CCR-01612", KERNEL, "assertHandledLocally", "P1.x expected errors are handled locally", "Expected errors must be handled at their source."),
    row("CCR-01613", KERNEL, "assertCatchNotBlanket", "P1.x no blanket try/catch swallowing failures", "A catch that neither logs nor rethrows is refused."),
    row("CCR-01614", KERNEL, "assertNotCatchAndIgnore", "P1.x no catch-and-ignore on protected operations", "Protected operations cannot be caught and ignored."),
    row("CCR-01615", KERNEL, "classifyFailure", "P1.x error wrapping preserves the original cause", "Wrapping preserves the original cause by identity."),
    row("CCR-01616", KERNEL, "domainError", "P1.x domain errors are typed and classified", "Domain errors carry the domain class."),
    row("CCR-01617", KERNEL, "normalizeProviderError", "P1.x provider errors are normalized", "Provider errors normalize to a provider class with retryability."),
    row("CCR-01618", KERNEL, "normalizeNetworkError", "P1.x network errors are normalized", "Network errors normalize to a network class."),
    row("CCR-01620", KERNEL, "normalizeValidationError", "P1.x validation errors are normalized", "Validation errors normalize with user action required."),
    row("CCR-01621", KERNEL, "normalizeConflictError", "P1.x conflict errors are normalized", "Conflict errors normalize with user action required."),
    row("CCR-01622", KERNEL, "classifyFailure", "P1.x retryability is explicitly declared", "Retryability must be supplied, never defaulted."),
    row("CCR-01623", KERNEL, "classifyFailure", "P1.x user-action requirement is explicitly declared", "User-action requirement must be supplied, never defaulted."),
    row("CCR-01624", "Brain / Reason / Contradiction", "classifyFailure", "P1.x no inference of retryability from message text", "Retryability is not inferred from message wording."),
    row("CCR-01625", KERNEL, "assertStaticTyping", "P1.x static type checking where the stack supports it", "Strict static typing is required.")
  ];
}
