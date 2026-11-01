import { parseTimestamp } from "./types.js";
export const TRUSTED_PROTECTED_AUTHORITY_SOURCES = ["owner_verified", "trusted_security_policy"];
function latestAuthorizationEventMs(record) {
    return Math.max(parseTimestamp(record.issuedAt, "issuedAt"), record.consumedAt ? parseTimestamp(record.consumedAt, "consumedAt") : Number.NEGATIVE_INFINITY, record.revokedAt ? parseTimestamp(record.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY);
}
export class ProtectedAuthorizationRegistry {
    #records = new Map();
    register(record) {
        if (!record.id.trim() || !record.ownerId.trim() || !record.sessionId.trim() || !record.action.trim() || !record.authorizationIntentBinding.trim() || !record.sourceRef.trim()) {
            throw new Error("Protected authorization identity, source, and intent binding are required");
        }
        if (!TRUSTED_PROTECTED_AUTHORITY_SOURCES.includes(record.authoritySource)) {
            throw new Error("Protected authorization authority source is untrusted");
        }
        if (record.state !== "authorized")
            throw new Error("New protected authorization must start authorized");
        const issued = parseTimestamp(record.issuedAt, "issuedAt");
        const expires = parseTimestamp(record.expiresAt, "expiresAt");
        if (expires <= issued)
            throw new Error("Protected authorization expiry must follow issuance");
        if (record.consumedAt || record.revokedAt || record.revocationReason)
            throw new Error("New protected authorization cannot start terminal");
        if (this.#records.has(record.id))
            throw new Error(`Protected authorization already exists: ${record.id}`);
        this.#records.set(record.id, Object.freeze({ ...record }));
    }
    get(id) { return this.#records.get(id); }
    assertUsable(id, use, now) {
        const current = this.#required(id);
        const nowMs = parseTimestamp(now, "now");
        const issuedMs = parseTimestamp(current.issuedAt, "issuedAt");
        if (nowMs < issuedMs)
            throw new Error(`Protected authorization not yet valid: ${id}`);
        if (current.state === "consumed")
            throw new Error(`Protected authorization already consumed: ${id}`);
        if (current.state === "revoked")
            throw new Error(`Protected authorization revoked: ${id}`);
        if (current.state === "expired" || nowMs >= parseTimestamp(current.expiresAt, "expiresAt")) {
            if (current.state !== "expired")
                this.#records.set(id, Object.freeze({ ...current, state: "expired" }));
            throw new Error(`Protected authorization expired: ${id}`);
        }
        if (current.ownerId !== use.ownerId)
            throw new Error("Protected authorization owner mismatch");
        if (current.sessionId !== use.sessionId)
            throw new Error("Protected authorization session mismatch");
        if (current.action !== use.action)
            throw new Error("Protected authorization action mismatch");
        if (current.authorizationIntentBinding !== use.authorizationIntentBinding)
            throw new Error("Protected authorization intent mismatch");
        return current;
    }
    consume(id, use, consumedAt) {
        const current = this.assertUsable(id, use, consumedAt);
        const consumedMs = parseTimestamp(consumedAt, "consumedAt");
        if (consumedMs < latestAuthorizationEventMs(current))
            throw new Error("Protected authorization time cannot move backward");
        const updated = Object.freeze({ ...current, state: "consumed", consumedAt });
        this.#records.set(id, updated);
        return updated;
    }
    revoke(id, revokedAt, reason) {
        const current = this.#required(id);
        if (!reason.trim())
            throw new Error("Protected authorization revocation reason is required");
        if (current.state === "consumed")
            throw new Error(`Cannot revoke consumed protected authorization: ${id}`);
        if (current.state === "revoked")
            return current;
        const revokedMs = parseTimestamp(revokedAt, "revokedAt");
        if (revokedMs < latestAuthorizationEventMs(current))
            throw new Error("Protected authorization time cannot move backward");
        const updated = Object.freeze({ ...current, state: "revoked", revokedAt, revocationReason: reason });
        this.#records.set(id, updated);
        return updated;
    }
    #required(id) {
        const record = this.#records.get(id);
        if (!record)
            throw new Error(`Unknown protected authorization: ${id}`);
        return record;
    }
}
//# sourceMappingURL=protected-authorizations.js.map