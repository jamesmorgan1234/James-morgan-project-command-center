const ALLOWED = {
    cold: ["starting"],
    starting: ["hydrating", "failed"],
    hydrating: ["ready", "offline_ready", "degraded", "failed"],
    ready: ["offline_ready", "degraded", "failed"],
    offline_ready: ["ready", "degraded", "failed"],
    degraded: ["ready", "offline_ready", "failed"],
    failed: ["starting"]
};
export function assessStartupCondition(condition) {
    switch (condition) {
        case "no_local_state":
            return Object.freeze({ condition, disposition: "initialize", stateContractVerified: true, routerMayInitialize: true, validStateMayBePreserved: true, recoverySurfaceRequired: false });
        case "valid_local_state":
            return Object.freeze({ condition, disposition: "initialize", stateContractVerified: true, routerMayInitialize: true, validStateMayBePreserved: true, recoverySurfaceRequired: false });
        case "partially_migrated_state":
            return Object.freeze({ condition, disposition: "repair_then_initialize", stateContractVerified: false, routerMayInitialize: false, validStateMayBePreserved: true, recoverySurfaceRequired: true });
        case "provider_disconnected":
        case "provider_stale":
        case "browser_offline":
            return Object.freeze({ condition, disposition: "degraded", stateContractVerified: true, routerMayInitialize: true, validStateMayBePreserved: true, recoverySurfaceRequired: false });
        case "corrupted_state":
        case "stale_service_worker":
            return Object.freeze({ condition, disposition: "recover", stateContractVerified: false, routerMayInitialize: false, validStateMayBePreserved: true, recoverySurfaceRequired: true });
        case "provider_unauthorized":
        case "failed_integrity_check":
            return Object.freeze({ condition, disposition: "block", stateContractVerified: false, routerMayInitialize: false, validStateMayBePreserved: true, recoverySurfaceRequired: true });
    }
}
export function shellBootstrapTrace(input) {
    if (!Number.isFinite(input.thresholdMs) || input.thresholdMs <= 0)
        throw new Error("Startup performance threshold must be positive");
    const started = Date.parse(input.startedAt);
    if (!Number.isFinite(started))
        throw new Error("Startup trace requires a valid startedAt timestamp");
    const assessment = assessStartupCondition(input.condition);
    if (input.completedAt === undefined)
        return Object.freeze({ startedAt: input.startedAt, thresholdMs: input.thresholdMs, condition: input.condition, disposition: assessment.disposition });
    const completed = Date.parse(input.completedAt);
    if (!Number.isFinite(completed) || completed < started)
        throw new Error("Startup trace requires a valid completedAt timestamp at or after startedAt");
    return Object.freeze({ startedAt: input.startedAt, completedAt: input.completedAt, thresholdMs: input.thresholdMs, elapsedMs: completed - started, condition: input.condition, disposition: assessment.disposition });
}
export class ApplicationShell {
    #state = "cold";
    #mounts = new Map();
    get state() { return this.#state; }
    transition(to) {
        if (!ALLOWED[this.#state].includes(to))
            throw new Error(`Invalid shell transition: ${this.#state} -> ${to}`);
        this.#state = to;
    }
    mount(mount) {
        if (!mount.slot.trim() || !mount.moduleKey.trim())
            throw new Error("Shell slot and moduleKey are required");
        if (this.#mounts.has(mount.slot))
            throw new Error(`Shell slot already has an owner: ${mount.slot}`);
        this.#mounts.set(mount.slot, Object.freeze({ ...mount }));
    }
    unmount(slot, moduleKey) {
        const current = this.#mounts.get(slot);
        if (!current)
            throw new Error(`Unknown shell slot: ${slot}`);
        if (current.moduleKey !== moduleKey)
            throw new Error(`Module ${moduleKey} does not own shell slot ${slot}`);
        this.#mounts.delete(slot);
    }
    listMounts() { return Object.freeze([...this.#mounts.values()]); }
}
//# sourceMappingURL=shell.js.map