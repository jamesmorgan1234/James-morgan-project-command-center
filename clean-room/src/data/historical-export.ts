function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

export type HistoricalContentDecision = "keep" | "redact";

export interface StagedMessageNode {
  readonly id: string;
  readonly parent?: string;
  readonly children: readonly string[];
  readonly role?: string;
  readonly messageId?: string;
  readonly contentState: "none" | HistoricalContentDecision;
  readonly text?: string;
}

export interface StagedConversation {
  readonly conversationId: string;
  readonly title: string;
  readonly templateId?: string;
  readonly nodes: readonly StagedMessageNode[];
}

export interface HistoricalImportStage {
  readonly batchId: string;
  readonly conversations: readonly StagedConversation[];
  readonly conversationCount: number;
  readonly nodeCount: number;
  readonly redactedNodeCount: number;
}

export type HistoricalContentPolicy = (text: string, conversationId: string, nodeId: string) => HistoricalContentDecision;

function extractText(message: Record<string, unknown> | undefined): { role?: string; messageId?: string; text?: string } {
  if (!message) return {};
  const author = asRecord(message.author);
  const role = typeof author?.role === "string" ? author.role : undefined;
  const messageId = typeof message.id === "string" ? message.id : undefined;
  const content = asRecord(message.content);
  const parts = Array.isArray(content?.parts) ? content.parts.filter((part): part is string => typeof part === "string") : [];
  const text = parts.length > 0 ? parts.join("\n") : undefined;
  return { ...(role ? { role } : {}), ...(messageId ? { messageId } : {}), ...(text ? { text } : {}) };
}

export function stageChatExport(raw: unknown, batchId: string, contentPolicy: HistoricalContentPolicy = () => "keep"): HistoricalImportStage {
  if (!batchId.trim()) throw new Error("Historical import batch id is required");
  if (!Array.isArray(raw)) throw new Error("Chat export root must be an array of conversations");
  const conversations: StagedConversation[] = [];
  let nodeCount = 0;
  let redactedNodeCount = 0;

  for (const item of raw) {
    const conversation = asRecord(item);
    if (!conversation) throw new Error("Conversation entry must be an object");
    const conversationId = typeof conversation.id === "string" ? conversation.id : undefined;
    if (!conversationId) throw new Error("Conversation id is required");
    const title = typeof conversation.title === "string" ? conversation.title : "Untitled";
    const templateId = typeof conversation.conversation_template_id === "string" ? conversation.conversation_template_id : undefined;
    const mapping = asRecord(conversation.mapping);
    if (!mapping) throw new Error(`Conversation mapping is required: ${conversationId}`);
    const nodes: StagedMessageNode[] = [];
    for (const [mappingKey, nodeRaw] of Object.entries(mapping)) {
      const node = asRecord(nodeRaw);
      if (!node) throw new Error(`Invalid mapping node ${mappingKey}`);
      const id = typeof node.id === "string" ? node.id : mappingKey;
      const parent = typeof node.parent === "string" ? node.parent : undefined;
      const children = Array.isArray(node.children) ? node.children.filter((child): child is string => typeof child === "string") : [];
      const message = extractText(asRecord(node.message));
      if (!message.text) {
        nodes.push(Object.freeze({ id, ...(parent ? { parent } : {}), children: Object.freeze(children), ...(message.role ? { role: message.role } : {}), ...(message.messageId ? { messageId: message.messageId } : {}), contentState: "none" as const }));
      } else {
        const decision = contentPolicy(message.text, conversationId, id);
        if (decision === "redact") redactedNodeCount += 1;
        nodes.push(Object.freeze({ id, ...(parent ? { parent } : {}), children: Object.freeze(children), ...(message.role ? { role: message.role } : {}), ...(message.messageId ? { messageId: message.messageId } : {}), contentState: decision, ...(decision === "keep" ? { text: message.text } : {}) }));
      }
      nodeCount += 1;
    }
    conversations.push(Object.freeze({ conversationId, title, ...(templateId ? { templateId } : {}), nodes: Object.freeze(nodes) }));
  }

  return Object.freeze({ batchId, conversations: Object.freeze(conversations), conversationCount: conversations.length, nodeCount, redactedNodeCount });
}
