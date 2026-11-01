import { parseTimestamp } from "../security/types.js";
const PRIORITY_RANK = Object.freeze({ critical: 0, normal: 1, low: 2 });
export class DispatchQueue {
    #records = new Map();
    accept(command) {
        if (!command.id.trim() || !command.ownerId.trim())
            throw new Error("Command identity and owner are required");
        parseTimestamp(command.issuedAt, "issuedAt");
        if (PRIORITY_RANK[command.priority] === undefined)
            throw new Error("Unsupported dispatch priority");
        if (this.#records.has(command.id))
            throw new Error(`Command already accepted: ${command.id}`);
        const record = Object.freeze({
            commandId: command.id,
            ownerId: command.ownerId,
            ...(command.projectId !== undefined ? { projectId: command.projectId } : {}),
            priority: command.priority,
            acceptedAt: command.issuedAt,
            state: "accepted"
        });
        this.#records.set(command.id, record);
        return record;
    }
    signal(commandId) {
        const current = this.#required(commandId);
        if (current.state !== "accepted")
            throw new Error("Dispatch signal requires an accepted command");
        const next = Object.freeze({ ...current, state: "dispatched", dispatchedAt: current.acceptedAt });
        this.#records.set(commandId, next);
        return next;
    }
    claim(commandId, workerId, claimedAt) {
        const current = this.#required(commandId);
        if (!workerId.trim())
            throw new Error("Execution claim requires a worker");
        parseTimestamp(claimedAt, "claimedAt");
        if (current.state === "claimed")
            throw new Error("Command already claimed for execution");
        const next = Object.freeze({ ...current, state: "claimed", executionClaimedAt: claimedAt, workerId });
        this.#records.set(commandId, next);
        return next;
    }
    assertExecutionAllowed(commandId) {
        if (this.#required(commandId).state !== "claimed")
            throw new Error("Execution requires an explicit claim after acceptance");
    }
    pending() {
        return Object.freeze([...this.#records.values()].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || Date.parse(a.acceptedAt) - Date.parse(b.acceptedAt) || a.commandId.localeCompare(b.commandId)));
    }
    snapshot() {
        return Object.freeze([...this.#records.values()]);
    }
    static restore(records) {
        const queue = new DispatchQueue();
        for (const record of records)
            queue.#records.set(record.commandId, Object.freeze({ ...record }));
        return queue;
    }
    #required(commandId) {
        const record = this.#records.get(commandId);
        if (!record)
            throw new Error(`Unknown dispatch command: ${commandId}`);
        return record;
    }
}
export function acquireProjectLock(store, projectId, workerId, now, expiresAt) {
    if (!projectId.trim())
        throw new Error("Project lock requires a project reference");
    return store.claim(`project:${projectId}`, workerId, now, expiresAt);
}
export function renewProjectLock(store, projectId, workerId, fencingToken, now, expiresAt) {
    return store.renew(`project:${projectId}`, workerId, fencingToken, now, expiresAt);
}
//# sourceMappingURL=dispatch.js.map