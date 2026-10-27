import { parseTimestamp, type SecretReferenceState } from "./types.js";

export interface SecretReferenceMetadata {
  readonly id: string;
  readonly provider: string;
  readonly purpose: string;
  readonly state: SecretReferenceState;
  readonly createdAt: string;
  readonly version?: number;
  readonly keyVersion?: number;
  readonly expiresAt?: string;
  readonly rotatedAt?: string;
  readonly revokedAt?: string;
  readonly replacedBy?: string;
  readonly rotationOverlapUntil?: string;
  readonly lastHealthCheckAt?: string;
  readonly dependentServiceKeys?: readonly string[];
}

const FORBIDDEN_KEYS = new Set([
  "secret", "token", "password", "apikey", "privatekey", "credentialvalue", "raw", "authorization", "accesstoken", "refreshtoken", "clientsecret", "webhooksecret"
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

function latestReferenceEventMs(record: SecretReferenceMetadata): number {
  return Math.max(
    parseTimestamp(record.createdAt, "createdAt"),
    record.rotatedAt ? parseTimestamp(record.rotatedAt, "rotatedAt") : Number.NEGATIVE_INFINITY,
    record.revokedAt ? parseTimestamp(record.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY,
    record.lastHealthCheckAt ? parseTimestamp(record.lastHealthCheckAt, "lastHealthCheckAt") : Number.NEGATIVE_INFINITY
  );
}

export class SecretReferenceRegistry {
  readonly #references = new Map<string, SecretReferenceMetadata>();

  register(record: SecretReferenceMetadata): void {
    assertReferenceOnly(record as unknown as Record<string, unknown>);
    if (!record.id.trim() || !record.provider.trim() || !record.purpose.trim()) throw new Error("Secret reference id/provider/purpose are required");
    parseTimestamp(record.createdAt, "createdAt");
    if (record.expiresAt) parseTimestamp(record.expiresAt, "expiresAt");
    if (record.version !== undefined && (!Number.isSafeInteger(record.version) || record.version < 1)) throw new Error("Secret reference version must be positive");
    if (record.keyVersion !== undefined && (!Number.isSafeInteger(record.keyVersion) || record.keyVersion < 1)) throw new Error("Secret reference keyVersion must be positive");
    if (record.dependentServiceKeys && new Set(record.dependentServiceKeys).size !== record.dependentServiceKeys.length) throw new Error("dependentServiceKeys must be unique");
    if (this.#references.has(record.id)) throw new Error(`Secret reference already exists: ${record.id}`);
    this.#references.set(record.id, Object.freeze({ ...record, ...(record.dependentServiceKeys ? { dependentServiceKeys: Object.freeze([...record.dependentServiceKeys]) } : {}) }));
  }

  get(id: string): SecretReferenceMetadata | undefined { return this.#references.get(id); }
  list(): readonly SecretReferenceMetadata[] { return Object.freeze([...this.#references.values()]); }

  assertUsable(id: string, at: string): SecretReferenceMetadata {
    const current = this.#required(id);
    const now = parseTimestamp(at, "at");
    if (current.state === "revoked" || current.revokedAt) throw new Error(`Secret reference revoked: ${id}`);
    if (current.state === "expired") throw new Error(`Secret reference expired: ${id}`);
    if (current.expiresAt && now >= parseTimestamp(current.expiresAt, "expiresAt")) throw new Error(`Secret reference expired: ${id}`);
    if (current.state === "degraded" && current.rotationOverlapUntil && now >= parseTimestamp(current.rotationOverlapUntil, "rotationOverlapUntil")) throw new Error(`Secret rotation overlap ended: ${id}`);
    return current;
  }

  rotate(id: string, replacement: SecretReferenceMetadata, rotatedAt: string, rotationOverlapUntil?: string): readonly [SecretReferenceMetadata, SecretReferenceMetadata] {
    const current = this.#required(id);
    parseTimestamp(rotatedAt, "rotatedAt");
    if (replacement.provider !== current.provider || replacement.purpose !== current.purpose) throw new Error("Replacement credential must preserve provider/purpose");
    if (rotationOverlapUntil && parseTimestamp(rotationOverlapUntil, "rotationOverlapUntil") <= parseTimestamp(rotatedAt, "rotatedAt")) throw new Error("Rotation overlap must end after rotation time");
    this.register(replacement);
    const updated = Object.freeze({ ...current, state: "degraded" as const, rotatedAt, replacedBy: replacement.id, ...(rotationOverlapUntil ? { rotationOverlapUntil } : {}) });
    this.#references.set(id, updated);
    return Object.freeze([updated, this.#required(replacement.id)]);
  }

  replaceProvider(id: string, replacement: SecretReferenceMetadata, replacedAt: string): readonly [SecretReferenceMetadata, SecretReferenceMetadata] {
    const current = this.#required(id);
    const replacementTime = parseTimestamp(replacedAt, "replacedAt");
    if (replacement.provider === current.provider) throw new Error("Provider replacement must use a different provider");
    if (replacement.purpose !== current.purpose) throw new Error("Provider replacement must preserve credential purpose");
    if (replacementTime < latestReferenceEventMs(current)) throw new Error("Provider replacement cannot move credential time backward");
    if (parseTimestamp(replacement.createdAt, "replacement.createdAt") > replacementTime) throw new Error("Replacement credential cannot be created after provider replacement");
    this.register(replacement);
    const updated = Object.freeze({ ...current, state: "revoked" as const, revokedAt: replacedAt, replacedBy: replacement.id });
    this.#references.set(id, updated);
    return Object.freeze([updated, this.#required(replacement.id)]);
  }

  setState(id: string, state: SecretReferenceState, at: string): SecretReferenceMetadata {
    const current = this.#required(id);
    parseTimestamp(at, "at");
    const updated = state === "revoked"
      ? Object.freeze({ ...current, state, revokedAt: at })
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
