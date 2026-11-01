import { parseTimestamp } from "../security/types.js";
export class SchedulerControlPlane {
    #leadership;
    acquire(candidateId, now, expiresAt) {
        const nowMs = parseTimestamp(now, "now");
        const expiryMs = parseTimestamp(expiresAt, "expiresAt");
        if (expiryMs <= nowMs)
            throw new Error("Scheduler lease must expire after acquisition time");
        if (this.#leadership && nowMs < parseTimestamp(this.#leadership.expiresAt, "existingExpiresAt") && this.#leadership.leaderId !== candidateId)
            throw new Error("Scheduler leadership already held");
        const next = Object.freeze({ leaderId: candidateId, term: (this.#leadership?.term ?? 0) + 1, fencingToken: (this.#leadership?.fencingToken ?? 0) + 1, acquiredAt: now, expiresAt });
        this.#leadership = next;
        return next;
    }
    assertLeader(leaderId, fencingToken, now) {
        if (!this.#leadership || this.#leadership.leaderId !== leaderId || this.#leadership.fencingToken !== fencingToken)
            throw new Error("Scheduler leadership/fencing mismatch");
        if (parseTimestamp(now, "now") >= parseTimestamp(this.#leadership.expiresAt, "expiresAt"))
            throw new Error("Scheduler leadership expired");
    }
    current() { return this.#leadership; }
}
//# sourceMappingURL=scheduler.js.map