import type { BrainIntent } from "./core.js";
export interface ConversationTurn {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly role: "owner" | "brain" | "system";
    readonly text: string;
    readonly intent?: BrainIntent;
    readonly createdAt: string;
    readonly evidenceRefs: readonly string[];
}
export interface IntentClassification {
    readonly intent: BrainIntent;
    readonly protectedActionPossible: boolean;
}
export declare function classifyConversationIntent(text: string): IntentClassification;
