/**
 * P15.1 reviewed mappings for CCR-01397..CCR-01412 (unverified subset):
 * provider quarantine, fallback trust, task preconditions/postconditions/
 * invariants, budgets, duration, cancellation cadence, resumability,
 * atomicity, compensation, evidence strength, verification timeout and
 * manual-review fallback.
 */

const TASK = "clean-room/src/agency/task-contract.ts";
const FAILURE = "clean-room/src/agency/failure-policy.ts";
const SUITE = "clean-room/tests/category7-task-contract.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const AGENT = "Agent / Execution Infrastructure";

const provenance =
  "Current-source task contract and safety-boundary contracts authored for this batch at the qualified HEAD; provider quarantine reuses the existing quarantine registry and every other row is asserted by its named test.";

function row(id, capability, locations, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
    implementationLocations: locations,
    tests: {
      positive: { applicable: true, references: [test], justification: null },
      negative: { applicable: true, references: [test], justification: null },
      failurePath: { applicable: true, references: [test], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

export function reviewedTaskContractMappings() {
  return [
    row("CCR-01397", AGENT, [`${FAILURE}#QuarantineRegistry`],
      t("P7.2 provider is quarantined after dangerous inconsistency"),
      "A provider crossing the inconsistency threshold is quarantined and refused."),
    row("CCR-01398", AGENT, [`${TASK}#assertFallbackAllowed`],
      t("P7.2 no fallback to a lower-trust executor for a protected action"),
      "A protected action refuses a lower-trust fallback while unprotected work may fall back."),
    row("CCR-01400", AGENT, [`${TASK}#assertContractSatisfied`],
      t("P7.2 task preconditions are checked"),
      "A task cannot proceed unless every precondition is observed."),
    row("CCR-01401", AGENT, [`${TASK}#assertContractSatisfied`],
      t("P7.2 task postconditions are checked"),
      "A task is not complete unless every postcondition is observed."),
    row("CCR-01402", AGENT, [`${TASK}#assertContractSatisfied`],
      t("P7.2 task invariants are checked"),
      "A task refuses to proceed or complete when an invariant is violated."),
    row("CCR-01403", "Finance / Budgets / Runway / Forecasts", [`${TASK}#TaskBudgetRunner.consumeSideEffect`],
      t("P7.2 task side-effect budget is enforced"),
      "Side effects are counted against the task budget and the excess is refused."),
    row("CCR-01404", "Finance / Budgets / Runway / Forecasts", [`${TASK}#TaskBudgetRunner.consumeExternalCall`],
      t("P7.2 task external-call budget is enforced"),
      "External calls are counted against the task budget and the excess is refused."),
    row("CCR-01405", AGENT, [`${TASK}#TaskBudgetRunner.assertWithinDuration`],
      t("P7.2 task maximum duration is enforced"),
      "A task exceeding its maximum duration is stopped."),
    row("CCR-01406", AGENT, [`${TASK}#TaskBudgetRunner.shouldCheckCancellation`],
      t("P7.2 task cancellation check cadence is honoured"),
      "Cancellation is checked on the declared cadence and counted."),
    row("CCR-01407", AGENT, [`${TASK}#classifyTask`],
      t("P7.2 task resumability classification"),
      "A task declares resumable or not-resumable status."),
    row("CCR-01408", AGENT, [`${TASK}#classifyTask`],
      t("P7.2 task atomicity classification"),
      "A task declares atomic or compensable status."),
    row("CCR-01409", AGENT, [`${TASK}#compensationPlan`],
      t("P7.2 task compensation strategy is required for non-atomic work"),
      "Non-atomic work must declare a compensation strategy; atomic work needs none."),
    row("CCR-01410", AGENT, [`${TASK}#assertEvidenceStrength`],
      t("P7.2 task evidence strength requirement is enforced"),
      "Provided evidence must meet the strength the task requires."),
    row("CCR-01411", AGENT, [`${TASK}#assertVerificationTimely`],
      t("P7.2 task verification timeout is enforced"),
      "Verification past its timeout fails the task."),
    row("CCR-01412", AGENT, [`${TASK}#manualReviewFallback`],
      t("P7.2 task manual-review fallback is available and bounded"),
      "Manual review is a permitted fallback only where the contract allows it and a reason is given.")
  ];
}
