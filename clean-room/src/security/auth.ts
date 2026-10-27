import type { EnvironmentName } from "../kernel/config.js";
import { assuranceAtLeast, parseTimestamp, type AssuranceLevel, type SessionState } from "./types.js";

export interface AuthSessionRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly deviceId?: string;
  readonly projectId?: string;
  readonly companyId?: string;
  readonly accountId?: string;
  readonly environment?: EnvironmentName;
  readonly scopes: readonly string[];
  readonly assurance: AssuranceLevel;
  readonly state: SessionState;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly lastValidatedAt: string;
  readonly lastVerifiedAt?: string;
  readonly policyEpoch?: number;
  readonly lockedAt?: string;
  readonly revokedAt?: string;
  readonly revocationReason?: string;
}

function assertOptionalId(value: string | undefined, label: string): void {
  if (value !== undefined && !value.trim()) throw new Error(`${label} cannot be empty`);
}

function latestSessionEventMs(session: AuthSessionRecord): number {
  return Math.max(
    parseTimestamp(session.createdAt, "createdAt"),
    parseTimestamp(session.lastValidatedAt, "lastValidatedAt"),
    session.lastVerifiedAt ? parseTimestamp(session.lastVerifiedAt, "lastVerifiedAt") : Number.NEGATIVE_INFINITY,
    session.lockedAt ? parseTimestamp(session.lockedAt, "lockedAt") : Number.NEGATIVE_INFINITY,
    session.revokedAt ? parseTimestamp(session.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY
  );
}

function assertForwardLifecycleTimestamp(session: AuthSessionRecord, value: string, label: string): number {
  const timestamp = parseTimestamp(value, label);
  if (timestamp < latestSessionEventMs(session)) throw new Error(`${label} cannot move session time backward`);
  return timestamp;
}

function assertSessionShape(session: AuthSessionRecord): void {
  if (!session.id.trim() || !session.ownerId.trim()) throw new Error("Session id and ownerId are required");
  assertOptionalId(session.deviceId, "deviceId");
  assertOptionalId(session.projectId, "projectId");
  assertOptionalId(session.companyId, "companyId");
  assertOptionalId(session.accountId, "accountId");
  const created = parseTimestamp(session.createdAt, "createdAt");
  const expires = parseTimestamp(session.expiresAt, "expiresAt");
  const lastValidated = parseTimestamp(session.lastValidatedAt, "lastValidatedAt");
  const lastVerified = session.lastVerifiedAt ? parseTimestamp(session.lastVerifiedAt, "lastVerifiedAt") : undefined;
  if (expires <= created) throw new Error("Session expiresAt must be after createdAt");
  if (lastValidated < created) throw new Error("Session lastValidatedAt cannot be before createdAt");
  if (lastValidated >= expires) throw new Error("Session lastValidatedAt must be before expiresAt");
  if (lastVerified !== undefined && (lastVerified < created || lastVerified > lastValidated)) throw new Error("Session lastVerifiedAt must be between createdAt and lastValidatedAt");
  if (new Set(session.scopes).size !== session.scopes.length) throw new Error("Session scopes must be unique");
  if (session.policyEpoch !== undefined && (!Number.isSafeInteger(session.policyEpoch) || session.policyEpoch < 1)) throw new Error("policyEpoch must be a positive safe integer");
}

export class AuthSessionStore {
  readonly #sessions = new Map<string, AuthSessionRecord>();

  register(session: AuthSessionRecord): void {
    assertSessionShape(session);
    if (session.state !== "active") throw new Error("New sessions must start active");
    if (this.#sessions.has(session.id)) throw new Error(`Session already exists: ${session.id}`);
    this.#sessions.set(session.id, Object.freeze({ ...session, scopes: Object.freeze([...session.scopes]) }));
  }

  get(id: string): AuthSessionRecord | undefined { return this.#sessions.get(id); }
  listByOwner(ownerId: string): readonly AuthSessionRecord[] { return Object.freeze([...this.#sessions.values()].filter((s) => s.ownerId === ownerId)); }

  validateLive(id: string, now: string): AuthSessionRecord {
    const current = this.#required(id);
    const nowMs = parseTimestamp(now, "now");
    if (nowMs < parseTimestamp(current.createdAt, "createdAt")) throw new Error(`Session not yet valid: ${id}`);
    if (nowMs < parseTimestamp(current.lastValidatedAt, "lastValidatedAt")) throw new Error(`Session validation time cannot move backward: ${id}`);
    if (current.state === "revoked") throw new Error(`Session revoked: ${id}`);
    if (current.state === "locked") throw new Error(`Session locked: ${id}`);
    if (current.state === "expired" || nowMs >= parseTimestamp(current.expiresAt, "expiresAt")) {
      const expired = Object.freeze({ ...current, state: "expired" as const, lastValidatedAt: now });
      this.#sessions.set(id, expired);
      throw new Error(`Session expired: ${id}`);
    }
    const updated = Object.freeze({ ...current, lastValidatedAt: now });
    this.#sessions.set(id, updated);
    return updated;
  }

  recordVerification(id: string, assurance: AssuranceLevel, verifiedAt: string): AuthSessionRecord {
    const current = this.#required(id);
    if (current.state !== "active") throw new Error(`Cannot verify non-active session: ${id}`);
    assertForwardLifecycleTimestamp(current, verifiedAt, "verifiedAt");
    if (!assuranceAtLeast(assurance, current.assurance)) throw new Error("Verification cannot lower session assurance");
    const updated = Object.freeze({ ...current, assurance, lastVerifiedAt: verifiedAt, lastValidatedAt: verifiedAt });
    this.#sessions.set(id, updated);
    return updated;
  }

  setPolicyEpoch(id: string, policyEpoch: number, at: string): AuthSessionRecord {
    if (!Number.isSafeInteger(policyEpoch) || policyEpoch < 1) throw new Error("policyEpoch must be a positive safe integer");
    const current = this.#required(id);
    if (current.state !== "active") throw new Error(`Cannot update policy epoch on non-active session: ${id}`);
    assertForwardLifecycleTimestamp(current, at, "at");
    const updated = Object.freeze({ ...current, policyEpoch, lastValidatedAt: at });
    this.#sessions.set(id, updated);
    return updated;
  }

  lock(id: string, lockedAt: string): AuthSessionRecord {
    const current = this.#required(id);
    if (current.state === "revoked" || current.state === "expired") throw new Error(`Cannot lock terminal session: ${id}`);
    assertForwardLifecycleTimestamp(current, lockedAt, "lockedAt");
    const updated = Object.freeze({ ...current, state: "locked" as const, lockedAt });
    this.#sessions.set(id, updated);
    return updated;
  }

  unlock(id: string, assurance: AssuranceLevel, verifiedAt: string): AuthSessionRecord {
    const current = this.#required(id);
    if (current.state !== "locked") throw new Error(`Session is not locked: ${id}`);
    if (!assuranceAtLeast(assurance, "passkey_uv")) throw new Error("Unlock requires passkey user verification or stronger");
    assertForwardLifecycleTimestamp(current, verifiedAt, "verifiedAt");
    const { lockedAt: _lockedAt, ...rest } = current;
    const updated = Object.freeze({ ...rest, state: "active" as const, assurance, lastVerifiedAt: verifiedAt, lastValidatedAt: verifiedAt });
    this.#sessions.set(id, updated);
    return updated;
  }

  revoke(id: string, revokedAt: string, reason: string): AuthSessionRecord {
    const current = this.#required(id);
    if (!reason.trim()) throw new Error("Revocation reason is required");
    assertForwardLifecycleTimestamp(current, revokedAt, "revokedAt");
    const updated = Object.freeze({ ...current, state: "revoked" as const, revokedAt, revocationReason: reason });
    this.#sessions.set(id, updated);
    return updated;
  }

  #required(id: string): AuthSessionRecord {
    const session = this.#sessions.get(id);
    if (!session) throw new Error(`Unknown session: ${id}`);
    return session;
  }
}
