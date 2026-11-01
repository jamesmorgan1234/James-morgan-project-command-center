import { parseTimestamp } from "./types.js";
export class DeviceRegistry {
    #devices = new Map();
    register(record) {
        if (!record.id.trim() || !record.ownerId.trim() || !record.label.trim() || !record.platform.trim())
            throw new Error("Device identity fields are required");
        parseTimestamp(record.createdAt, "createdAt");
        if (record.trustState === "revoked")
            throw new Error("New device cannot start revoked");
        if (this.#devices.has(record.id))
            throw new Error(`Device already exists: ${record.id}`);
        this.#devices.set(record.id, Object.freeze({ ...record }));
    }
    get(id) { return this.#devices.get(id); }
    listByOwner(ownerId) { return Object.freeze([...this.#devices.values()].filter((d) => d.ownerId === ownerId)); }
    assertUsable(id, ownerId) {
        const current = this.#required(id);
        if (current.ownerId !== ownerId)
            throw new Error("Device owner mismatch");
        if (current.trustState === "revoked")
            throw new Error(`Device revoked: ${id}`);
        return current;
    }
    markSeen(id, seenAt) {
        const current = this.#required(id);
        if (current.trustState === "revoked")
            throw new Error(`Device revoked: ${id}`);
        parseTimestamp(seenAt, "seenAt");
        const updated = Object.freeze({ ...current, lastSeenAt: seenAt });
        this.#devices.set(id, updated);
        return updated;
    }
    setTrusted(id) {
        const current = this.#required(id);
        if (current.trustState === "revoked")
            throw new Error(`Device revoked: ${id}`);
        const updated = Object.freeze({ ...current, trustState: "trusted" });
        this.#devices.set(id, updated);
        return updated;
    }
    revoke(id, revokedAt) {
        const current = this.#required(id);
        parseTimestamp(revokedAt, "revokedAt");
        const updated = Object.freeze({ ...current, trustState: "revoked", revokedAt });
        this.#devices.set(id, updated);
        return updated;
    }
    #required(id) {
        const device = this.#devices.get(id);
        if (!device)
            throw new Error(`Unknown device: ${id}`);
        return device;
    }
}
//# sourceMappingURL=devices.js.map