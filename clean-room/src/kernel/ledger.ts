export interface LedgerEntry<T> {
  readonly id: string;
  readonly version: number;
  readonly scope: string;
  readonly state: "current" | "superseded" | "revoked";
  readonly sourceRef: string;
  readonly effectiveAt: string;
  readonly supersedes?: string;
  readonly value: T;
}

export class VersionedLedger<T> {
  readonly #entries: LedgerEntry<T>[] = [];

  append(entry: LedgerEntry<T>): void {
    if (this.#entries.some((existing) => existing.id === entry.id)) throw new Error(`Ledger entry already exists: ${entry.id}`);
    if (entry.version < 1) throw new Error(`Invalid ledger version for ${entry.id}`);
    if (entry.state === "current") {
      const current = this.current(entry.scope);
      if (current && entry.supersedes !== current.id) throw new Error(`New current entry ${entry.id} must explicitly supersede ${current.id}`);
      if (current && entry.version <= current.version) throw new Error(`New current ledger version must advance for scope ${entry.scope}`);
      if (current) {
        const index = this.#entries.findIndex((existing) => existing.id === current.id);
        this.#entries[index] = Object.freeze({ ...current, state: "superseded" });
      }
    }
    this.#entries.push(Object.freeze({ ...entry }));
  }

  current(scope: string): LedgerEntry<T> | undefined {
    return [...this.#entries].reverse().find((entry) => entry.scope === scope && entry.state === "current");
  }

  history(scope: string): readonly LedgerEntry<T>[] {
    return Object.freeze(this.#entries.filter((entry) => entry.scope === scope));
  }
}
