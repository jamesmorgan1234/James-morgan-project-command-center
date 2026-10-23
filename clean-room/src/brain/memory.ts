import { parseTimestamp } from "../security/types.js";

export type MemoryKind = "fact" | "decision" | "rule" | "preference" | "goal" | "asset" | "history" | "owner_input";
export type MemorySensitivity = "internal" | "sensitive" | "protected" | "secret";
export type MemoryState = "current" | "superseded" | "expired";

export interface BrainMemory<T> {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly kind: MemoryKind;
  readonly version: number;
  readonly state: MemoryState;
  readonly value: Readonly<T>;
  readonly confidence: number;
  readonly sensitivity: MemorySensitivity;
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly retainUntil?: string;
  readonly supersedes?: string;
}

export class BrainMemoryLedger<T> {
  readonly #items: BrainMemory<T>[] = [];

  append(memory: BrainMemory<T>): void {
    if (!memory.id.trim() || !memory.ownerId.trim() || !Number.isSafeInteger(memory.version) || memory.version < 1) throw new Error("Memory identity/version are required");
    if (memory.confidence < 0 || memory.confidence > 1 || !Number.isFinite(memory.confidence)) throw new Error("Memory confidence must be 0..1");
    if (memory.sourceRefs.length === 0) throw new Error("Memory requires provenance");
    parseTimestamp(memory.recordedAt, "recordedAt");
    if (memory.retainUntil) parseTimestamp(memory.retainUntil, "retainUntil");
    if (this.#items.some((item) => item.id === memory.id)) throw new Error(`Memory already exists: ${memory.id}`);
    if (memory.state === "current" && memory.supersedes) {
      const previousIndex = this.#items.findIndex((item) => item.id === memory.supersedes && item.state === "current");
      if (previousIndex < 0) throw new Error(`Superseded memory is not current or missing: ${memory.supersedes}`);
      const previous = this.#items[previousIndex];
      if (!previous || previous.ownerId !== memory.ownerId || previous.projectId !== memory.projectId || previous.kind !== memory.kind) throw new Error("Memory correction must stay within owner/project/kind boundary");
      this.#items[previousIndex] = Object.freeze({ ...previous, state: "superseded" as const });
    }
    this.#items.push(Object.freeze({ ...memory, sourceRefs: Object.freeze([...memory.sourceRefs]) }));
  }

  current(ownerId: string, projectId?: string): readonly BrainMemory<T>[] { return Object.freeze(this.#items.filter((item) => item.ownerId === ownerId && item.state === "current" && (projectId === undefined || item.projectId === projectId))); }
  history(id: string): readonly BrainMemory<T>[] { return Object.freeze(this.#items.filter((item) => item.id === id || item.supersedes === id)); }
}
