import { parseTimestamp } from "./types.js";
const FORBIDDEN_FIELDS = new Set(["biometricTemplate", "fingerprintTemplate", "faceTemplate", "privateKey", "rawCredential", "credentialSecret"]);
export class PasskeyRegistry {
    #credentials = new Map();
    register(input) {
        const raw = input;
        for (const key of FORBIDDEN_FIELDS)
            if (key in raw)
                throw new Error(`Passkey metadata must not contain ${key}`);
        if (!input.id.trim() || !input.ownerId.trim() || !input.publicKeyRef.trim())
            throw new Error("Passkey id, ownerId, and publicKeyRef are required");
        if (input.authenticatorAttachment !== "platform")
            throw new Error("Command Center passkeys require a platform authenticator");
        if (input.userVerification !== "required")
            throw new Error("Command Center passkeys require user verification");
        parseTimestamp(input.createdAt, "createdAt");
        if (this.#credentials.has(input.id))
            throw new Error(`Passkey already exists: ${input.id}`);
        this.#credentials.set(input.id, Object.freeze({ ...input, transports: Object.freeze([...input.transports]) }));
    }
    get(id) { return this.#credentials.get(id); }
    listByOwner(ownerId) { return Object.freeze([...this.#credentials.values()].filter((c) => c.ownerId === ownerId)); }
    assertUsable(id, ownerId) {
        const credential = this.#required(id);
        if (credential.ownerId !== ownerId)
            throw new Error("Passkey owner mismatch");
        if (credential.revokedAt)
            throw new Error(`Passkey revoked: ${id}`);
        return credential;
    }
    recordAssertion(id, ownerId, userVerified, assertedAt) {
        const current = this.assertUsable(id, ownerId);
        if (!userVerified)
            throw new Error("Passkey assertion requires user verification");
        parseTimestamp(assertedAt, "assertedAt");
        const updated = Object.freeze({ ...current, lastUsedAt: assertedAt });
        this.#credentials.set(id, updated);
        return updated;
    }
    revoke(id, revokedAt) {
        const current = this.#required(id);
        parseTimestamp(revokedAt, "revokedAt");
        const updated = Object.freeze({ ...current, revokedAt });
        this.#credentials.set(id, updated);
        return updated;
    }
    #required(id) {
        const credential = this.#credentials.get(id);
        if (!credential)
            throw new Error(`Unknown passkey: ${id}`);
        return credential;
    }
}
//# sourceMappingURL=passkeys.js.map