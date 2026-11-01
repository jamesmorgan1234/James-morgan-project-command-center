/**
 * P15.1 reviewed mappings for CCR-01373..CCR-01396 (unverified subset):
 * fresh pre-side-effect checks, reservation, post-effect verification,
 * checkpoints, recorded outcomes, retry fingerprints, systemic grouping,
 * circuit breaking and quarantine.
 */

const MODULE = "clean-room/src/agency/failure-policy.ts";
const SUITE = "clean-room/tests/category7-failure-policy.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source side-effect and failure-policy contracts authored for this batch at the qualified HEAD; each row is asserted by its named test in the focused suite.";

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

const AGENT = "Agent / Execution Infrastructure";
const PROJECTS = "Projects / Portfolio / Roadmaps / Progress";

export function reviewedFailurePolicyMappings() {
  return [
    row("CCR-01373", PROJECTS, "assertSideEffectAllowed", "P7.2 fresh project-lock check precedes an external side effect",
      "A stale or missing project lock blocks the external side effect."),
    row("CCR-01374", AGENT, "assertSideEffectAllowed", "P7.2 fresh stop/pause check precedes an external side effect",
      "A pending stop or pause blocks the external side effect."),
    row("CCR-01375", AGENT, "reserveSideEffect", "P7.2 side effects are reserved atomically per key",
      "A side effect is reserved once per key and a second reservation is refused."),
    row("CCR-01376", AGENT, "verifySideEffect", "P7.2 post-side-effect canonical verification",
      "Observed state must match the canonical expectation after the side effect."),
    row("CCR-01378", PROJECTS, "writeCheckpoint", "P7.2 checkpoint is written only after a meaningful stable state",
      "A checkpoint requires a stable state and a positive state version."),
    row("CCR-01379", AGENT, "selectNextTask", "P7.2 next-task selection follows a checkpoint",
      "Next-task selection requires the applicable checkpoint."),
    row("CCR-01380", AGENT, "assertAdvanceable", "P7.2 no task advancement on ambiguous evidence",
      "Ambiguous evidence refuses task advancement."),
    row("CCR-01381", AGENT, "assertSkipAllowed", "P7.2 no automatic task skip without an explicit policy",
      "Skipping requires an explicit allow policy."),
    row("CCR-01382", AGENT, "recordTaskOutcome", "P7.2 skipped task reason is recorded",
      "A skipped task carries a nonblank recorded reason."),
    row("CCR-01383", AGENT, "recordTaskOutcome", "P7.2 excluded task reason is recorded",
      "An excluded task carries a nonblank recorded reason."),
    row("CCR-01384", AGENT, "recordTaskOutcome", "P7.2 blocked task reason is recorded",
      "A blocked task carries a nonblank recorded reason."),
    row("CCR-01385", AGENT, "recordTaskOutcome", "P7.2 failed task reason is recorded",
      "A failed task carries a nonblank recorded reason."),
    row("CCR-01386", AGENT, "recordTaskOutcome", "P7.2 reopened task reason is recorded",
      "A reopened task carries a nonblank recorded reason."),
    row("CCR-01387", AGENT, "retryFingerprint", "P7.2 task retry fingerprint is stable and specific",
      "Task retry fingerprints are deterministic and distinguish tasks."),
    row("CCR-01388", AGENT, "retryFingerprint", "P7.2 run retry fingerprint is stable and specific",
      "Run retry fingerprints are deterministic and distinguish kinds."),
    row("CCR-01389", AGENT, "retryFingerprint", "P7.2 provider failure fingerprint is stable and specific",
      "Provider failure fingerprints distinguish failure classes."),
    row("CCR-01390", AGENT, "groupSystemicFailures", "P7.2 systemic failures group by fingerprint",
      "Repeated fingerprints group into systemic failure counts."),
    row("CCR-01391", AGENT, "CircuitBreaker", "P7.2 circuit-breaker threshold opens the circuit",
      "Reaching the failure threshold opens the circuit."),
    row("CCR-01392", AGENT, "CircuitBreaker", "P7.2 circuit-breaker reset requires the cooldown to elapse",
      "Automatic reset is refused until the cooldown elapses."),
    row("CCR-01393", AGENT, "CircuitBreaker", "P7.2 manual circuit-breaker reset closes it immediately",
      "A manual reset closes the circuit without waiting."),
    row("CCR-01395", AGENT, "QuarantineRegistry", "P7.2 executor is quarantined after repeated malformed results",
      "An executor crossing the malformed-result threshold is quarantined and refused."),
    row("CCR-01396", AGENT, "QuarantineRegistry", "P7.2 tool is quarantined after repeated integrity failures",
      "A tool crossing the integrity-failure threshold is quarantined and can be cleared.")
  ];
}
