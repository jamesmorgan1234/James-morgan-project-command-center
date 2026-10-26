export type LedgerEntryState = "current" | "superseded" | "revoked" | "unresolved_conflict";

export interface LedgerEntry<T> {
  readonly id: string;
  readonly version: number;
  readonly scope: string;
  readonly state: LedgerEntryState;
  readonly sourceRef: string;
  readonly effectiveAt: string;
  readonly precedence?: number;
  readonly supersedes?: string;
  readonly conflictsWith?: readonly string[];
  readonly resolutionReason?: string;
  readonly value: T;
}

export type LedgerRecord<T> = Omit<LedgerEntry<T>, "precedence" | "conflictsWith"> & {
  readonly precedence: number;
  readonly conflictsWith: readonly string[];
  readonly resolvedBy?: string;
};

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required`);
}

function assertTimestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be an ISO-compatible timestamp`);
}

function normalizeEntry<T>(entry: LedgerEntry<T>): LedgerRecord<T> {
  assertNonEmpty(entry.id, "Ledger id");
  assertNonEmpty(entry.scope, "Ledger scope");
  assertNonEmpty(entry.sourceRef, "Ledger sourceRef");
  if (!Number.isSafeInteger(entry.version) || entry.version < 1) throw new Error(`Invalid ledger version for ${entry.id}`);
  assertTimestamp(entry.effectiveAt, "Ledger effectiveAt");
  const precedence = entry.precedence ?? 0;
  if (!Number.isSafeInteger(precedence) || precedence < 0) throw new Error(`Invalid ledger precedence for ${entry.id}`);
  const conflictsWith = [...(entry.conflictsWith ?? [])];
  if (new Set(conflictsWith).size !== conflictsWith.length) throw new Error(`Ledger conflict references must be unique for ${entry.id}`);
  if (conflictsWith.some((id) => !id.trim())) throw new Error(`Ledger conflict references cannot be empty for ${entry.id}`);
  if (entry.supersedes !== undefined) assertNonEmpty(entry.supersedes, "Ledger supersedes");
  if (entry.resolutionReason !== undefined) assertNonEmpty(entry.resolutionReason, "Ledger resolutionReason");
  return Object.freeze({ ...entry, precedence, conflictsWith: Object.freeze(conflictsWith) });
}

export class VersionedLedger<T> {
  readonly #entries: LedgerRecord<T>[] = [];

  append(entry: LedgerEntry<T>): LedgerRecord<T> {
    const normalized = normalizeEntry(entry);
    if (this.#entries.some((existing) => existing.id === normalized.id)) throw new Error(`Ledger entry already exists: ${normalized.id}`);

    if (normalized.state === "unresolved_conflict") {
      if (normalized.conflictsWith.length === 0) throw new Error(`Unresolved conflict ${normalized.id} must reference at least one existing entry`);
      for (const conflictId of normalized.conflictsWith) {
        const existing = this.#entries.find((candidate) => candidate.id === conflictId);
        if (!existing) throw new Error(`Unknown conflict reference ${conflictId} for ${normalized.id}`);
        if (existing.scope !== normalized.scope) throw new Error(`Conflict reference ${conflictId} is outside scope ${normalized.scope}`);
      }
      this.#entries.push(normalized);
      return normalized;
    }

    if (normalized.state === "current") {
      const current = this.current(normalized.scope);
      if (current && normalized.supersedes !== current.id) throw new Error(`New current entry ${normalized.id} must explicitly supersede ${current.id}`);
      if (current && normalized.version <= current.version) throw new Error(`New current ledger version must advance for scope ${normalized.scope}`);
      if (current && normalized.precedence < current.precedence) throw new Error(`New current ledger precedence cannot decrease for scope ${normalized.scope}`);
      if (current) {
        const index = this.#entries.findIndex((existing) => existing.id === current.id);
        this.#entries[index] = Object.freeze({ ...current, state: "superseded" as const });
      }
    }

    this.#entries.push(normalized);
    return normalized;
  }

  recordConflict(entry: Omit<LedgerEntry<T>, "state"> & { readonly conflictsWith: readonly string[] }): LedgerRecord<T> {
    return this.append({ ...entry, state: "unresolved_conflict" });
  }

  resolveConflict(conflictId: string, resolution: LedgerEntry<T> & { readonly state: "current" }): LedgerRecord<T> {
    const conflictIndex = this.#entries.findIndex((entry) => entry.id === conflictId);
    if (conflictIndex < 0) throw new Error(`Unknown conflict: ${conflictId}`);
    const conflict = this.#entries[conflictIndex];
    if (conflict.state !== "unresolved_conflict") throw new Error(`Ledger entry is not an unresolved conflict: ${conflictId}`);
    if (resolution.scope !== conflict.scope) throw new Error(`Conflict resolution scope mismatch for ${conflictId}`);
    if (!resolution.resolutionReason?.trim()) throw new Error(`Conflict resolution ${resolution.id} requires resolutionReason`);

    const appended = this.append(resolution);
    this.#entries[conflictIndex] = Object.freeze({ ...conflict, state: "superseded" as const, resolvedBy: appended.id });
    return appended;
  }

  current(scope: string): LedgerRecord<T> | undefined {
    return [...this.#entries].reverse().find((entry) => entry.scope === scope && entry.state === "current");
  }

  unresolvedConflicts(scope?: string): readonly LedgerRecord<T>[] {
    return Object.freeze(this.#entries.filter((entry) => entry.state === "unresolved_conflict" && (scope === undefined || entry.scope === scope)));
  }

  history(scope: string): readonly LedgerRecord<T>[] {
    return Object.freeze(this.#entries.filter((entry) => entry.scope === scope));
  }
}
