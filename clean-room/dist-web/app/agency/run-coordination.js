import { parseTimestamp } from "../security/types.js";
const KIND_RANK = Object.freeze({ stop: 0, pause: 1, start: 2 });
export class RunCoordinator {
    #commands = new Map();
    #activeRuns = new Map();
    #activeLanes = new Set();
    accept(command) {
        if (!command.id.trim() || !command.runKey.trim() || !command.taskKey.trim())
            throw new Error("Command identity, run and task keys are required");
        parseTimestamp(command.issuedAt, "issuedAt");
        if (this.#commands.has(command.id))
            throw new Error(`Command already accepted: ${command.id}`);
        const existing = [...this.#commands.values()];
        const byRun = existing.find((entry) => entry.runKey === command.runKey);
        if (byRun) {
            this.#commands.set(command.id, Object.freeze({ ...command }));
            return Object.freeze({ id: command.id, disposition: "duplicate_run", duplicateOf: byRun.id });
        }
        const byTask = existing.find((entry) => entry.taskKey === command.taskKey);
        if (byTask) {
            this.#commands.set(command.id, Object.freeze({ ...command }));
            return Object.freeze({ id: command.id, disposition: "duplicate_task", duplicateOf: byTask.id });
        }
        const byWork = existing.find((entry) => entry.kind === "start" && command.kind === "start" && entry.workFingerprint === command.workFingerprint);
        if (byWork) {
            this.#commands.set(command.id, Object.freeze({ ...command }));
            return Object.freeze({ id: command.id, disposition: "equivalent_work", duplicateOf: byWork.id });
        }
        this.#commands.set(command.id, Object.freeze({ ...command }));
        return Object.freeze({ id: command.id, disposition: "accepted", duplicateOf: null });
    }
    /** Coalesces pending starts that represent the same work, keeping the earliest. */
    coalesce() {
        const byWork = new Map();
        const passthrough = [];
        for (const command of this.#commands.values()) {
            if (command.kind !== "start") {
                passthrough.push(command);
                continue;
            }
            const key = `start:${command.workFingerprint}`;
            const prior = byWork.get(key);
            if (!prior || Date.parse(command.issuedAt) < Date.parse(prior.issuedAt))
                byWork.set(key, command);
        }
        return Object.freeze([...byWork.values(), ...passthrough]);
    }
    /** Stop outranks pause; pause outranks the next queued start. */
    next() {
        const ordered = [...this.#commands.values()].sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
        return ordered[0] ?? null;
    }
    startRun(projectId, runKey, lane = null) {
        if (!projectId.trim() || !runKey.trim())
            throw new Error("Run requires project and run key");
        if (this.#activeRuns.has(projectId))
            throw new Error(`Project already has an active run: ${projectId}`);
        if (lane !== null) {
            if (!lane.trim())
                throw new Error("Portfolio lane must be nonblank");
            if (this.#activeLanes.has(lane))
                throw new Error(`Portfolio lane already active: ${lane}`);
            this.#activeLanes.add(lane);
        }
        this.#activeRuns.set(projectId, runKey);
    }
    finishRun(projectId, lane = null) {
        this.#activeRuns.delete(projectId);
        if (lane !== null)
            this.#activeLanes.delete(lane);
    }
}
export function planRevalidation(stamp, current) {
    if (stamp.scopeVersion !== current.scopeVersion)
        return "scope_changed";
    if (stamp.ruleVersion !== current.ruleVersion)
        return "rule_changed";
    if (stamp.toolAvailabilityVersion !== current.toolAvailabilityVersion)
        return "tool_availability_changed";
    if (stamp.providerConnected !== current.providerConnected)
        return "provider_disconnected";
    return "none";
}
export function assertExecutorCompatible(executor, required) {
    if (!Number.isSafeInteger(executor.capabilityVersion) || !Number.isSafeInteger(executor.permissionVersion))
        throw new Error("Executor versions must be integers");
    for (const key of required.capabilityKeys)
        if (!executor.capabilityKeys.includes(key))
            throw new Error(`Executor lacks required capability: ${key}`);
    if (executor.capabilityVersion < required.capabilityVersion)
        throw new Error("Executor capability version is stale");
    if (executor.permissionVersion < required.permissionVersion)
        throw new Error("Executor permission version is stale");
}
export function toolHealthSnapshotAtStart(executor, requiredTools) {
    const snapshot = {};
    for (const tool of requiredTools) {
        const health = executor.toolHealth[tool];
        if (health === undefined)
            throw new Error(`Executor does not report tool health for: ${tool}`);
        snapshot[tool] = health;
    }
    return Object.freeze(snapshot);
}
export function assertFreshOwnerRule(ruleVersionAtPlan, currentRuleVersion) {
    if (ruleVersionAtPlan !== currentRuleVersion)
        throw new Error("Owner rule changed; revalidate before an external side effect");
}
//# sourceMappingURL=run-coordination.js.map