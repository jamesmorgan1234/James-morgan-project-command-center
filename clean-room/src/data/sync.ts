import { parseTimestamp } from "../security/types.js";

export type SyncCompleteness = "unknown" | "partial" | "complete";
export type SyncTrust = "unrated" | "low" | "medium" | "high" | "authoritative";
export type SyncReachability = "unknown" | "reachable" | "degraded" | "unreachable";

export interface SyncReliability {
  readonly successRate?: number;
  readonly sampleSize?: number;
  readonly lastFailureAt?: string;
}

export interface SyncEnvelope<T> {
  readonly entityId: string;
  readonly version: number;
  readonly updatedAt: string;
  readonly contentHash: string;
  readonly sourceNode: string;
  readonly payload: Readonly<T>;
  readonly freshUntil?: string;
  readonly completeness?: SyncCompleteness;
  readonly trust?: SyncTrust;
  readonly reachability?: SyncReachability;
  readonly reliability?: SyncReliability;
  readonly obligationRefs?: readonly string[];
  readonly revalidationTriggers?: readonly string[];
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
  const updatedAt = parseTimestamp(value.updatedAt, "updatedAt");
  if (value.freshUntil !== undefined && parseTimestamp(value.freshUntil, "freshUntil") < updatedAt) throw new Error("Sync freshness cannot expire before updatedAt");
  if (value.completeness !== undefined && !["unknown", "partial", "complete"].includes(value.completeness)) throw new Error("Unsupported sync completeness state");
  if (value.trust !== undefined && !["unrated", "low", "medium", "high", "authoritative"].includes(value.trust)) throw new Error("Unsupported sync trust state");
  if (value.reachability !== undefined && !["unknown", "reachable", "degraded", "unreachable"].includes(value.reachability)) throw new Error("Unsupported sync reachability state");
  if (value.reliability !== undefined) {
    if (value.reliability.successRate !== undefined && (!Number.isFinite(value.reliability.successRate) || value.reliability.successRate < 0 || value.reliability.successRate > 1)) throw new Error("Sync reliability successRate must be between 0 and 1");
    if (value.reliability.sampleSize !== undefined && (!Number.isSafeInteger(value.reliability.sampleSize) || value.reliability.sampleSize < 0)) throw new Error("Sync reliability sampleSize must be non-negative");
    if (value.reliability.lastFailureAt !== undefined) parseTimestamp(value.reliability.lastFailureAt, "sync.reliability.lastFailureAt");
  }
  if (value.obligationRefs !== undefined && (value.obligationRefs.some((ref) => !ref.trim()) || new Set(value.obligationRefs).size !== value.obligationRefs.length)) throw new Error("Sync obligationRefs must be unique and nonblank");
  if (value.revalidationTriggers !== undefined && (value.revalidationTriggers.some((ref) => !ref.trim()) || new Set(value.revalidationTriggers).size !== value.revalidationTriggers.length)) throw new Error("Sync revalidationTriggers must be unique and nonblank");
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
  if (parseTimestamp(incoming.updatedAt, "updatedAt") < parseTimestamp(local.updatedAt, "updatedAt")) return Object.freeze({ action: "conflict", reason: "temporal_regression" });
  return Object.freeze({ action: "accept", reason: "next_version", chosen: incoming });
}

export interface ReconciliationConflict<T> {
  readonly id: string;
  readonly local: SyncEnvelope<T>;
  readonly incoming: SyncEnvelope<T>;
  readonly createdAt: string;
  readonly resolved: boolean;
  readonly obligationRefs?: readonly string[];
  readonly revalidationTriggers?: readonly string[];
}

export class ReconciliationQueue<T> {
  readonly #items = new Map<string, ReconciliationConflict<T>>();

  add(conflict: ReconciliationConflict<T>): void {
    parseTimestamp(conflict.createdAt, "createdAt");
    if (conflict.local.entityId !== conflict.incoming.entityId) throw new Error("Conflict envelopes must target the same entity");
    if (conflict.obligationRefs !== undefined && (conflict.obligationRefs.some((ref) => !ref.trim()) || new Set(conflict.obligationRefs).size !== conflict.obligationRefs.length)) throw new Error("Reconciliation obligationRefs must be unique and nonblank");
    if (conflict.revalidationTriggers !== undefined && (conflict.revalidationTriggers.some((ref) => !ref.trim()) || new Set(conflict.revalidationTriggers).size !== conflict.revalidationTriggers.length)) throw new Error("Reconciliation revalidationTriggers must be unique and nonblank");
    if (this.#items.has(conflict.id)) throw new Error(`Reconciliation conflict already exists: ${conflict.id}`);
    this.#items.set(conflict.id, Object.freeze({ ...conflict, obligationRefs: conflict.obligationRefs === undefined ? undefined : Object.freeze([...conflict.obligationRefs]), revalidationTriggers: conflict.revalidationTriggers === undefined ? undefined : Object.freeze([...conflict.revalidationTriggers]) }));
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
