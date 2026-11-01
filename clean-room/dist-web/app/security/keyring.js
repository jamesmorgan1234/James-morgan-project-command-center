import { parseTimestamp } from "./types.js";
export class EncryptionKeyRegistry {
    #keys = new Map();
    register(key) {
        if (!key.id.trim() || !Number.isSafeInteger(key.version) || key.version < 1)
            throw new Error("Encryption key id/version are required");
        parseTimestamp(key.createdAt, "createdAt");
        if (key.retiringAt)
            parseTimestamp(key.retiringAt, "retiringAt");
        if (key.revokedAt)
            parseTimestamp(key.revokedAt, "revokedAt");
        if (this.#keys.has(key.id))
            throw new Error(`Encryption key already exists: ${key.id}`);
        this.#keys.set(key.id, Object.freeze({ ...key }));
    }
    setState(id, state, at) {
        parseTimestamp(at, "at");
        const current = this.#required(id);
        const next = state === "revoked" ? Object.freeze({ ...current, state, revokedAt: at }) : state === "retiring" ? Object.freeze({ ...current, state, retiringAt: at }) : Object.freeze({ ...current, state });
        this.#keys.set(id, next);
        return next;
    }
    assertDecryptAllowed(id) {
        const key = this.#required(id);
        if (key.state === "revoked" || key.revokedAt)
            throw new Error(`Revoked encryption key cannot decrypt restored data: ${id}`);
        return key;
    }
    get(id) { return this.#keys.get(id); }
    #required(id) {
        const key = this.#keys.get(id);
        if (!key)
            throw new Error(`Unknown encryption key: ${id}`);
        return key;
    }
}
//# sourceMappingURL=keyring.js.map