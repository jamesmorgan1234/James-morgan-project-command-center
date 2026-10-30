import { parseTimestamp } from "../security/types.js";
import { parseTruthValue, type TruthValue } from "./canonical.js";

export type KnowledgeKind = "owner_stated" | "verified" | "calculated" | "inferred" | "generated" | "historical";
export type KnowledgeState = "current" | "conflicting" | "superseded";
export type KnowledgeDisagreementState = "none" | "disputed" | "contradicted" | "unresolved";
export type KnowledgeSourceTrust = "unrated" | "low" | "medium" | "high" | "authoritative";
export type KnowledgeEvidenceRelation = "supports" | "refutes";
export type KnowledgeVisibilityState = "observed" | "blind_spot" | "silence";
export type KnowledgeApplicabilityScope = "global" | "domain" | "company" | "project" | "task" | "condition";

export interface KnowledgeEvidenceEdge {
  readonly sourceRef: string;
  readonly relation: KnowledgeEvidenceRelation;
  readonly confidence?: number;
}

export interface KnowledgeApplicability {
  readonly scope: KnowledgeApplicabilityScope;
  readonly ref?: string;
  readonly validFrom?: string;
  readonly validUntil?: string;
}

export interface KnowledgeRevalidation {
  readonly required: boolean;
  readonly reason?: string;
  readonly revalidateAfter?: string;
  readonly triggerRefs?: readonly string[];
}

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
  readonly disagreement?: KnowledgeDisagreementState;
  readonly sourceTrust?: KnowledgeSourceTrust;
  readonly evidenceEdges?: readonly KnowledgeEvidenceEdge[];
  readonly applicability?: KnowledgeApplicability;
  readonly visibility?: KnowledgeVisibilityState;
  readonly revalidation?: KnowledgeRevalidation;
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

    if (claim.disagreement !== undefined && !["none", "disputed", "contradicted", "unresolved"].includes(claim.disagreement)) throw new Error("Unsupported knowledge disagreement state");
    if (claim.sourceTrust !== undefined && !["unrated", "low", "medium", "high", "authoritative"].includes(claim.sourceTrust)) throw new Error("Unsupported knowledge source trust state");
    if (claim.visibility !== undefined && !["observed", "blind_spot", "silence"].includes(claim.visibility)) throw new Error("Unsupported knowledge visibility state");
    if (claim.evidenceEdges !== undefined) {
      const edgeKeys = new Set<string>();
      for (const edge of claim.evidenceEdges) {
        if (!edge.sourceRef.trim() || !["supports", "refutes"].includes(edge.relation)) throw new Error("Knowledge evidence edges require a sourceRef and support/refute relation");
        if (edge.confidence !== undefined && (!Number.isFinite(edge.confidence) || edge.confidence < 0 || edge.confidence > 1)) throw new Error("Knowledge evidence edge confidence must be between 0 and 1");
        const key = `${edge.relation}:${edge.sourceRef}`;
        if (edgeKeys.has(key)) throw new Error("Knowledge evidence edges must be unique");
        edgeKeys.add(key);
      }
    }
    if (claim.applicability !== undefined) {
      if (!["global", "domain", "company", "project", "task", "condition"].includes(claim.applicability.scope)) throw new Error("Unsupported knowledge applicability scope");
      if (claim.applicability.scope === "global" && claim.applicability.ref !== undefined) throw new Error("Global knowledge applicability cannot carry a scope reference");
      if (claim.applicability.scope !== "global" && !claim.applicability.ref?.trim()) throw new Error("Scoped knowledge applicability requires a reference");
      const validFrom = claim.applicability.validFrom === undefined ? undefined : parseTimestamp(claim.applicability.validFrom, "applicability.validFrom");
      const validUntil = claim.applicability.validUntil === undefined ? undefined : parseTimestamp(claim.applicability.validUntil, "applicability.validUntil");
      if (validFrom !== undefined && validUntil !== undefined && validUntil < validFrom) throw new Error("Knowledge applicability cannot end before it begins");
    }
    if (claim.revalidation !== undefined) {
      if (typeof claim.revalidation.required !== "boolean") throw new Error("Knowledge revalidation required must be boolean");
      if (claim.revalidation.required && claim.revalidation.reason !== undefined && !claim.revalidation.reason.trim()) throw new Error("Knowledge revalidation reason cannot be blank");
      if (claim.revalidation.revalidateAfter !== undefined) parseTimestamp(claim.revalidation.revalidateAfter, "revalidation.revalidateAfter");
      if (claim.revalidation.triggerRefs !== undefined && (claim.revalidation.triggerRefs.some((ref) => !ref.trim()) || new Set(claim.revalidation.triggerRefs).size !== claim.revalidation.triggerRefs.length)) throw new Error("Knowledge revalidation triggerRefs must be unique and nonblank");
    }

    if (this.#claims.some((existing) => existing.id === claim.id)) throw new Error(`Knowledge claim already exists: ${claim.id}`);

    const currentIndex = this.#claims.findIndex((existing) => existing.subjectId === claim.subjectId && existing.state === "current");
    if (claim.state === "current" && currentIndex >= 0) {
      const current = this.#claims[currentIndex];
      if (!current || claim.supersedes !== current.id) throw new Error(`Current knowledge for ${claim.subjectId} requires explicit supersession`);
      if (claim.version <= current.version) throw new Error("Superseding knowledge version must advance");
      this.#claims[currentIndex] = Object.freeze({ ...current, state: "superseded" as const });
    }

    this.#claims.push(Object.freeze({
      ...claim,
      value,
      sourceRefs: Object.freeze([...claim.sourceRefs]),
      evidenceEdges: claim.evidenceEdges === undefined ? undefined : Object.freeze(claim.evidenceEdges.map((edge) => Object.freeze({ ...edge }))),
      applicability: claim.applicability === undefined ? undefined : Object.freeze({ ...claim.applicability }),
      revalidation: claim.revalidation === undefined ? undefined : Object.freeze({ ...claim.revalidation, triggerRefs: claim.revalidation.triggerRefs === undefined ? undefined : Object.freeze([...claim.revalidation.triggerRefs]) })
    }));
  }

  current(subjectId: string): KnowledgeClaim<T> | undefined { return this.#claims.find((claim) => claim.subjectId === subjectId && claim.state === "current"); }
  history(subjectId: string): readonly KnowledgeClaim<T>[] { return Object.freeze(this.#claims.filter((claim) => claim.subjectId === subjectId)); }
  conflicts(subjectId: string): readonly KnowledgeClaim<T>[] { return Object.freeze(this.#claims.filter((claim) => claim.subjectId === subjectId && claim.state === "conflicting")); }
}

export function isVerifiedKnowledge<T>(claim: KnowledgeClaim<T>): boolean {
  return claim.kind === "verified" && claim.state === "current";
}
