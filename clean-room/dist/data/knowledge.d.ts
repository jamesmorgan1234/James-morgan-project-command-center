import { type TruthValue } from "./canonical.js";
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
export declare class KnowledgeLedger<T> {
    #private;
    append(claim: KnowledgeClaim<T>): void;
    current(subjectId: string): KnowledgeClaim<T> | undefined;
    history(subjectId: string): readonly KnowledgeClaim<T>[];
    conflicts(subjectId: string): readonly KnowledgeClaim<T>[];
}
export declare function isVerifiedKnowledge<T>(claim: KnowledgeClaim<T>): boolean;
