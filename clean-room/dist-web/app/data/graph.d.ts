export type GraphNodeType = "project" | "business" | "person" | "account" | "book" | "provider" | "asset" | "rule" | "decision" | "task" | "metric" | "obligation" | "alias" | "release";
export type GraphRelation = "owns" | "belongs_to" | "uses" | "depends_on" | "aliases" | "renamed_to" | "merged_into" | "supersedes" | "derived_from" | "references" | "produced_by" | "causes" | "supports" | "refutes" | "contradicts" | "impacts";
export type GraphDependencyImpact = "none" | "low" | "medium" | "high" | "blocking";
export interface GraphNode {
    readonly id: string;
    readonly type: GraphNodeType;
    readonly ownerId: string;
    readonly canonicalName: string;
}
export interface GraphEdge {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly relation: GraphRelation;
    readonly version: number;
    readonly sourceRef: string;
    readonly effectiveAt: string;
    readonly supersededAt?: string;
    readonly graphVersion?: number;
    readonly confidence?: number;
    readonly contradictionRef?: string;
    readonly lineageRefs?: readonly string[];
    readonly dependencyImpact?: GraphDependencyImpact;
}
export declare class CommandGraph {
    #private;
    addNode(node: GraphNode): void;
    addEdge(edge: GraphEdge): void;
    supersedeEdge(id: string, at: string): GraphEdge;
    neighbors(id: string, relation?: GraphRelation): readonly GraphEdge[];
    resolveAlias(aliasNodeId: string): GraphNode;
    getNode(id: string): GraphNode | undefined;
}
