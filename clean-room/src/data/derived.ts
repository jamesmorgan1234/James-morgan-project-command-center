import { parseTimestamp } from "../security/types.js";
import { assertProvenanceRefs, type ProvenanceRef } from "./provenance.js";

export type DerivedState = "active" | "restricted" | "deleted";

export interface DerivedRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly companyId?: string;
  readonly projectId?: string;
  readonly purpose: string;
  readonly retentionClass: string;
  readonly state: DerivedState;
  readonly provenance: readonly ProvenanceRef[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly legalHold: boolean;
  readonly holdReason?: string;
  readonly holdReleasedAt?: string;
  readonly holdReleaseAuthorizationRef?: string;
  readonly holdReleaseReason?: string;
  readonly restrictionReason?: string;
}

export class DerivedLifecycleRegistry {
  readonly #records = new Map<string, DerivedRecord>();

  register(record: DerivedRecord): DerivedRecord {
    if (!record.id.startsWith("derived:") || !record.ownerId.trim() || !record.purpose.trim() || !record.retentionClass.trim()) throw new Error("Derived identity/owner/purpose/retention are required");
    const created = parseTimestamp(record.createdAt, "derived.createdAt");
    const updated = parseTimestamp(record.updatedAt, "derived.updatedAt");
    if (updated < created) throw new Error("Derived updatedAt cannot predate createdAt");
    if (record.state === "deleted" && record.legalHold) throw new Error("Held derived record cannot start deleted");
    if (record.legalHold && !record.holdReason?.trim()) throw new Error("Held derived record requires holdReason");
    if (!record.legalHold && record.holdReason !== undefined) throw new Error("holdReason requires an active legal hold");
    if (record.holdReleasedAt !== undefined || record.holdReleaseAuthorizationRef !== undefined || record.holdReleaseReason !== undefined) throw new Error("New derived records cannot start with hold-release evidence");
    if (this.#records.has(record.id)) throw new Error(`Derived record already exists: ${record.id}`);
    const frozen = Object.freeze({ ...record, provenance: assertProvenanceRefs(record.provenance) });
    this.#records.set(record.id, frozen);
    return frozen;
  }

  placeLegalHold(id: string, at: string, reason: string): DerivedRecord {
    const current = this.#required(id);
    parseTimestamp(at, "at");
    if (!reason.trim()) throw new Error("Legal hold reason is required");
    if (current.state === "deleted") throw new Error("Deleted derived record cannot be placed on hold");
    if (current.legalHold) throw new Error("Derived record is already on legal hold");
    const next = Object.freeze({ ...current, legalHold: true, holdReason: reason.trim(), updatedAt: at });
    this.#records.set(id, next);
    return next;
  }

  releaseLegalHold(id: string, at: string, authorizationRef: string, reason: string): DerivedRecord {
    const current = this.#required(id);
    parseTimestamp(at, "at");
    const normalizedAuthorizationRef = authorizationRef.trim();
    const normalizedReason = reason.trim();
    if (!normalizedAuthorizationRef) throw new Error("Legal hold release requires explicit authorizationRef");
    if (!normalizedReason) throw new Error("Legal hold release reason is required");
    if (!current.legalHold) throw new Error("Derived record is not on legal hold");

    const invalidatedWhileHeld = current.state === "restricted" && current.restrictionReason?.startsWith("legal_hold:") === true;
    const next = Object.freeze({
      ...current,
      legalHold: false,
      holdReason: undefined,
      state: invalidatedWhileHeld ? "deleted" as const : current.state,
      updatedAt: at,
      holdReleasedAt: at,
      holdReleaseAuthorizationRef: normalizedAuthorizationRef,
      holdReleaseReason: normalizedReason,
      restrictionReason: invalidatedWhileHeld ? `hold_released_after_invalidated:${normalizedReason}` : current.restrictionReason
    });
    this.#records.set(id, next);
    return next;
  }

  invalidateByObservation(observationId: string, at: string, reason: string): readonly DerivedRecord[] {
    parseTimestamp(at, "at");
    if (!reason.trim()) throw new Error("Derived invalidation reason is required");
    const changed: DerivedRecord[] = [];
    for (const [id, record] of this.#records) {
      if (!record.provenance.some((ref) => ref.observationId === observationId) || record.state === "deleted") continue;
      const next: DerivedRecord = record.legalHold
        ? Object.freeze({ ...record, state: "restricted" as const, updatedAt: at, restrictionReason: `legal_hold:${reason}` })
        : Object.freeze({ ...record, state: "deleted" as const, updatedAt: at, restrictionReason: reason });
      this.#records.set(id, next);
      changed.push(next);
    }
    return Object.freeze(changed);
  }

  restrictPurpose(id: string, at: string, reason: string): DerivedRecord {
    const current = this.#required(id);
    parseTimestamp(at, "at");
    if (!reason.trim()) throw new Error("Restriction reason is required");
    if (current.state === "deleted") throw new Error("Deleted derived record cannot be reactivated/restricted");
    const next = Object.freeze({ ...current, state: "restricted" as const, updatedAt: at, restrictionReason: reason });
    this.#records.set(id, next);
    return next;
  }

  get(id: string): DerivedRecord | undefined { return this.#records.get(id); }

  #required(id: string): DerivedRecord {
    const record = this.#records.get(id);
    if (!record) throw new Error(`Unknown derived record: ${id}`);
    return record;
  }
}
