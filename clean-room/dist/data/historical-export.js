import { assertSecretChannelSafe } from "../security/secret-channels.js";
function asRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : undefined;
}
function extractText(message) {
    if (!message)
        return {};
    const author = asRecord(message.author);
    const role = typeof author?.role === "string" ? author.role : undefined;
    const messageId = typeof message.id === "string" ? message.id : undefined;
    const content = asRecord(message.content);
    const parts = Array.isArray(content?.parts) ? content.parts.filter((part) => typeof part === "string") : [];
    const text = parts.length > 0 ? parts.join("\n") : undefined;
    return { ...(role ? { role } : {}), ...(messageId ? { messageId } : {}), ...(text ? { text } : {}) };
}
export function stageChatExport(raw, batchId, contentPolicy = () => "keep") {
    if (!batchId.trim())
        throw new Error("Historical import batch id is required");
    if (!Array.isArray(raw))
        throw new Error("Chat export root must be an array of conversations");
    const conversations = [];
    let nodeCount = 0;
    let redactedNodeCount = 0;
    const seenConversations = new Set();
    for (const item of raw) {
        const conversation = asRecord(item);
        if (!conversation)
            throw new Error("Conversation entry must be an object");
        const conversationId = typeof conversation.id === "string" ? conversation.id : undefined;
        if (!conversationId)
            throw new Error("Conversation id is required");
        if (seenConversations.has(conversationId))
            throw new Error("Duplicate historical conversation id");
        seenConversations.add(conversationId);
        const title = typeof conversation.title === "string" ? conversation.title : "Untitled";
        const templateId = typeof conversation.conversation_template_id === "string" ? conversation.conversation_template_id : undefined;
        const mapping = asRecord(conversation.mapping);
        if (!mapping)
            throw new Error(`Conversation mapping is required: ${conversationId}`);
        const nodes = [];
        for (const [mappingKey, nodeRaw] of Object.entries(mapping)) {
            const node = asRecord(nodeRaw);
            if (!node)
                throw new Error(`Invalid mapping node ${mappingKey}`);
            const id = typeof node.id === "string" ? node.id : mappingKey;
            const parent = typeof node.parent === "string" ? node.parent : undefined;
            const children = Array.isArray(node.children) ? node.children.filter((child) => typeof child === "string") : [];
            const message = extractText(asRecord(node.message));
            if (!message.text) {
                nodes.push(Object.freeze({ id, ...(parent ? { parent } : {}), children: Object.freeze(children), ...(message.role ? { role: message.role } : {}), ...(message.messageId ? { messageId: message.messageId } : {}), contentState: "none" }));
            }
            else {
                let decision = contentPolicy(message.text, conversationId, id);
                if (decision !== "keep" && decision !== "redact")
                    throw new Error("Unsupported historical content decision");
                try {
                    assertSecretChannelSafe("brain_memory", message.text);
                }
                catch {
                    decision = "redact";
                }
                if (decision === "redact")
                    redactedNodeCount += 1;
                nodes.push(Object.freeze({ id, ...(parent ? { parent } : {}), children: Object.freeze(children), ...(message.role ? { role: message.role } : {}), ...(message.messageId ? { messageId: message.messageId } : {}), contentState: decision, ...(decision === "keep" ? { text: message.text } : {}) }));
            }
            nodeCount += 1;
        }
        conversations.push(Object.freeze({ conversationId, title, ...(templateId ? { templateId } : {}), nodes: Object.freeze(nodes) }));
    }
    return Object.freeze({ batchId, conversations: Object.freeze(conversations), conversationCount: conversations.length, nodeCount, redactedNodeCount });
}
//# sourceMappingURL=historical-export.js.map