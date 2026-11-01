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
export declare function stageChatExport(raw: unknown, batchId: string, contentPolicy?: HistoricalContentPolicy): HistoricalImportStage;
