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

const FORBIDDEN_KEYS = new Set([
  "secret",
  "token",
  "password",
  "apikey",
  "privatekey",
  "credentialvalue",
  "raw",
  "authorization",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "webhooksecret"
]);
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bxoxb-[A-Za-z0-9-]{12,}\b/,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}={0,2}\b/i
];

function normalizedKey(key: string): string { return key.replace(/[^a-z0-9]/giu, "").toLowerCase(); }

function inspectReferenceOnly(value: unknown, path: string, seen: WeakSet<object>): void {
  if (typeof value === "string") {
    if (SECRET_PATTERNS.some((pattern) => pattern.test(value))) throw new Error(`Secret-like material is forbidden in metadata field: ${path}`);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectReferenceOnly(entry, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_KEYS.has(normalizedKey(key))) throw new Error(`Secret material field is forbidden: ${nextPath}`);
    inspectReferenceOnly(raw, nextPath, seen);
  }
}

export function assertReferenceOnly(value: Record<string, unknown>): void {
  inspectReferenceOnly(value, "metadata", new WeakSet<object>());
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
