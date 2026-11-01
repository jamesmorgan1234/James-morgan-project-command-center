import type { StagedConversation } from "./historical-export.js";
export interface ConversationGraphValidation {
    readonly valid: boolean;
    readonly errors: readonly string[];
    readonly branchPoints: readonly string[];
}
export declare function validateConversationGraph(conversation: StagedConversation): ConversationGraphValidation;
export interface HistoricalProjectContainer {
    readonly templateId: string;
    readonly conversationIds: readonly string[];
}
export interface HistoricalLineageIndex {
    readonly containers: readonly HistoricalProjectContainer[];
    readonly standaloneConversationIds: readonly string[];
}
export declare function buildHistoricalLineageIndex(conversations: readonly StagedConversation[]): HistoricalLineageIndex;
