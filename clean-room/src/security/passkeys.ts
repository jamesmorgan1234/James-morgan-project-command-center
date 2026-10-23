import { parseTimestamp } from "./types.js";

export interface PasskeyCredential {
  readonly id: string;
  readonly ownerId: string;
  readonly deviceId?: string;
  readonly publicKeyRef: string;
  readonly authenticatorAttachment: "platform";
  readonly userVerification: "required";
  readonly transports: readonly string[];
  readonly createdAt: string;
  readonly lastUsedAt?: string;
  readonly revokedAt?: string;
}

const FORBIDDEN_FIELDS = new Set(["biometricTemplate", "fingerprintTemplate", "faceTemplate", "privateKey", "rawCredential", "credentialSecret"]);

export class PasskeyRegistry {
  readonly #credentials = new Map<string, PasskeyCredential>();

  register(input: PasskeyCredential): void {
    const raw = input as unknown as Record<string, unknown>;
    for (const key of FORBIDDEN_FIELDS) if (key in raw) throw new Error(`Passkey metadata must not contain ${key}`);
    if (!input.id.trim() || !input.ownerId.trim() || !input.publicKeyRef.trim()) throw new Error("Passkey id, ownerId, and publicKeyRef are required");
    if (input.authenticatorAttachment !== "platform") throw new Error("Command Center passkeys require a platform authenticator");
    if (input.userVerification !== "required") throw new Error("Command Center passkeys require user verification");
    parseTimestamp(input.createdAt, "createdAt");
    if (this.#credentials.has(input.id)) throw new Error(`Passkey already exists: ${input.id}`);
    this.#credentials.set(input.id, Object.freeze({ ...input, transports: Object.freeze([...input.transports]) }));
  }

  get(id: string): PasskeyCredential | undefined { return this.#credentials.get(id); }
  listByOwner(ownerId: string): readonly PasskeyCredential[] { return Object.freeze([...this.#credentials.values()].filter((c) => c.ownerId === ownerId)); }

  assertUsable(id: string, ownerId: string): PasskeyCredential {
    const credential = this.#required(id);
    if (credential.ownerId !== ownerId) throw new Error("Passkey owner mismatch");
    if (credential.revokedAt) throw new Error(`Passkey revoked: ${id}`);
    return credential;
  }

  recordAssertion(id: string, ownerId: string, userVerified: boolean, assertedAt: string): PasskeyCredential {
    const current = this.assertUsable(id, ownerId);
    if (!userVerified) throw new Error("Passkey assertion requires user verification");
    parseTimestamp(assertedAt, "assertedAt");
    const updated = Object.freeze({ ...current, lastUsedAt: assertedAt });
    this.#credentials.set(id, updated);
    return updated;
  }

  revoke(id: string, revokedAt: string): PasskeyCredential {
    const current = this.#required(id);
    parseTimestamp(revokedAt, "revokedAt");
    const updated = Object.freeze({ ...current, revokedAt });
    this.#credentials.set(id, updated);
    return updated;
  }

  #required(id: string): PasskeyCredential {
    const credential = this.#credentials.get(id);
    if (!credential) throw new Error(`Unknown passkey: ${id}`);
    return credential;
  }
}
