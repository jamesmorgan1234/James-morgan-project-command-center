/**
 * Home dashboard access and the Agent module.
 *
 * Home exposes the owner's destinations without disturbing the approved primary
 * one-column grid, and the Agent module reports real run state: queued, working,
 * needs owner, blocked or executor unavailable, with verified progress or N/A.
 * Barrier counts are counts, never invented percentages.
 */
const DESTINATIONS = Object.freeze([
    Object.freeze({ key: "personal", title: "Personal Operations", route: "/personal" }),
    Object.freeze({ key: "needs_me", title: "Needs Me", route: "/needs-me" }),
    Object.freeze({ key: "search", title: "Search", route: "/search" }),
    Object.freeze({ key: "notifications", title: "Notifications", route: "/notifications" }),
    Object.freeze({ key: "finance", title: "Financial Command Center", route: "/finance" })
]);
export function homeDestinations(input = {}) {
    const pinned = new Set(input.pinnedKeys ?? []);
    for (const key of pinned)
        if (!DESTINATIONS.some((destination) => destination.key === key))
            throw new Error(`Unknown Home destination: ${key}`);
    return Object.freeze(DESTINATIONS.map((destination) => Object.freeze({
        ...destination,
        enabled: destination.key === "finance" ? input.financeEnabled === true : true,
        pinned: pinned.has(destination.key)
    })));
}
export function assertPinnedDestinationsPreservePrimaryGrid(primaryModuleKeys) {
    for (const key of primaryModuleKeys) {
        if (DESTINATIONS.some((destination) => destination.key === key))
            throw new Error(`Pinned destinations cannot replace the approved primary Home grid: ${key}`);
    }
}
const STATE_LABELS = Object.freeze({
    queued: "Queued",
    working: "Working",
    needs_owner: "Needs Owner",
    blocked: "Blocked",
    executor_unavailable: "Executor Unavailable"
});
export function homeAgentModule(run) {
    if (run === null) {
        return Object.freeze({
            title: "Agent",
            route: "/agent",
            currentProject: null,
            currentTask: null,
            nextAction: null,
            state: null,
            stateLabel: "No active run",
            progressPercent: null,
            progressLabel: "N/A",
            workBoundary: "No active run"
        });
    }
    const stateLabel = STATE_LABELS[run.state];
    if (stateLabel === undefined)
        throw new Error("Unsupported agent run state");
    if (!run.workBoundary.trim())
        throw new Error("Agent module requires a work boundary");
    let progressPercent = null;
    let progressLabel = "N/A";
    if (run.progressPercent !== null) {
        if (!run.progressVerified)
            throw new Error("Agent progress must be verified or N/A");
        if (!Number.isFinite(run.progressPercent) || run.progressPercent < 0 || run.progressPercent > 100)
            throw new Error("Agent progress must be 0..100");
        progressPercent = run.progressPercent;
        progressLabel = `${run.progressPercent}% verified`;
    }
    return Object.freeze({
        title: "Agent",
        route: "/agent",
        currentProject: run.projectTitle,
        currentTask: run.taskTitle,
        nextAction: run.nextAction,
        state: run.state,
        stateLabel,
        progressPercent,
        progressLabel,
        workBoundary: run.workBoundary
    });
}
export function homeBarriers(input) {
    if (!Number.isSafeInteger(input.reviewedOrParkedCount) || input.reviewedOrParkedCount < 0)
        throw new Error("Reviewed/parked count must be a non-negative integer");
    const lockedProject = input.lockedProject ?? null;
    if (lockedProject !== null && !lockedProject.trim())
        throw new Error("Locked project label cannot be blank");
    return Object.freeze({
        lockedProject,
        reviewedOrParkedCount: input.reviewedOrParkedCount,
        percentage: null,
        lockedProjectLabel: lockedProject ?? "No project locked",
        reviewedOrParkedLabel: `${input.reviewedOrParkedCount} reviewed or parked`
    });
}
//# sourceMappingURL=home-dashboard.js.map