import { parseTimestamp, type SecretReferenceState } from "./types.js";

export interface SecretReferenceMetadata {
  readonly id: string;
  readonly provider: string;
  readonly purpose: string;
  readonly state: SecretReferenceState;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly rotatedAt?: string;
  readonly lastHealthCheckAt?: string;
}

const FORBIDDEN_KEYS = new Set(["secret", "token", "password", "apiKey", "privateKey", "credentialValue", "raw"]);
const SECRET_PATTERNS = [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bsk-[A-Za-z0-9_-]{12,}\b/, /\bghp_[A-Za-z0-9]{20,}\b/, /\bxoxb-[A-Za-z0-9-]{12,}\b/];

export function assertReferenceOnly(value: Record<string, unknown>): void {
  for (const [key, raw] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Secret material field is forbidden: ${key}`);
    if (typeof raw === "string" && SECRET_PATTERNS.some((pattern) => pattern.test(raw))) throw new Error(`Secret-like material is forbidden in metadata field: ${key}`);
  }
}

export class SecretReferenceRegistry {
  readonly #references = new Map<string, SecretReferenceMetadata>();

  register(record: SecretReferenceMetadata): void {
    assertReferenceOnly(record as unknown as Record<string, unknown>);
    if (!record.id.trim() || !record.provider.trim() || !record.purpose.trim()) throw new Error("Secret reference id/provider/purpose are required");
    parseTimestamp(record.createdAt, "createdAt");
    if (record.expiresAt) parseTimestamp(record.expiresAt, "expiresAt");
    if (this.#references.has(record.id)) throw new Error(`Secret reference already exists: ${record.id}`);
    this.#references.set(record.id, Object.freeze({ ...record }));
  }

  get(id: string): SecretReferenceMetadata | undefined { return this.#references.get(id); }
  list(): readonly SecretReferenceMetadata[] { return Object.freeze([...this.#references.values()]); }

  setState(id: string, state: SecretReferenceState, at: string): SecretReferenceMetadata {
    const current = this.#required(id);
    parseTimestamp(at, "at");
    const updated = state === "revoked"
      ? Object.freeze({ ...current, state, rotatedAt: at })
      : Object.freeze({ ...current, state, lastHealthCheckAt: at });
    this.#references.set(id, updated);
    return updated;
  }

  #required(id: string): SecretReferenceMetadata {
    const record = this.#references.get(id);
    if (!record) throw new Error(`Unknown secret reference: ${id}`);
    return record;
  }
}
