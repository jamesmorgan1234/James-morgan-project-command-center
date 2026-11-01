import { parseTimestamp } from "../security/types.js";
import { assertProvenanceRefs } from "./provenance.js";
export class DerivedLifecycleRegistry {
    #records = new Map();
    register(record) {
        if (!record.id.startsWith("derived:") || !record.ownerId.trim() || !record.purpose.trim() || !record.retentionClass.trim())
            throw new Error("Derived identity/owner/purpose/retention are required");
        const created = parseTimestamp(record.createdAt, "derived.createdAt");
        const updated = parseTimestamp(record.updatedAt, "derived.updatedAt");
        if (updated < created)
            throw new Error("Derived updatedAt cannot predate createdAt");
        if (record.state === "deleted" && record.legalHold)
            throw new Error("Held derived record cannot start deleted");
        if (!record.legalHold && record.holdReason !== undefined)
            throw new Error("holdReason requires an active legal hold");
        if (record.holdReleasedAt !== undefined || record.holdReleaseAuthorizationRef !== undefined || record.holdReleaseReason !== undefined)
            throw new Error("New derived records cannot start with hold-release evidence");
        if (this.#records.has(record.id))
            throw new Error(`Derived record already exists: ${record.id}`);
        const frozen = Object.freeze({ ...record, provenance: assertProvenanceRefs(record.provenance) });
        this.#records.set(record.id, frozen);
        return frozen;
    }
    placeLegalHold(id, at, reason) {
        const current = this.#required(id);
        parseTimestamp(at, "at");
        if (!reason.trim())
            throw new Error("Legal hold reason is required");
        if (current.state === "deleted")
            throw new Error("Deleted derived record cannot be placed on hold");
        if (current.legalHold)
            throw new Error("Derived record is already on legal hold");
        const next = Object.freeze({ ...current, legalHold: true, holdReason: reason.trim(), updatedAt: at });
        this.#records.set(id, next);
        return next;
    }
    releaseLegalHold(id, at, authorizationRef, reason) {
        const current = this.#required(id);
        parseTimestamp(at, "at");
        const normalizedAuthorizationRef = authorizationRef.trim();
        const normalizedReason = reason.trim();
        if (!normalizedAuthorizationRef)
            throw new Error("Legal hold release requires explicit authorizationRef");
        if (!normalizedReason)
            throw new Error("Legal hold release reason is required");
        if (!current.legalHold)
            throw new Error("Derived record is not on legal hold");
        const invalidatedWhileHeld = current.state === "restricted" && current.restrictionReason?.startsWith("legal_hold:") === true;
        const { holdReason: _releasedHoldReason, ...withoutActiveHoldReason } = current;
        const next = Object.freeze({
            ...withoutActiveHoldReason,
            legalHold: false,
            state: invalidatedWhileHeld ? "deleted" : current.state,
            updatedAt: at,
            holdReleasedAt: at,
            holdReleaseAuthorizationRef: normalizedAuthorizationRef,
            holdReleaseReason: normalizedReason,
            ...(invalidatedWhileHeld ? { restrictionReason: `hold_released_after_invalidated:${normalizedReason}` } : {})
        });
        this.#records.set(id, next);
        return next;
    }
    invalidateByObservation(observationId, at, reason) {
        parseTimestamp(at, "at");
        if (!reason.trim())
            throw new Error("Derived invalidation reason is required");
        const changed = [];
        for (const [id, record] of this.#records) {
            if (!record.provenance.some((ref) => ref.observationId === observationId) || record.state === "deleted")
                continue;
            const next = record.legalHold
                ? Object.freeze({ ...record, state: "restricted", updatedAt: at, restrictionReason: `legal_hold:${reason}` })
                : Object.freeze({ ...record, state: "deleted", updatedAt: at, restrictionReason: reason });
            this.#records.set(id, next);
            changed.push(next);
        }
        return Object.freeze(changed);
    }
    restrictPurpose(id, at, reason) {
        const current = this.#required(id);
        parseTimestamp(at, "at");
        if (!reason.trim())
            throw new Error("Restriction reason is required");
        if (current.state === "deleted")
            throw new Error("Deleted derived record cannot be reactivated/restricted");
        const next = Object.freeze({ ...current, state: "restricted", updatedAt: at, restrictionReason: reason });
        this.#records.set(id, next);
        return next;
    }
    get(id) { return this.#records.get(id); }
    #required(id) {
        const record = this.#records.get(id);
        if (!record)
            throw new Error(`Unknown derived record: ${id}`);
        return record;
    }
}
//# sourceMappingURL=derived.js.map