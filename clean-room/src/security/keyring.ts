import { parseTimestamp } from "./types.js";

export type EncryptionKeyState = "active" | "retiring" | "revoked";

export interface EncryptionKeyReference {
  readonly id: string;
  readonly version: number;
  readonly state: EncryptionKeyState;
  readonly createdAt: string;
  readonly retiringAt?: string;
  readonly revokedAt?: string;
}

export class EncryptionKeyRegistry {
  readonly #keys = new Map<string, EncryptionKeyReference>();

  register(key: EncryptionKeyReference): void {
    if (!key.id.trim() || !Number.isSafeInteger(key.version) || key.version < 1) throw new Error("Encryption key id/version are required");
    parseTimestamp(key.createdAt, "createdAt");
    if (key.retiringAt) parseTimestamp(key.retiringAt, "retiringAt");
    if (key.revokedAt) parseTimestamp(key.revokedAt, "revokedAt");
    if (this.#keys.has(key.id)) throw new Error(`Encryption key already exists: ${key.id}`);
    this.#keys.set(key.id, Object.freeze({ ...key }));
  }

  setState(id: string, state: EncryptionKeyState, at: string): EncryptionKeyReference {
    parseTimestamp(at, "at");
    const current = this.#required(id);
    const next = state === "revoked" ? Object.freeze({ ...current, state, revokedAt: at }) : state === "retiring" ? Object.freeze({ ...current, state, retiringAt: at }) : Object.freeze({ ...current, state });
    this.#keys.set(id, next);
    return next;
  }

  assertDecryptAllowed(id: string): EncryptionKeyReference {
    const key = this.#required(id);
    if (key.state === "revoked" || key.revokedAt) throw new Error(`Revoked encryption key cannot decrypt restored data: ${id}`);
    return key;
  }

  get(id: string): EncryptionKeyReference | undefined { return this.#keys.get(id); }

  #required(id: string): EncryptionKeyReference {
    const key = this.#keys.get(id);
    if (!key) throw new Error(`Unknown encryption key: ${id}`);
    return key;
  }
}
