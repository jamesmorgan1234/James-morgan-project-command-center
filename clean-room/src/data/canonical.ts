import { parseTimestamp } from "../security/types.js";

export type TruthValue<T> =
  | Readonly<{ state: "known"; value: T }>
  | Readonly<{ state: "unknown" }>
  | Readonly<{ state: "not_applicable" }>;

export function known<T>(value: T): TruthValue<T> { return Object.freeze({ state: "known", value }); }
export function unknown<T>(): TruthValue<T> { return Object.freeze({ state: "unknown" }); }
export function notApplicable<T>(): TruthValue<T> { return Object.freeze({ state: "not_applicable" }); }

export interface CanonicalEntity<T> {
  readonly id: string;
  readonly entityType: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
  readonly payload: Readonly<T>;
}

function assertEntity<T>(entity: CanonicalEntity<T>): void {
  if (!entity.id.trim() || !entity.entityType.trim() || !entity.ownerId.trim()) throw new Error("Canonical entity identity fields are required");
  if (!Number.isSafeInteger(entity.version) || entity.version < 1) throw new Error("Canonical entity version must be a positive safe integer");
  const created = parseTimestamp(entity.createdAt, "createdAt");
  const updated = parseTimestamp(entity.updatedAt, "updatedAt");
  if (updated < created) throw new Error("updatedAt cannot predate createdAt");
  if (entity.deletedAt && parseTimestamp(entity.deletedAt, "deletedAt") < created) throw new Error("deletedAt cannot predate createdAt");
}

export class CanonicalStore<T> {
  readonly #records = new Map<string, CanonicalEntity<T>>();

  create(entity: CanonicalEntity<T>): void {
    assertEntity(entity);
    if (entity.version !== 1) throw new Error("New canonical entity must start at version 1");
    if (this.#records.has(entity.id)) throw new Error(`Canonical entity already exists: ${entity.id}`);
    this.#records.set(entity.id, Object.freeze({ ...entity, payload: Object.freeze({ ...entity.payload }) }));
  }

  replace(entity: CanonicalEntity<T>, expectedVersion: number): void {
    assertEntity(entity);
    const current = this.#required(entity.id);
    if (current.version !== expectedVersion) throw new Error(`Canonical version conflict for ${entity.id}`);
    if (entity.version !== current.version + 1) throw new Error(`Canonical replacement must advance exactly one version for ${entity.id}`);
    if (entity.entityType !== current.entityType || entity.ownerId !== current.ownerId || entity.createdAt !== current.createdAt) throw new Error("Canonical identity fields cannot be rewritten");
    if ((entity.projectId ?? null) !== (current.projectId ?? null)) throw new Error("Canonical project ownership cannot be silently rewritten");
    this.#records.set(entity.id, Object.freeze({ ...entity, payload: Object.freeze({ ...entity.payload }) }));
  }

  tombstone(id: string, expectedVersion: number, deletedAt: string): CanonicalEntity<T> {
    const current = this.#required(id);
    if (current.version !== expectedVersion) throw new Error(`Canonical version conflict for ${id}`);
    parseTimestamp(deletedAt, "deletedAt");
    const next = Object.freeze({ ...current, version: current.version + 1, updatedAt: deletedAt, deletedAt });
    this.#records.set(id, next);
    return next;
  }

  get(id: string): CanonicalEntity<T> | undefined { return this.#records.get(id); }
  list(includeDeleted = false): readonly CanonicalEntity<T>[] { return Object.freeze([...this.#records.values()].filter((record) => includeDeleted || !record.deletedAt)); }

  #required(id: string): CanonicalEntity<T> {
    const record = this.#records.get(id);
    if (!record) throw new Error(`Unknown canonical entity: ${id}`);
    return record;
  }
}
