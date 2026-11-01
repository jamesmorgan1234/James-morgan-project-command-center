/**
 * Project relationships: dependencies and typed links to domains, rules,
 * decisions, agent runs, recommendations and integrations, plus opaque
 * bank references that never expose secrets.
 */

export type RelationshipKind = "domain" | "rule" | "decision" | "agent_run" | "recommendation" | "integration";

const KINDS: readonly RelationshipKind[] = ["domain", "rule", "decision", "agent_run", "recommendation", "integration"];

export interface ProjectLink {
  readonly kind: RelationshipKind;
  readonly projectId: string;
  readonly targetId: string;
}

export function linkProject(kind: string, projectId: string, targetId: string): ProjectLink {
  if (!KINDS.includes(kind as RelationshipKind)) throw new Error(`Unknown relationship kind: ${kind}`);
  if (!projectId.trim() || !targetId.trim()) throw new Error("A relationship requires both identifiers");
  return Object.freeze({ kind: kind as RelationshipKind, projectId, targetId });
}

export function assertUniqueRelationships(links: readonly ProjectLink[]): void {
  const seen = new Set<string>();
  for (const link of links) {
    const key = `${link.kind}:${link.projectId}:${link.targetId}`;
    if (seen.has(key)) throw new Error(`Duplicate relationship: ${key}`);
    seen.add(key);
  }
}

export function projectDependencies(graph: Readonly<Record<string, readonly string[]>>, projectId: string): readonly string[] {
  const resolved = new Set<string>();
  const visiting = new Set<string>();
  const walk = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Project dependency cycle at ${id}`);
    if (resolved.has(id)) return;
    visiting.add(id);
    for (const dependency of graph[id] ?? []) walk(dependency);
    visiting.delete(id);
    if (id !== projectId) resolved.add(id);
  };
  walk(projectId);
  return Object.freeze([...resolved].sort());
}

export function bankReference(reference: string): { readonly reference: string; readonly last4: string } {
  if (!/^br_[a-z0-9]{6,}$/.test(reference)) throw new Error("Bank references must be opaque tokens");
  return Object.freeze({ reference, last4: reference.slice(-4) });
}
