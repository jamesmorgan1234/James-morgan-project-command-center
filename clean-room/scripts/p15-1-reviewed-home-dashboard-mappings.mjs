/**
 * P15.1 reviewed mappings for CCR-02283..CCR-02302: Home destination access,
 * the Home Agent run module and To Work Barriers.
 */

const HOME = "clean-room/src/ui/home-dashboard.ts";
const SUITE = "clean-room/tests/category4-home-dashboard.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source Home destination and Agent module contracts authored for this batch at the qualified HEAD; the recovered diagnostics were navigation only and are not the proof.";

const shell = "Client Shell / UX / PWA / Offline / Multi-device";
const agent = "Agent / Execution Infrastructure";

function row(id, capability, implementationLocations, test, notes) {
  return {
    id,
    owningPhases: ["P4.4"],
    dependencies: ["C1", "C2"],
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

export function reviewedHomeDashboardMappings() {
  return [
    row("CCR-02283", shell, [`${HOME}#homeDestinations`], t("P4.4 Home provides access to Personal Operations"),
      "Home exposes a Personal Operations destination at a canonical local route."),
    row("CCR-02284", shell, [`${HOME}#homeDestinations`], t("P4.4 Home provides access to Needs Me"),
      "Home exposes the Needs Me destination at a canonical local route."),
    row("CCR-02285", shell, [`${HOME}#homeDestinations`], t("P4.4 Home provides access to Search"),
      "Home exposes the Search destination at a canonical local route."),
    row("CCR-02286", shell, [`${HOME}#homeDestinations`], t("P4.4 Home provides access to Notifications"),
      "Home exposes the Notifications destination at a canonical local route."),
    row("CCR-02287", shell, [`${HOME}#homeDestinations`], t("P4.4 Home provides Financial Command Center access only where enabled"),
      "The Financial Command Center destination is present but disabled unless the capability is enabled."),
    row("CCR-02288", shell, [`${HOME}#homeDestinations`, `${HOME}#assertPinnedDestinationsPreservePrimaryGrid`], t("P4.4 pinned destinations do not disturb the approved primary grid"),
      "Pinned destinations are a separate set and cannot replace an approved primary Home module."),
    row("CCR-02289", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module shows the current project for an active run"),
      "The Agent module reports the current project only when an active run exists, otherwise null."),
    row("CCR-02290", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module shows the current task where known"),
      "The current task is shown where known and remains null when unknown."),
    row("CCR-02291", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module shows the exact next action where known"),
      "The exact next action is shown where known and remains null when unknown."),
    row("CCR-02292", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module reports the real run state"),
      "The module reports the actual run state and rejects an unsupported state."),
    row("CCR-02293", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module shows verified progress or N/A"),
      "Progress is shown only when verified; otherwise the module renders N/A and refuses unverified percentages."),
    row("CCR-02294", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module distinguishes Queued from Working"),
      "Queued and Working are distinct labelled states rather than a generic in-progress label."),
    row("CCR-02295", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module surfaces Needs Owner"),
      "Needs Owner is a first-class labelled state."),
    row("CCR-02296", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module carries the work boundary"),
      "The module always carries the active work boundary and rejects a blank one."),
    row("CCR-02297", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module surfaces Blocked"),
      "Blocked is a first-class labelled state."),
    row("CCR-02298", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module surfaces Executor Unavailable"),
      "Executor Unavailable is a first-class labelled state rather than being folded into Blocked."),
    row("CCR-02299", agent, [`${HOME}#homeAgentModule`], t("P4.4 Home Agent module opens the Agent surface"),
      "The Agent module routes to the Agent surface whether or not a run is active."),
    row("CCR-02300", agent, [`${HOME}#homeBarriers`], t("P4.4 Home To Work Barriers shows the current locked project"),
      "Barriers show the current locked project or an explicit no-lock label."),
    row("CCR-02301", agent, [`${HOME}#homeBarriers`], t("P4.4 Home To Work Barriers shows the reviewed or parked count"),
      "Barriers show the reviewed/parked count and reject a negative count."),
    row("CCR-02302", shell, [`${HOME}#homeBarriers`], t("P4.4 Home To Work Barriers never renders a fake percentage"),
      "The barrier result carries a null percentage, so a count is never presented as a fabricated percentage.")
  ];
}

// Re-trigger marker: assembly was skipped by a preflight pathspec bug; mapping rows unchanged.
