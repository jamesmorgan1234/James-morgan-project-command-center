/**
 * Decisions and registries.
 *
 * Architecture decision records for significant choices, preserved decision
 * rationale, and typed registries for screens, home modules, project detail
 * sections and storage providers.
 */

export interface ArchitectureDecision {
  readonly id: string;
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly consequences: readonly string[];
  readonly rationale: string;
}

export function architectureDecisionRecord(input: ArchitectureDecision): ArchitectureDecision {
  if (!/^ADR-\d+$/.test(input.id)) throw new Error("An architecture decision requires an ADR-nnn identifier");
  for (const [label, value] of Object.entries({ title: input.title, context: input.context, decision: input.decision, rationale: input.rationale })) {
    if (!value.trim()) throw new Error(`An architecture decision requires ${label}`);
  }
  if (input.consequences.length === 0) throw new Error("An architecture decision requires at least one consequence");
  return Object.freeze({ ...input, consequences: Object.freeze([...input.consequences]) });
}

export function assertDecisionHistory(records: readonly ArchitectureDecision[]): void {
  if (records.length === 0) throw new Error("At least one architecture decision record is required");
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate architecture decision: ${record.id}`);
    ids.add(record.id);
    if (!record.rationale.trim()) throw new Error(`Decision rationale was not preserved: ${record.id}`);
  }
}

export interface TypedRegistryEntry {
  readonly key: string;
  readonly description: string;
}

export function defineRegistry(kind: string, entries: readonly TypedRegistryEntry[]): readonly TypedRegistryEntry[] {
  if (entries.length === 0) throw new Error(`A ${kind} registry requires entries`);
  const keys = new Set<string>();
  for (const entry of entries) {
    if (!entry.key.trim()) throw new Error(`A ${kind} entry requires a key`);
    if (keys.has(entry.key)) throw new Error(`Duplicate ${kind} entry: ${entry.key}`);
    keys.add(entry.key);
  }
  return Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
}

export function registerInto(kind: string, registry: readonly TypedRegistryEntry[], entry: TypedRegistryEntry): readonly TypedRegistryEntry[] {
  if (registry.some((existing) => existing.key === entry.key)) throw new Error(`A ${kind} is already registered: ${entry.key}`);
  return defineRegistry(kind, [...registry, entry]);
}

export function registryLookup(kind: string, registry: readonly TypedRegistryEntry[], key: string): TypedRegistryEntry {
  const found = registry.find((entry) => entry.key === key);
  if (!found) throw new Error(`Unknown ${kind}: ${key}`);
  return found;
}
