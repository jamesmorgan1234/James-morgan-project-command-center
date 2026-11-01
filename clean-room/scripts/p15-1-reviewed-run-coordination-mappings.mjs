/**
 * P15.1 reviewed mappings for CCR-01351..CCR-01372 (unverified subset):
 * project lock renewal and expiry, run/lane exclusivity, deduplication,
 * command precedence, plan revalidation and executor compatibility.
 */

const RUN = "clean-room/src/agency/run-coordination.ts";
const DISPATCH = "clean-room/src/agency/dispatch.ts";
const LEASES = "clean-room/src/agency/leases.ts";
const SUITE = "clean-room/tests/category7-run-coordination.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source run coordination bound at this qualified HEAD; project lock renewal reuses the dispatch lease and fenced claim store, and the remaining behaviours are asserted by the focused coordination suite.";

function row(id, capability, implementationLocations, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
    implementationLocations,
    tests: {
      positive: { applicable: true, references: [test], justification: null },
      negative: { applicable: true, references: [test], justification: null },
      failurePath: { applicable: true, references: [test], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

const agent = "Agent / Execution Infrastructure";

export function reviewedRunCoordinationMappings() {
  return [
    row("CCR-01351", "Projects / Portfolio / Roadmaps / Progress",
      [`${DISPATCH}#renewProjectLock`, `${LEASES}#TaskClaimStore.renew`],
      t("P7.2 project lock renewal extends the lease"),
      "A project lock is renewable by the current fenced holder and the lease expiry advances."),

    row("CCR-01352", agent,
      [`${LEASES}#TaskClaimStore.assertCommitAllowed`],
      t("P7.2 expired project lock cannot commit"),
      "An expired lock rejects the commit path rather than allowing a stale holder to proceed."),

    row("CCR-01354", agent,
      [`${RUN}#RunCoordinator.startRun`],
      t("P7.2 one active project run at a time"),
      "A second active run on the same project is refused until the first is finished."),

    row("CCR-01355", agent,
      [`${RUN}#RunCoordinator.startRun`],
      t("P7.2 one portfolio lane is active by default"),
      "A portfolio lane admits one active run by default and is released on finish."),

    row("CCR-01356", agent,
      [`${RUN}#RunCoordinator.accept`],
      t("P7.2 run deduplication rejects a second command for the same run"),
      "A second command for an already-queued run is classified as a duplicate run."),

    row("CCR-01357", agent,
      [`${RUN}#RunCoordinator.accept`],
      t("P7.2 task deduplication rejects a second command for the same task"),
      "A second command for an already-queued task is classified as a duplicate task."),

    row("CCR-01358", agent,
      [`${RUN}#RunCoordinator.accept`],
      t("P7.2 equivalent work deduplication rejects a different run with the same work"),
      "Different runs with the same work fingerprint are classified as equivalent work."),

    row("CCR-01359", agent,
      [`${RUN}#RunCoordinator.coalesce`],
      t("P7.2 pending start commands coalesce to the earliest entry"),
      "Pending starts for the same work coalesce to the earliest command while distinct work is preserved."),

    row("CCR-01360", agent,
      [`${RUN}#RunCoordinator.next`],
      t("P7.2 stop command takes precedence over queued work"),
      "A stop command outranks any queued start regardless of issue order."),

    row("CCR-01361", agent,
      [`${RUN}#RunCoordinator.next`],
      t("P7.2 pause command takes precedence over the next task"),
      "A pause command outranks the next queued start."),

    row("CCR-01362", agent,
      [`${RUN}#planRevalidation`],
      t("P7.2 owner scope change invalidates a stale plan"),
      "A scope version change forces plan revalidation."),

    row("CCR-01363", agent,
      [`${RUN}#planRevalidation`],
      t("P7.2 owner rule change revalidates the plan"),
      "A rule version change forces plan revalidation."),

    row("CCR-01364", agent,
      [`${RUN}#planRevalidation`],
      t("P7.2 tool availability change revalidates capability"),
      "A tool availability version change forces capability revalidation."),

    row("CCR-01365", agent,
      [`${RUN}#planRevalidation`],
      t("P7.2 provider disconnection re-evaluates the task"),
      "A provider disconnection forces task re-evaluation."),

    row("CCR-01366", agent,
      [`${RUN}#assertExecutorCompatible`],
      t("P7.2 executor compatibility is checked before claim"),
      "An executor missing a required capability cannot claim the task."),

    row("CCR-01367", agent,
      [`${RUN}#assertExecutorCompatible`],
      t("P7.2 executor capability version is enforced"),
      "A stale executor capability version is refused before claim."),

    row("CCR-01368", agent,
      [`${RUN}#assertExecutorCompatible`],
      t("P7.2 executor permission version is enforced"),
      "A stale executor permission version is refused before claim."),

    row("CCR-01369", agent,
      [`${RUN}#toolHealthSnapshotAtStart`],
      t("P7.2 tool-health snapshot is taken at task start"),
      "The tool-health snapshot is captured at task start and a missing tool report fails closed."),

    row("CCR-01372", agent,
      [`${RUN}#assertFreshOwnerRule`],
      t("P7.2 owner rules are rechecked before an external side effect"),
      "A changed owner rule blocks the external side effect until revalidation.")
  ];
}
