/**
 * Project relationships: dependencies and typed links to domains, rules,
 * decisions, agent runs, recommendations and integrations, plus opaque
 * bank references that never expose secrets.
 */
export type RelationshipKind = "domain" | "rule" | "decision" | "agent_run" | "recommendation" | "integration";
export interface ProjectLink {
    readonly kind: RelationshipKind;
    readonly projectId: string;
    readonly targetId: string;
}
export declare function linkProject(kind: string, projectId: string, targetId: string): ProjectLink;
export declare function assertUniqueRelationships(links: readonly ProjectLink[]): void;
export declare function projectDependencies(graph: Readonly<Record<string, readonly string[]>>, projectId: string): readonly string[];
export declare function bankReference(reference: string): {
    readonly reference: string;
    readonly last4: string;
};
