import { parseTimestamp } from "./types.js";

export type ProtectedAuthorizationState = "authorized" | "consumed" | "revoked" | "expired";
export const TRUSTED_PROTECTED_AUTHORITY_SOURCES = ["owner_verified", "trusted_security_policy"] as const;
export type ProtectedAuthorizationAuthoritySource = (typeof TRUSTED_PROTECTED_AUTHORITY_SOURCES)[number];

export interface ProtectedAuthorizationRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly sessionId: string;
  readonly action: string;
  readonly authorizationIntentBinding: string;
  readonly authoritySource: ProtectedAuthorizationAuthoritySource;
  readonly sourceRef: string;
  readonly state: ProtectedAuthorizationState;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly consumedAt?: string;
  readonly revokedAt?: string;
  readonly revocationReason?: string;
}

export interface ProtectedAuthorizationUse {
  readonly ownerId: string;
  readonly sessionId: string;
  readonly action: string;
  readonly authorizationIntentBinding: string;
}

function latestAuthorizationEventMs(record: ProtectedAuthorizationRecord): number {
  return Math.max(
    parseTimestamp(record.issuedAt, "issuedAt"),
    record.consumedAt ? parseTimestamp(record.consumedAt, "consumedAt") : Number.NEGATIVE_INFINITY,
    record.revokedAt ? parseTimestamp(record.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY
  );
}

export class ProtectedAuthorizationRegistry {
  readonly #records = new Map<string, ProtectedAuthorizationRecord>();

  register(record: ProtectedAuthorizationRecord): void {
    if (!record.id.trim() || !record.ownerId.trim() || !record.sessionId.trim() || !record.action.trim() || !record.authorizationIntentBinding.trim() || !record.sourceRef.trim()) {
      throw new Error("Protected authorization identity, source, and intent binding are required");
    }
    if (!(TRUSTED_PROTECTED_AUTHORITY_SOURCES as readonly string[]).includes(record.authoritySource)) {
      throw new Error("Protected authorization authority source is untrusted");
    }
    if (record.state !== "authorized") throw new Error("New protected authorization must start authorized");
    const issued = parseTimestamp(record.issuedAt, "issuedAt");
    const expires = parseTimestamp(record.expiresAt, "expiresAt");
    if (expires <= issued) throw new Error("Protected authorization expiry must follow issuance");
    if (record.consumedAt || record.revokedAt || record.revocationReason) throw new Error("New protected authorization cannot start terminal");
    if (this.#records.has(record.id)) throw new Error(`Protected authorization already exists: ${record.id}`);
    this.#records.set(record.id, Object.freeze({ ...record }));
  }

  get(id: string): ProtectedAuthorizationRecord | undefined { return this.#records.get(id); }

  assertUsable(id: string, use: ProtectedAuthorizationUse, now: string): ProtectedAuthorizationRecord {
    const current = this.#required(id);
    const nowMs = parseTimestamp(now, "now");
    const issuedMs = parseTimestamp(current.issuedAt, "issuedAt");
    if (nowMs < issuedMs) throw new Error(`Protected authorization not yet valid: ${id}`);
    if (current.state === "consumed") throw new Error(`Protected authorization already consumed: ${id}`);
    if (current.state === "revoked") throw new Error(`Protected authorization revoked: ${id}`);
    if (current.state === "expired" || nowMs >= parseTimestamp(current.expiresAt, "expiresAt")) {
      if (current.state !== "expired") this.#records.set(id, Object.freeze({ ...current, state: "expired" as const }));
      throw new Error(`Protected authorization expired: ${id}`);
    }
    if (current.ownerId !== use.ownerId) throw new Error("Protected authorization owner mismatch");
    if (current.sessionId !== use.sessionId) throw new Error("Protected authorization session mismatch");
    if (current.action !== use.action) throw new Error("Protected authorization action mismatch");
    if (current.authorizationIntentBinding !== use.authorizationIntentBinding) throw new Error("Protected authorization intent mismatch");
    return current;
  }

  consume(id: string, use: ProtectedAuthorizationUse, consumedAt: string): ProtectedAuthorizationRecord {
    const current = this.assertUsable(id, use, consumedAt);
    const consumedMs = parseTimestamp(consumedAt, "consumedAt");
    if (consumedMs < latestAuthorizationEventMs(current)) throw new Error("Protected authorization time cannot move backward");
    const updated = Object.freeze({ ...current, state: "consumed" as const, consumedAt });
    this.#records.set(id, updated);
    return updated;
  }

  revoke(id: string, revokedAt: string, reason: string): ProtectedAuthorizationRecord {
    const current = this.#required(id);
    if (!reason.trim()) throw new Error("Protected authorization revocation reason is required");
    if (current.state === "consumed") throw new Error(`Cannot revoke consumed protected authorization: ${id}`);
    if (current.state === "revoked") return current;
    const revokedMs = parseTimestamp(revokedAt, "revokedAt");
    if (revokedMs < latestAuthorizationEventMs(current)) throw new Error("Protected authorization time cannot move backward");
    const updated = Object.freeze({ ...current, state: "revoked" as const, revokedAt, revocationReason: reason });
    this.#records.set(id, updated);
    return updated;
  }

  #required(id: string): ProtectedAuthorizationRecord {
    const record = this.#records.get(id);
    if (!record) throw new Error(`Unknown protected authorization: ${id}`);
    return record;
  }
}
