import type { KnowledgeClaim, KnowledgeKind } from "./knowledge.js";
export declare const SHARED_INTELLIGENCE_CONTRACT_VERSION: 1;
export declare const SHARED_INTELLIGENCE_ONTOLOGY_ID: "mod_shared-intelligence";
export declare const SHARED_INTELLIGENCE_ONTOLOGY_VERSION: 1;
export type IntelligenceTemporalLabel = "current" | "historical" | "stale" | "superseded";
export type IntelligenceCausalLabel = "not_claimed" | "observed_association" | "causal_hypothesis" | "causal_supported";
export type IntelligenceApplicabilityScope = "global" | "domain" | "brain" | "company" | "project" | "task" | "condition";
export type IntelligencePrivacyClass = "ecosystem_shared" | "domain_shared" | "company_private" | "project_private" | "owner_private" | "quarantined";
export interface IntelligenceOntologyRef {
    readonly id: string;
    readonly version: number;
}
export interface IntelligenceApplicability {
    readonly scope: IntelligenceApplicabilityScope;
    readonly ref?: string;
}
export interface IntelligencePrivacyBoundary {
    readonly ownerId: string;
    readonly classification: IntelligencePrivacyClass;
    readonly scopeRef?: string;
}
export interface SharedIntelligenceEnvelope<T> {
    readonly contractVersion: typeof SHARED_INTELLIGENCE_CONTRACT_VERSION;
    readonly ontology: IntelligenceOntologyRef;
    readonly claim: KnowledgeClaim<T>;
    readonly epistemicLabel: KnowledgeKind;
    readonly temporalLabel: IntelligenceTemporalLabel;
    readonly causalLabel: IntelligenceCausalLabel;
    readonly applicability: IntelligenceApplicability;
    readonly privacy: IntelligencePrivacyBoundary;
    readonly evidenceIds: readonly string[];
}
export interface SharedIntelligenceValidationContext {
    readonly ownerId: string;
    readonly authorizedScopeKeys: readonly string[];
    readonly ontologyId?: string;
    readonly minimumOntologyVersion?: number;
    readonly maximumOntologyVersion?: number;
    readonly now?: string;
}
export declare function intelligenceScopeKey(applicability: IntelligenceApplicability): string;
export declare function validateSharedIntelligenceEnvelope<T>(envelope: SharedIntelligenceEnvelope<T>, context: SharedIntelligenceValidationContext): SharedIntelligenceEnvelope<T>;
