import { parseTimestamp } from "../security/types.js";
function assertEvidenceRefs(refs) {
    if (refs.length === 0)
        throw new Error("Derived payload audit evidence is required");
    const normalized = refs.map((ref) => ref.trim());
    if (normalized.some((ref) => ref.length === 0))
        throw new Error("Derived payload audit evidence cannot contain blank refs");
    if (new Set(normalized).size !== normalized.length)
        throw new Error("Derived payload audit evidence refs must be unique");
    return Object.freeze([...normalized]);
}
function assertPayloadMaterial(record) {
    if (record.state === "erased") {
        if (record.payloadRef !== undefined || record.contentHash !== undefined || record.keyVersion !== undefined) {
            throw new Error("Erased derived payload cannot retain payload reference, content hash, or key version");
        }
        return;
    }
    if (!record.payloadRef?.trim())
        throw new Error("Present/restricted derived payload requires payloadRef");
    if (!record.contentHash || !/^[a-f0-9]{64}$/.test(record.contentHash))
        throw new Error("Derived payload requires lowercase sha256 contentHash");
    if (!Number.isInteger(record.keyVersion) || (record.keyVersion ?? 0) < 1)
        throw new Error("Derived payload requires positive integer keyVersion");
}
function key(ownerId, derivedId) {
    return `${ownerId}\u0000${derivedId}`;
}
export class DerivedPayloadRegistry {
    #records = new Map();
    #audit = new Map();
    #eventIds = new Set();
    register(record, audit) {
        if (!record.ownerId.trim() || !record.derivedId.startsWith("derived:"))
            throw new Error("Derived payload owner/id are required");
        if (record.state !== "present")
            throw new Error("New derived payload must start present");
        const created = parseTimestamp(record.createdAt, "derivedPayload.createdAt");
        const updated = parseTimestamp(record.updatedAt, "derivedPayload.updatedAt");
        if (updated < created)
            throw new Error("Derived payload updatedAt cannot predate createdAt");
        assertPayloadMaterial(record);
        const recordKey = key(record.ownerId, record.derivedId);
        if (this.#records.has(recordKey))
            throw new Error(`Derived payload already exists: ${record.derivedId}`);
        const frozen = Object.freeze({
            ownerId: record.ownerId,
            derivedId: record.derivedId,
            state: record.state,
            payloadRef: record.payloadRef.trim(),
            contentHash: record.contentHash.toLowerCase(),
            keyVersion: record.keyVersion,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        });
        this.#appendAudit(record.ownerId, record.derivedId, "registered", audit);
        this.#records.set(recordKey, frozen);
        return frozen;
    }
    restrict(ownerId, derivedId, audit) {
        const current = this.#required(ownerId, derivedId);
        if (current.state === "erased")
            throw new Error("Erased derived payload cannot be restricted or restored");
        if (current.state === "restricted")
            throw new Error("Derived payload is already restricted");
        parseTimestamp(audit.recordedAt, "derivedPayload.restrictedAt");
        const next = Object.freeze({ ...current, state: "restricted", updatedAt: audit.recordedAt });
        assertPayloadMaterial(next);
        this.#appendAudit(ownerId, derivedId, "restricted", audit);
        this.#records.set(key(ownerId, derivedId), next);
        return next;
    }
    erase(ownerId, derivedId, legalHold, audit) {
        const current = this.#required(ownerId, derivedId);
        if (legalHold)
            throw new Error("Legal hold blocks derived payload erasure");
        if (current.state === "erased")
            throw new Error("Derived payload is already erased");
        parseTimestamp(audit.recordedAt, "derivedPayload.erasedAt");
        const next = Object.freeze({
            ownerId: current.ownerId,
            derivedId: current.derivedId,
            state: "erased",
            createdAt: current.createdAt,
            updatedAt: audit.recordedAt
        });
        assertPayloadMaterial(next);
        this.#appendAudit(ownerId, derivedId, "erased", audit);
        this.#records.set(key(ownerId, derivedId), next);
        return next;
    }
    get(ownerId, derivedId) {
        return this.#records.get(key(ownerId, derivedId));
    }
    auditTrail(ownerId, derivedId) {
        return this.#audit.get(key(ownerId, derivedId)) ?? Object.freeze([]);
    }
    #required(ownerId, derivedId) {
        const record = this.#records.get(key(ownerId, derivedId));
        if (!record)
            throw new Error(`Unknown derived payload: ${derivedId}`);
        return record;
    }
    #appendAudit(ownerId, derivedId, action, audit) {
        if (!audit.eventId.trim())
            throw new Error("Derived payload audit eventId is required");
        if (this.#eventIds.has(audit.eventId))
            throw new Error(`Duplicate derived payload audit eventId: ${audit.eventId}`);
        if (!audit.reason.trim())
            throw new Error("Derived payload audit reason is required");
        parseTimestamp(audit.recordedAt, "derivedPayload.audit.recordedAt");
        const event = Object.freeze({
            eventId: audit.eventId.trim(),
            ownerId,
            derivedId,
            action,
            reason: audit.reason.trim(),
            evidenceRefs: assertEvidenceRefs(audit.evidenceRefs),
            recordedAt: audit.recordedAt
        });
        const recordKey = key(ownerId, derivedId);
        this.#audit.set(recordKey, Object.freeze([...(this.#audit.get(recordKey) ?? []), event]));
        this.#eventIds.add(event.eventId);
    }
}
//# sourceMappingURL=privacy.js.map