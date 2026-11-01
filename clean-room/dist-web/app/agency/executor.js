/** Executor: task state machine, heartbeat, wake/result, real claim, locks and impact. */
const TRANSITIONS = Object.freeze({
    pending: { claim: "claimed" },
    claimed: { start: "working", fail: "failed" },
    working: { finish: "done", fail: "failed" },
    done: { reset: "pending" },
    failed: { reset: "pending" }
});
export function taskTransition(state, event) {
    const next = TRANSITIONS[state][event];
    if (next === undefined)
        throw new Error(`Invalid task transition: ${state} + ${event}`);
    return next;
}
export function heartbeat(lastSeen, now, timeoutMs) {
    const last = Date.parse(lastSeen);
    const current = Date.parse(now);
    if (Number.isNaN(last) || Number.isNaN(current))
        throw new Error("Heartbeat timestamps must be valid");
    return current - last > timeoutMs ? "stale" : "alive";
}
export function wakeContract(reason) {
    if (!reason.trim())
        throw new Error("An executor wake requires a reason");
    return reason;
}
export function resultContract(result) {
    if (!result.taskId.trim())
        throw new Error("An executor result requires a task");
    return `${result.taskId}:${result.outcome}`;
}
export function assertRealClaim(claim) {
    if (claim === null || !claim.executorId.trim())
        throw new Error("Working requires a real executor claim");
    return claim.executorId;
}
export function assertObjectiveLock(change, locked) {
    if (change.objective !== locked)
        throw new Error("The objective is hard locked");
}
export function impactRadius(scope) {
    if (scope !== "task" && scope !== "project" && scope !== "company")
        throw new Error("Impact radius must be classified");
    return scope;
}
//# sourceMappingURL=executor.js.map