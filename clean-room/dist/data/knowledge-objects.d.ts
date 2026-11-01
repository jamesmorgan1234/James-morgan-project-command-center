/**
 * Canonical knowledge object model.
 *
 * The ledger in knowledge.ts carries claims and epistemics.ts carries assessment
 * states. This module names the object types the roadmap requires and enforces the
 * per-type metadata rules: temporal validity, confidence, freshness, sensitivity,
 * shareability, owner editability, external verification and origin.
 */
export type KnowledgeObjectType = "fact" | "rule" | "decision" | "preference" | "goal" | "idea" | "hypothesis" | "research_finding" | "question" | "unknown_gap" | "contradiction" | "owner_correction";
export type KnowledgeOrigin = "owner" | "brain" | "external";
export type KnowledgeObjectSensitivity = "public" | "internal" | "sensitive" | "protected";
export type KnowledgeObjectShareability = "private" | "owner_shared" | "internal";
export type KnowledgeFreshnessState = "fresh" | "stale" | "unknown";
export interface KnowledgeObject<T = unknown> {
    readonly id: string;
    readonly type: KnowledgeObjectType;
    readonly subjectRef: string;
    readonly origin: KnowledgeOrigin;
    readonly value: T | null;
    readonly confidence: number | null;
    readonly sensitivity: KnowledgeObjectSensitivity;
    readonly shareability: KnowledgeObjectShareability;
    readonly editableByOwner: boolean;
    readonly externallyVerified: boolean;
    readonly observedAt: string;
    readonly validFrom?: string;
    readonly validUntil?: string;
    readonly staleAfter?: string;
    readonly supersedes?: string;
    readonly contradictionRefs?: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly sourceRefs: readonly string[];
}
export declare const KNOWLEDGE_OBJECT_TYPES: readonly KnowledgeObjectType[];
export declare function createKnowledgeObject<T>(input: KnowledgeObject<T>): Readonly<KnowledgeObject<T>>;
export declare function knowledgeFreshnessState(object: KnowledgeObject<unknown>, now: string): KnowledgeFreshnessState;
export declare function isBrainGenerated(object: KnowledgeObject<unknown>): boolean;
export declare function isOwnerOriginated(object: KnowledgeObject<unknown>): boolean;
