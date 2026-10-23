import { parseTimestamp } from "../security/types.js";

export interface SyncEnvelope<T> {
  readonly entityId: string;
  readonly version: number;
  readonly updatedAt: string;
  readonly contentHash: string;
  readonly sourceNode: string;
  readonly payload: Readonly<T>;
}

export type SyncAction = "accept" | "ignore_duplicate" | "reject_stale" | "conflict" | "reconcile_gap";

export interface SyncDecision<T> {
  readonly action: SyncAction;
  readonly reason: string;
  readonly chosen?: SyncEnvelope<T>;
}

function validateEnvelope<T>(value: SyncEnvelope<T>): void {
  if (!value.entityId.trim() || !value.contentHash.trim() || !value.sourceNode.trim()) throw new Error("Sync envelope identity fields are required");
  if (!Number.isSafeInteger(value.version) || value.version < 1) throw new Error("Sync version must be a positive safe integer");
  parseTimestamp(value.updatedAt, "updatedAt");
}

export function reconcileSync<T>(local: SyncEnvelope<T> | undefined, incoming: SyncEnvelope<T>): SyncDecision<T> {
  validateEnvelope(incoming);
  if (!local) return Object.freeze({ action: "accept", reason: "new_entity", chosen: incoming });
  validateEnvelope(local);
  if (local.entityId !== incoming.entityId) throw new Error("Cannot reconcile different entity ids");
  if (incoming.version < local.version) return Object.freeze({ action: "reject_stale", reason: "incoming_version_older", chosen: local });
  if (incoming.version === local.version) {
    if (incoming.contentHash === local.contentHash) return Object.freeze({ action: "ignore_duplicate", reason: "same_version_same_hash", chosen: local });
    return Object.freeze({ action: "conflict", reason: "same_version_different_hash" });
  }
  if (incoming.version > local.version + 1) return Object.freeze({ action: "reconcile_gap", reason: "version_gap_requires_rebuild" });
  return Object.freeze({ action: "accept", reason: "next_version", chosen: incoming });
}

export interface ReconciliationConflict<T> {
  readonly id: string;
  readonly local: SyncEnvelope<T>;
  readonly incoming: SyncEnvelope<T>;
  readonly createdAt: string;
  readonly resolved: boolean;
}

export class ReconciliationQueue<T> {
  readonly #items = new Map<string, ReconciliationConflict<T>>();

  add(conflict: ReconciliationConflict<T>): void {
    parseTimestamp(conflict.createdAt, "createdAt");
    if (conflict.local.entityId !== conflict.incoming.entityId) throw new Error("Conflict envelopes must target the same entity");
    if (this.#items.has(conflict.id)) throw new Error(`Reconciliation conflict already exists: ${conflict.id}`);
    this.#items.set(conflict.id, Object.freeze({ ...conflict }));
  }

  resolve(id: string): ReconciliationConflict<T> {
    const current = this.#items.get(id);
    if (!current) throw new Error(`Unknown reconciliation conflict: ${id}`);
    const updated = Object.freeze({ ...current, resolved: true });
    this.#items.set(id, updated);
    return updated;
  }

  pending(): readonly ReconciliationConflict<T>[] { return Object.freeze([...this.#items.values()].filter((item) => !item.resolved)); }
}
