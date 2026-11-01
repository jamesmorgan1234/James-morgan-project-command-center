/**
 * Project relationships: dependencies and typed links to domains, rules,
 * decisions, agent runs, recommendations and integrations, plus opaque
 * bank references that never expose secrets.
 */
const KINDS = ["domain", "rule", "decision", "agent_run", "recommendation", "integration"];
export function linkProject(kind, projectId, targetId) {
    if (!KINDS.includes(kind))
        throw new Error(`Unknown relationship kind: ${kind}`);
    if (!projectId.trim() || !targetId.trim())
        throw new Error("A relationship requires both identifiers");
    return Object.freeze({ kind: kind, projectId, targetId });
}
export function assertUniqueRelationships(links) {
    const seen = new Set();
    for (const link of links) {
        const key = `${link.kind}:${link.projectId}:${link.targetId}`;
        if (seen.has(key))
            throw new Error(`Duplicate relationship: ${key}`);
        seen.add(key);
    }
}
export function projectDependencies(graph, projectId) {
    const resolved = new Set();
    const visiting = new Set();
    const walk = (id) => {
        if (visiting.has(id))
            throw new Error(`Project dependency cycle at ${id}`);
        if (resolved.has(id))
            return;
        visiting.add(id);
        for (const dependency of graph[id] ?? [])
            walk(dependency);
        visiting.delete(id);
        if (id !== projectId)
            resolved.add(id);
    };
    walk(projectId);
    return Object.freeze([...resolved].sort());
}
export function bankReference(reference) {
    if (!/^br_[a-z0-9]{6,}$/.test(reference))
        throw new Error("Bank references must be opaque tokens");
    return Object.freeze({ reference, last4: reference.slice(-4) });
}
//# sourceMappingURL=relationships.js.map