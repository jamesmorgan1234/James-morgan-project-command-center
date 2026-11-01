import { parseTimestamp } from "../security/types.js";
export class TaskClaimStore {
    #claims = new Map();
    #lastTokens = new Map();
    claim(taskId, workerId, claimedAt, expiresAt) {
        const now = parseTimestamp(claimedAt, "claimedAt");
        const expiry = parseTimestamp(expiresAt, "expiresAt");
        if (expiry <= now)
            throw new Error("Task claim expiry must be in the future");
        const current = this.#claims.get(taskId);
        if (current && now < parseTimestamp(current.expiresAt, "existingExpiresAt"))
            throw new Error(`Task already claimed: ${taskId}`);
        const token = (this.#lastTokens.get(taskId) ?? 0) + 1;
        this.#lastTokens.set(taskId, token);
        const claim = Object.freeze({ taskId, workerId, fencingToken: token, claimedAt, expiresAt });
        this.#claims.set(taskId, claim);
        return claim;
    }
    renew(taskId, workerId, fencingToken, now, expiresAt) {
        this.assertCommitAllowed(taskId, workerId, fencingToken, now);
        const nextExpiry = parseTimestamp(expiresAt, "expiresAt");
        if (nextExpiry <= parseTimestamp(now, "now"))
            throw new Error("Renewal expiry must be in the future");
        const current = this.#required(taskId);
        const updated = Object.freeze({ ...current, expiresAt });
        this.#claims.set(taskId, updated);
        return updated;
    }
    assertCommitAllowed(taskId, workerId, fencingToken, now) {
        const current = this.#required(taskId);
        if (current.workerId !== workerId || current.fencingToken !== fencingToken)
            throw new Error("Stale worker fencing token rejected");
        if (parseTimestamp(now, "now") >= parseTimestamp(current.expiresAt, "expiresAt"))
            throw new Error("Expired task claim cannot commit");
    }
    release(taskId, workerId, fencingToken, now) {
        this.assertCommitAllowed(taskId, workerId, fencingToken, now);
        this.#claims.delete(taskId);
    }
    get(taskId) { return this.#claims.get(taskId); }
    #required(taskId) {
        const claim = this.#claims.get(taskId);
        if (!claim)
            throw new Error(`No claim for task: ${taskId}`);
        return claim;
    }
}
//# sourceMappingURL=leases.js.map