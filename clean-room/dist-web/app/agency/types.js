import { parseTimestamp } from "../security/types.js";
const RUN_NEXT = {
    draft: ["queued", "stopped", "failed"],
    queued: ["working", "blocked", "needs_user", "paused", "stopped", "failed"],
    working: ["blocked", "needs_user", "paused", "completed", "stopped", "failed"],
    blocked: ["queued", "working", "stopped", "failed"],
    needs_user: ["queued", "working", "stopped", "failed"],
    paused: ["queued", "working", "stopped"],
    completed: [],
    stopped: [],
    failed: []
};
export function transitionRun(run, to, at) {
    if (!RUN_NEXT[run.state].includes(to))
        throw new Error(`Invalid Agency run transition: ${run.state} -> ${to}`);
    parseTimestamp(at, "at");
    if (run.stopRequested && to !== "stopped")
        throw new Error("Stopped-requested run may only transition to stopped");
    if (run.pauseRequested && to === "working")
        throw new Error("Pause-requested run cannot enter working");
    return Object.freeze({ ...run, state: to, updatedAt: at });
}
//# sourceMappingURL=types.js.map