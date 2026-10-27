import { parseTimestamp } from "../security/types.js";

export type TruthValue<T> =
  | Readonly<{ state: "known"; value: T }>
  | Readonly<{ state: "unknown" }>
  | Readonly<{ state: "not_applicable" }>;

export function known<T>(value: T): TruthValue<T> { return Object.freeze({ state: "known", value }); }
export function unknown<T>(): TruthValue<T> { return Object.freeze({ state: "unknown" }); }
export function notApplicable<T>(): TruthValue<T> { return Object.freeze({ state: "not_applicable" }); }

/** Decode the existing truth union without guessing a value from absence or null. */
export function parseTruthValue<T>(input: unknown, parseValue: (value: unknown) => T): TruthValue<T> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Explicit truth state is required");
  const record = input as Record<string, unknown>;
  if (record.state === "known") {
    if (Object.keys(record).some((key) => key !== "state" && key !== "value") || !Object.hasOwn(record, "value") || record.value == null) throw new Error("Known truth requires an unambiguous concrete value");
    return known(parseValue(record.value));
  }
  if (record.state !== "unknown" && record.state !== "not_applicable") throw new Error("Unsupported truth state");
  if (Object.keys(record).length !== 1) throw new Error("Non-value truth state cannot carry a value or extra fields");
  return record.state === "unknown" ? unknown<T>() : notApplicable<T>();
}

export interface CanonicalEntity<T> {
  readonly id: string;
  readonly entityType: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly version: number;
  /** Absent means the original v1 wire contract; record version is independent. */
  readonly schemaVersion?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
  readonly payload: Readonly<T>;
}

export function immutableJson(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || !value || ancestors.has(value)) throw new Error("Canonical payload requires finite acyclic JSON values");
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error("Canonical payload requires plain JSON objects");
  ancestors.add(value);
  const result = Array.isArray(value)
    ? Array.from(value, (item) => immutableJson(item, ancestors))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, immutableJson(item, ancestors)]));
  ancestors.delete(value);
  return Object.freeze(result);
}

function assertEntity<T>(entity: CanonicalEntity<T>): void {
  if (entity.schemaVersion !== undefined && entity.schemaVersion !== 1) throw new Error("Unsupported canonical schema version");
  if (entity.projectId !== undefined && (typeof entity.projectId !== "string" || !entity.projectId.trim())) throw new Error("Canonical project scope must be nonblank when supplied");
  if (!entity.payload || typeof entity.payload !== "object" || Array.isArray(entity.payload)) throw new Error("Canonical payload must be an object");
  if (!entity.id.trim() || !entity.entityType.trim() || !entity.ownerId.trim()) throw new Error("Canonical entity identity fields are required");
  if (!Number.isSafeInteger(entity.version) || entity.version < 1) throw new Error("Canonical entity version must be a positive safe integer");
  const created = parseTimestamp(entity.createdAt, "createdAt");
  const updated = parseTimestamp(entity.updatedAt, "updatedAt");
  if (updated < created) throw new Error("updatedAt cannot predate createdAt");
  if (entity.deletedAt !== undefined && parseTimestamp(entity.deletedAt, "deletedAt") < updated) throw new Error("deletedAt cannot predate updatedAt");
}

export class CanonicalStore<T> {
  readonly #records = new Map<string, CanonicalEntity<T>>();

  create(entity: CanonicalEntity<T>): void {
    assertEntity(entity);
    if (entity.version !== 1) throw new Error("New canonical entity must start at version 1");
    if (this.#records.has(entity.id)) throw new Error(`Canonical entity already exists: ${entity.id}`);
    this.#records.set(entity.id, Object.freeze({ ...entity, payload: immutableJson(entity.payload) as Readonly<T> }));
  }

  replace(entity: CanonicalEntity<T>, expectedVersion: number): void {
    assertEntity(entity);
    const current = this.#required(entity.id);
    if (current.deletedAt !== undefined) throw new Error("Tombstoned canonical entity cannot be silently revived");
    if (entity.deletedAt !== undefined) throw new Error("Use tombstone for canonical deletion");
    if (parseTimestamp(entity.updatedAt, "updatedAt") < parseTimestamp(current.updatedAt, "updatedAt")) throw new Error("Canonical update time cannot move backwards");
    if (current.version !== expectedVersion) throw new Error(`Canonical version conflict for ${entity.id}`);
    if (entity.version !== current.version + 1) throw new Error(`Canonical replacement must advance exactly one version for ${entity.id}`);
    if (entity.entityType !== current.entityType || entity.ownerId !== current.ownerId || entity.createdAt !== current.createdAt) throw new Error("Canonical identity fields cannot be rewritten");
    if ((entity.projectId ?? null) !== (current.projectId ?? null)) throw new Error("Canonical project ownership cannot be silently rewritten");
    this.#records.set(entity.id, Object.freeze({ ...entity, payload: immutableJson(entity.payload) as Readonly<T> }));
  }

  tombstone(id: string, expectedVersion: number, deletedAt: string): CanonicalEntity<T> {
    const current = this.#required(id);
    if (current.deletedAt !== undefined) throw new Error("Canonical entity is already tombstoned");
    if (current.version !== expectedVersion) throw new Error(`Canonical version conflict for ${id}`);
    if (parseTimestamp(deletedAt, "deletedAt") < parseTimestamp(current.updatedAt, "updatedAt")) throw new Error("Canonical deletion time cannot predate latest update");
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
