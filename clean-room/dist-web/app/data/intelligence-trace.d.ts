export type IntelligenceTraceNodeKind = "intent" | "context" | "policy" | "router" | "specialist" | "method" | "tool" | "evidence" | "verifier" | "state" | "decision" | "outcome" | "learning" | "evaluator" | "ontology" | "module" | "configuration" | "procedure" | "permission" | "budget";
export type IntelligenceTraceRelation = "context_for" | "governs" | "routes_to" | "selects" | "invokes" | "produces_evidence" | "verified_by" | "transitions_to" | "records_decision" | "records_outcome" | "produces_learning" | "depends_on" | "evaluated_by" | "uses_ontology" | "uses_version";
export type TracePrivacyClass = "ecosystem_shared" | "domain_shared" | "company_private" | "project_private" | "owner_private";
export interface IntelligenceTraceNode {
    readonly id: string;
    readonly kind: IntelligenceTraceNodeKind;
    readonly version: number;
    readonly ownerId: string;
    readonly privacy: TracePrivacyClass;
    readonly scopeRef?: string;
    /** Privacy-safe canonical/reference pointer only. Never raw secrets or payload content. */
    readonly reference: string;
    readonly recordedAt: string;
    readonly evidenceRefs: readonly string[];
}
export interface IntelligenceTraceEdge {
    readonly id: string;
    readonly relation: IntelligenceTraceRelation;
    readonly fromId: string;
    readonly fromVersion: number;
    readonly toId: string;
    readonly toVersion: number;
    readonly version: number;
    readonly recordedAt: string;
    readonly evidenceRefs: readonly string[];
}
export interface TraceExplanation {
    readonly targetRef: string;
    readonly nodeRefs: readonly string[];
    readonly nodes: readonly IntelligenceTraceNode[];
    readonly edgeIds: readonly string[];
}
export interface TraceImpactResult {
    readonly changedRef: string;
    readonly newVersion: number;
    readonly staleDependentRefs: readonly string[];
    readonly evidenceEdgeIds: readonly string[];
}
export interface TraceCompatibilityResult {
    readonly compatible: boolean;
    readonly subjectRef: string;
    readonly incompatibleEdgeIds: readonly string[];
}
export declare function validateIntelligenceTraceNode(node: IntelligenceTraceNode): IntelligenceTraceNode;
export declare function validateIntelligenceTraceEdge(edge: IntelligenceTraceEdge): IntelligenceTraceEdge;
/**
 * PIF.9 trace fabric is an immutable, privacy-safe projection over canonical references.
 * It does not own the source entities and never stores raw secret-bearing payloads.
 */
export declare class IntelligenceTraceFabric {
    #private;
    registerNode(input: IntelligenceTraceNode): IntelligenceTraceNode;
    connect(input: IntelligenceTraceEdge): IntelligenceTraceEdge;
    getNode(id: string, version?: number): IntelligenceTraceNode | undefined;
    explain(targetId: string, targetVersion?: number): TraceExplanation;
    affectedDependents(changedId: string, newVersion: number): TraceImpactResult;
    compatibility(subjectId: string, subjectVersion: number, currentVersions: Readonly<Record<string, number>>): TraceCompatibilityResult;
    assertCompatible(subjectId: string, subjectVersion: number, currentVersions: Readonly<Record<string, number>>): void;
}
