export const CORE_AUTHORITY_SOURCE_TYPES = [
  "OWNER_INSTRUCTION",
  "VERIFIED_LIVE_PROVIDER_STATE",
  "VERIFIED_REPOSITORY_STATE",
  "VERIFIED_DATABASE_STATE"
] as const;

export type AuthoritySourceType = typeof CORE_AUTHORITY_SOURCE_TYPES[number];

export interface AuthoritySourceTypeDefinition {
  readonly type: AuthoritySourceType;
  readonly description: string;
  readonly authorityClass: "OWNER_INTENT" | "VERIFIED_LIVE_STATE";
}

export interface AuthoritySourceRecord {
  readonly id: string;
  readonly type: AuthoritySourceType;
  readonly version: number;
  readonly active: boolean;
  readonly locator: string;
  readonly observedAt?: string;
}

export interface AuthorityFact<T = unknown> {
  readonly id: string;
  readonly sourceId: string;
  readonly value: T;
}

export interface GovernedTruthState<T = unknown> {
  readonly desired?: T;
  readonly actual?: T;
  readonly planned?: T;
  readonly implemented?: T;
  readonly verified?: T;
  readonly ownerAccepted?: T;
}

export type GovernedTruthDimension = keyof GovernedTruthState;

export interface RequirementLineageRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly originalOwnerStatement: string;
  readonly normalizedWording: string;
  readonly parentRequirementIds: readonly string[];
  readonly state: "active" | "removed" | "superseded";
  readonly supersededBy?: string;
}

function required(value: string, label: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function validVersion(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

function validTime(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  const normalized = required(value, label);
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return normalized;
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function cloneState<T>(state: GovernedTruthState<T>): Readonly<GovernedTruthState<T>> {
  return Object.freeze({ ...state });
}

export class AuthoritySourceRegistry {
  readonly #types = new Map<AuthoritySourceType, Readonly<AuthoritySourceTypeDefinition>>();
  readonly #sources = new Map<string, Readonly<AuthoritySourceRecord>>();
  readonly #sourceHistory = new Map<string, Readonly<AuthoritySourceRecord>[]>();
  readonly #facts = new Map<string, Readonly<AuthorityFact>>();

  constructor() {
    this.registerType({ type: "OWNER_INSTRUCTION", description: "Explicit owner instruction or owner intent.", authorityClass: "OWNER_INTENT" });
    this.registerType({ type: "VERIFIED_LIVE_PROVIDER_STATE", description: "Provider state verified from the live provider.", authorityClass: "VERIFIED_LIVE_STATE" });
    this.registerType({ type: "VERIFIED_REPOSITORY_STATE", description: "Repository state verified from the repository.", authorityClass: "VERIFIED_LIVE_STATE" });
    this.registerType({ type: "VERIFIED_DATABASE_STATE", description: "Database state verified from the database.", authorityClass: "VERIFIED_LIVE_STATE" });
  }

  registerType(definition: AuthoritySourceTypeDefinition): void {
    if (!CORE_AUTHORITY_SOURCE_TYPES.includes(definition.type)) throw new Error(`Unrecognized authority source type: ${definition.type}`);
    if (this.#types.has(definition.type)) throw new Error(`Authority source type already registered: ${definition.type}`);
    const description = required(definition.description, "Authority source type description");
    this.#types.set(definition.type, Object.freeze({ ...definition, description }));
  }

  registeredTypes(): readonly Readonly<AuthoritySourceTypeDefinition>[] {
    return freezeArray([...this.#types.values()]);
  }

  registerSource(record: AuthoritySourceRecord): Readonly<AuthoritySourceRecord> {
    const id = required(record.id, "Authority source id");
    if (!this.#types.has(record.type)) throw new Error(`Authority source type is not registered: ${record.type}`);
    if (this.#sources.has(id)) throw new Error(`Authority source already exists: ${id}`);
    const source = Object.freeze({
      ...record,
      id,
      version: validVersion(record.version, "Authority source version"),
      locator: required(record.locator, "Authority source locator"),
      observedAt: validTime(record.observedAt, "Authority source observedAt")
    });
    this.#sources.set(id, source);
    this.#sourceHistory.set(id, [source]);
    return source;
  }

  reviseSource(id: string, next: Omit<AuthoritySourceRecord, "id" | "type">): Readonly<AuthoritySourceRecord> {
    const current = this.requireSource(id);
    if (next.version <= current.version) throw new Error(`Authority source revision must advance version for ${id}`);
    const revised = Object.freeze({
      id: current.id,
      type: current.type,
      version: validVersion(next.version, "Authority source version"),
      active: next.active,
      locator: required(next.locator, "Authority source locator"),
      observedAt: validTime(next.observedAt, "Authority source observedAt")
    });
    this.#sources.set(id, revised);
    this.#sourceHistory.get(id)?.push(revised);
    return revised;
  }

  requireSource(id: string): Readonly<AuthoritySourceRecord> {
    const source = this.#sources.get(required(id, "Authority source id"));
    if (!source) throw new Error(`Unknown authority source: ${id}`);
    return source;
  }

  sourceHistory(id: string): readonly Readonly<AuthoritySourceRecord>[] {
    this.requireSource(id);
    return freezeArray(this.#sourceHistory.get(id) ?? []);
  }

  recordFact<T>(fact: AuthorityFact<T>): Readonly<AuthorityFact<T>> {
    const id = required(fact.id, "Authority fact id");
    if (this.#facts.has(id)) throw new Error(`Authority fact already exists: ${id}`);
    const source = this.requireSource(fact.sourceId);
    if (!source.active) throw new Error(`Authority source is inactive: ${source.id}`);
    const stored = Object.freeze({ id, sourceId: source.id, value: fact.value });
    this.#facts.set(id, stored);
    return stored;
  }

  fact<T = unknown>(id: string): Readonly<AuthorityFact<T>> | undefined {
    return this.#facts.get(id) as Readonly<AuthorityFact<T>> | undefined;
  }
}

export class GovernedTruthStore<T = unknown> {
  readonly #records = new Map<string, Readonly<GovernedTruthState<T>>>();

  create(id: string, initial: GovernedTruthState<T> = {}): Readonly<GovernedTruthState<T>> {
    const key = required(id, "Governed state id");
    if (this.#records.has(key)) throw new Error(`Governed state already exists: ${key}`);
    const stored = cloneState(initial);
    this.#records.set(key, stored);
    return stored;
  }

  update(id: string, dimension: GovernedTruthDimension, value: T): Readonly<GovernedTruthState<T>> {
    const key = required(id, "Governed state id");
    const current = this.#records.get(key);
    if (!current) throw new Error(`Unknown governed state: ${key}`);
    if (!["desired", "actual", "planned", "implemented", "verified", "ownerAccepted"].includes(dimension)) {
      throw new Error(`Unknown governed truth dimension: ${String(dimension)}`);
    }
    const next = cloneState({ ...current, [dimension]: value });
    this.#records.set(key, next);
    return next;
  }

  get(id: string): Readonly<GovernedTruthState<T>> | undefined {
    return this.#records.get(id);
  }
}

export class RequirementLineageRegistry {
  readonly #sources: AuthoritySourceRegistry;
  readonly #requirements = new Map<string, Readonly<RequirementLineageRecord>>();
  readonly #history = new Map<string, Readonly<RequirementLineageRecord>[]>();

  constructor(sources: AuthoritySourceRegistry) {
    this.#sources = sources;
  }

  registerOwnerRequirement(input: { id: string; sourceId: string; statement: string; normalizedWording?: string }): Readonly<RequirementLineageRecord> {
    const id = required(input.id, "Requirement id");
    if (this.#requirements.has(id)) throw new Error(`Requirement already exists: ${id}`);
    const source = this.#sources.requireSource(input.sourceId);
    if (source.type !== "OWNER_INSTRUCTION") throw new Error(`Owner requirement source must be OWNER_INSTRUCTION: ${source.id}`);
    const originalOwnerStatement = required(input.statement, "Original owner statement");
    const record = Object.freeze({
      id,
      sourceId: source.id,
      originalOwnerStatement,
      normalizedWording: required(input.normalizedWording ?? originalOwnerStatement, "Normalized requirement wording"),
      parentRequirementIds: freezeArray<string>([]),
      state: "active" as const
    });
    this.#requirements.set(id, record);
    this.#history.set(id, [record]);
    return record;
  }

  deriveRequirement(input: { id: string; sourceId: string; statement: string; parentRequirementIds: readonly string[]; normalizedWording?: string }): Readonly<RequirementLineageRecord> {
    const id = required(input.id, "Requirement id");
    if (this.#requirements.has(id)) throw new Error(`Requirement already exists: ${id}`);
    const source = this.#sources.requireSource(input.sourceId);
    const originalOwnerStatement = required(input.statement, "Source statement");
    const parentRequirementIds = freezeArray(input.parentRequirementIds.map((parent) => required(parent, "Parent requirement id")));
    if (parentRequirementIds.length === 0) throw new Error("Derived requirement must identify at least one parent requirement");
    if (new Set(parentRequirementIds).size !== parentRequirementIds.length) throw new Error("Parent requirement ids must be unique");
    for (const parentId of parentRequirementIds) {
      if (!this.#requirements.has(parentId)) throw new Error(`Unknown parent requirement: ${parentId}`);
    }
    const record = Object.freeze({
      id,
      sourceId: source.id,
      originalOwnerStatement,
      normalizedWording: required(input.normalizedWording ?? originalOwnerStatement, "Normalized requirement wording"),
      parentRequirementIds,
      state: "active" as const
    });
    this.#requirements.set(id, record);
    this.#history.set(id, [record]);
    return record;
  }

  normalize(id: string, normalizedWording: string, originalOwnerStatement: string): Readonly<RequirementLineageRecord> {
    const current = this.require(id);
    if (current.originalOwnerStatement !== originalOwnerStatement) throw new Error(`Normalization intent basis mismatch for ${id}`);
    const next = Object.freeze({ ...current, normalizedWording: required(normalizedWording, "Normalized requirement wording") });
    this.#requirements.set(id, next);
    this.#history.get(id)?.push(next);
    return next;
  }

  remove(id: string): Readonly<RequirementLineageRecord> {
    const current = this.require(id);
    const next = Object.freeze({ ...current, state: "removed" as const });
    this.#requirements.set(id, next);
    this.#history.get(id)?.push(next);
    return next;
  }

  supersede(id: string, replacementId: string): Readonly<RequirementLineageRecord> {
    const current = this.require(id);
    const replacement = this.require(replacementId);
    if (replacement.id === current.id) throw new Error("Requirement cannot supersede itself");
    const next = Object.freeze({ ...current, state: "superseded" as const, supersededBy: replacement.id });
    this.#requirements.set(id, next);
    this.#history.get(id)?.push(next);
    return next;
  }

  require(id: string): Readonly<RequirementLineageRecord> {
    const record = this.#requirements.get(required(id, "Requirement id"));
    if (!record) throw new Error(`Unknown requirement: ${id}`);
    return record;
  }

  active(): readonly Readonly<RequirementLineageRecord>[] {
    return freezeArray([...this.#requirements.values()].filter((record) => record.state === "active"));
  }

  history(id: string): readonly Readonly<RequirementLineageRecord>[] {
    this.require(id);
    return freezeArray(this.#history.get(id) ?? []);
  }
}
