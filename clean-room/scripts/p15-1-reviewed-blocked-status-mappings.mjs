/**
 * P15.1 reviewed mappings for CCR-01413..CCR-01424:
 * ten distinct blocked statuses plus queryable execution history and
 * root-cause support.
 */

const MODULE = "clean-room/src/agency/blocked-status.ts";
const SUITE = "clean-room/tests/category7-blocked-status.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const AGENT = "Agent / Execution Infrastructure";

const provenance =
  "Current-source blocked-status and execution-history contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", AGENT],
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

export function reviewedBlockedStatusMappings() {
  return [
    row("CCR-01413", "blockedStatus",
      "P7.2 agent surfaces cannot safely continue instead of guessing",
      "An unsafe or ambiguous state yields a distinct cannot-safely-continue status rather than a guess."),
    row("CCR-01414", "blockedStatus",
      "P7.2 agent surfaces capability missing instead of inventing execution",
      "A missing capability yields a distinct capability-missing status without fabricated execution."),
    row("CCR-01415", "blockedStatus",
      "P7.2 agent surfaces verification impossible distinctly",
      "Impractical verification yields its own status, distinct from cannot-safely-continue."),
    row("CCR-01416", "blockedStatus",
      "P7.2 agent surfaces authorization expired",
      "Expired authorization is surfaced distinctly and requires the owner."),
    row("CCR-01417", "blockedStatus",
      "P7.2 agent surfaces state changed since plan",
      "State drift past the plan is surfaced distinctly."),
    row("CCR-01418", "blockedStatus",
      "P7.2 agent surfaces project rule conflict",
      "A plan conflicting with a project rule is surfaced distinctly and requires the owner."),
    row("CCR-01419", "blockedStatus",
      "P7.2 agent surfaces resource unavailable",
      "An unavailable resource is surfaced distinctly."),
    row("CCR-01420", "blockedStatus",
      "P7.2 agent surfaces owner decision required",
      "An owner decision is surfaced distinctly and requires the owner."),
    row("CCR-01421", "blockedStatus",
      "P7.2 agent surfaces external provider required",
      "A required external provider is surfaced distinctly and requires the owner."),
    row("CCR-01422", "blockedStatus",
      "P7.2 agent surfaces future capability recommended",
      "A recommended future capability is surfaced distinctly and requires the owner."),
    row("CCR-01423", "ExecutionHistory.query",
      "P7.2 execution history is queryable by project and run",
      "Execution events are recorded and queryable by project, run or both, in time order."),
    row("CCR-01424", "ExecutionHistory.rootCause",
      "P7.2 execution history supports root-cause analysis",
      "Root-cause analysis returns the earliest failed or blocked event for a run.")
  ];
}
