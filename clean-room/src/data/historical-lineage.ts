import type { StagedConversation } from "./historical-export.js";

export interface ConversationGraphValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly branchPoints: readonly string[];
}

export function validateConversationGraph(conversation: StagedConversation): ConversationGraphValidation {
  const byId = new Map(conversation.nodes.map((node) => [node.id, node]));
  const errors: string[] = [];
  const branchPoints: string[] = [];
  for (const node of conversation.nodes) {
    if (node.parent && !byId.has(node.parent)) errors.push(`missing_parent:${node.id}:${node.parent}`);
    if (node.children.length > 1) branchPoints.push(node.id);
    for (const child of node.children) {
      const childNode = byId.get(child);
      if (!childNode) errors.push(`missing_child:${node.id}:${child}`);
      else if (childNode.parent !== node.id) errors.push(`parent_child_mismatch:${node.id}:${child}`);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), branchPoints: Object.freeze(branchPoints) });
}

export interface HistoricalProjectContainer {
  readonly templateId: string;
  readonly conversationIds: readonly string[];
}

export interface HistoricalLineageIndex {
  readonly containers: readonly HistoricalProjectContainer[];
  readonly standaloneConversationIds: readonly string[];
}

export function buildHistoricalLineageIndex(conversations: readonly StagedConversation[]): HistoricalLineageIndex {
  const containers = new Map<string, string[]>();
  const standalone: string[] = [];
  for (const conversation of conversations) {
    if (conversation.templateId) {
      const list = containers.get(conversation.templateId) ?? [];
      list.push(conversation.conversationId);
      containers.set(conversation.templateId, list);
    } else standalone.push(conversation.conversationId);
  }
  return Object.freeze({
    containers: Object.freeze([...containers.entries()].map(([templateId, conversationIds]) => Object.freeze({ templateId, conversationIds: Object.freeze(conversationIds) }))),
    standaloneConversationIds: Object.freeze(standalone)
  });
}
