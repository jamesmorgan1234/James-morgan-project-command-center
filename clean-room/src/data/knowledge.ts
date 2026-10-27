import { parseTimestamp } from "../security/types.js";
import { parseTruthValue, type TruthValue } from "./canonical.js";

export type KnowledgeKind = "owner_stated" | "verified" | "calculated" | "inferred" | "generated" | "historical";
export type KnowledgeState = "current" | "conflicting" | "superseded";

export interface KnowledgeClaim<T> {
  readonly id: string;
  readonly subjectId: string;
  readonly version: number;
  readonly kind: KnowledgeKind;
  readonly state: KnowledgeState;
  readonly value: TruthValue<T>;
  readonly confidence: number;
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
  readonly recordedAt: string;
  readonly staleAfter?: string;
  readonly supersedes?: string;
}

export class KnowledgeLedger<T> {
  readonly #claims: KnowledgeClaim<T>[] = [];

  append(claim: KnowledgeClaim<T>): void {
    if (!claim.id.trim() || !claim.subjectId.trim()) throw new Error("Knowledge claim identity fields are required");
    if (!Number.isSafeInteger(claim.version) || claim.version < 1) throw new Error("Knowledge claim version must be positive");
    if (claim.confidence < 0 || claim.confidence > 1 || !Number.isFinite(claim.confidence)) throw new Error("Knowledge confidence must be between 0 and 1");
    if (claim.sourceRefs.length === 0 || claim.sourceRefs.some((ref) => !ref.trim()) || new Set(claim.sourceRefs).size !== claim.sourceRefs.length) throw new Error("Knowledge claim requires unique nonblank provenance sourceRefs");
    if (!["owner_stated", "verified", "calculated", "inferred", "generated", "historical"].includes(claim.kind)) throw new Error("Unsupported knowledge kind");
    if (!["current", "conflicting", "superseded"].includes(claim.state)) throw new Error("Unsupported knowledge state");
    const value = parseTruthValue(claim.value, (item) => item as T);
    if (claim.kind === "inferred" && claim.confidence === 1) throw new Error("Inferred knowledge cannot claim certainty");
    parseTimestamp(claim.observedAt, "observedAt");
    parseTimestamp(claim.recordedAt, "recordedAt");
    if (claim.staleAfter) parseTimestamp(claim.staleAfter, "staleAfter");
    if (this.#claims.some((existing) => existing.id === claim.id)) throw new Error(`Knowledge claim already exists: ${claim.id}`);

    const currentIndex = this.#claims.findIndex((existing) => existing.subjectId === claim.subjectId && existing.state === "current");
    if (claim.state === "current" && currentIndex >= 0) {
      const current = this.#claims[currentIndex];
      if (!current || claim.supersedes !== current.id) throw new Error(`Current knowledge for ${claim.subjectId} requires explicit supersession`);
      if (claim.version <= current.version) throw new Error("Superseding knowledge version must advance");
      this.#claims[currentIndex] = Object.freeze({ ...current, state: "superseded" as const });
    }

    this.#claims.push(Object.freeze({ ...claim, value, sourceRefs: Object.freeze([...claim.sourceRefs]) }));
  }

  current(subjectId: string): KnowledgeClaim<T> | undefined { return this.#claims.find((claim) => claim.subjectId === subjectId && claim.state === "current"); }
  history(subjectId: string): readonly KnowledgeClaim<T>[] { return Object.freeze(this.#claims.filter((claim) => claim.subjectId === subjectId)); }
  conflicts(subjectId: string): readonly KnowledgeClaim<T>[] { return Object.freeze(this.#claims.filter((claim) => claim.subjectId === subjectId && claim.state === "conflicting")); }
}

export function isVerifiedKnowledge<T>(claim: KnowledgeClaim<T>): boolean {
  return claim.kind === "verified" && claim.state === "current";
}
