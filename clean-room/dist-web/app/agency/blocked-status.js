/**
 * Blocked-state surface and execution history.
 *
 * An agent must be able to say exactly why it stopped instead of guessing, and
 * its execution history must be queryable by project and run for root-cause
 * analysis.
 */
const REQUIRES_OWNER = Object.freeze({
    cannot_safely_continue: true,
    capability_missing: false,
    verification_impossible: true,
    authorization_expired: true,
    state_changed_since_plan: false,
    project_rule_conflict: true,
    resource_unavailable: false,
    owner_decision_required: true,
    external_provider_required: true,
    future_capability_recommended: true
});
export function blockedStatus(reason, message, detail = {}) {
    if (!message.trim())
        throw new Error("A blocked status requires a message");
    if (!(reason in REQUIRES_OWNER))
        throw new Error(`Unknown blocked reason: ${reason}`);
    return Object.freeze({ reason, message, detail: Object.freeze({ ...detail }), requiresOwner: REQUIRES_OWNER[reason] });
}
export class ExecutionHistory {
    #events = [];
    record(event) {
        if (!event.projectId.trim() || !event.runKey.trim() || !event.taskKey.trim())
            throw new Error("Execution events require project, run and task keys");
        if (Number.isNaN(Date.parse(event.at)))
            throw new Error("Execution event requires a valid timestamp");
        if (!event.code.trim())
            throw new Error("Execution event requires a code");
        this.#events.push(Object.freeze({ ...event }));
    }
    query(filter) {
        if (filter.projectId === undefined && filter.runKey === undefined)
            throw new Error("Execution history query requires a project or run");
        const matched = this.#events.filter((event) => (filter.projectId === undefined || event.projectId === filter.projectId)
            && (filter.runKey === undefined || event.runKey === filter.runKey));
        return Object.freeze([...matched].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)));
    }
    rootCause(projectId, runKey) {
        const events = this.query({ projectId, runKey });
        const failure = events.find((event) => event.outcome === "failed" || event.outcome === "blocked");
        return failure ?? null;
    }
}
//# sourceMappingURL=blocked-status.js.map