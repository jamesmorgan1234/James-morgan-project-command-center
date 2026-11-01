export function validateConversationGraph(conversation) {
    const byId = new Map(conversation.nodes.map((node) => [node.id, node]));
    const errors = [];
    if (byId.size !== conversation.nodes.length)
        errors.push("duplicate_node_identity");
    const branchPoints = [];
    for (const node of conversation.nodes) {
        if (new Set(node.children).size !== node.children.length)
            errors.push(`duplicate_children:${node.id}`);
        if (node.parent && !byId.has(node.parent))
            errors.push(`missing_parent:${node.id}:${node.parent}`);
        if (node.parent && byId.has(node.parent) && !byId.get(node.parent).children.includes(node.id))
            errors.push(`child_parent_mismatch:${node.id}:${node.parent}`);
        const ancestors = new Set([node.id]);
        let parent = node.parent;
        while (parent && byId.has(parent)) {
            if (ancestors.has(parent)) {
                errors.push(`cycle:${node.id}`);
                break;
            }
            ancestors.add(parent);
            parent = byId.get(parent)?.parent;
        }
        if (node.children.length > 1)
            branchPoints.push(node.id);
        for (const child of node.children) {
            const childNode = byId.get(child);
            if (!childNode)
                errors.push(`missing_child:${node.id}:${child}`);
            else if (childNode.parent !== node.id)
                errors.push(`parent_child_mismatch:${node.id}:${child}`);
        }
    }
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), branchPoints: Object.freeze(branchPoints) });
}
export function buildHistoricalLineageIndex(conversations) {
    const containers = new Map();
    const standalone = [];
    for (const conversation of conversations) {
        if (conversation.templateId) {
            const list = containers.get(conversation.templateId) ?? [];
            list.push(conversation.conversationId);
            containers.set(conversation.templateId, list);
        }
        else
            standalone.push(conversation.conversationId);
    }
    return Object.freeze({
        containers: Object.freeze([...containers.entries()].map(([templateId, conversationIds]) => Object.freeze({ templateId, conversationIds: Object.freeze(conversationIds) }))),
        standaloneConversationIds: Object.freeze(standalone)
    });
}
//# sourceMappingURL=historical-lineage.js.map