export type SocialInboxKind = "comment" | "mention" | "direct_message" | "reply" | "other";
export type SocialTriageCategory = "question" | "support" | "lead" | "spam" | "harassment" | "unknown";
export type SocialPriority = "low" | "normal" | "high";
export interface ExternalMessage {
    readonly id: string;
    readonly accountId: string;
    readonly externalAuthorRef: string;
    readonly body: string;
    readonly receivedAt: string;
    readonly sourceRef: string;
}
export interface InboxTriage {
    readonly messageId: string;
    readonly category: SocialTriageCategory;
    readonly priority: SocialPriority;
    readonly instructionAuthority: "none";
    readonly requiresOwnerReview: boolean;
}
export interface ReplyDraft {
    readonly messageId: string;
    readonly accountId: string;
    readonly body: string;
    readonly sendAuthorized: false;
}
export declare function triageExternalMessage(message: ExternalMessage): InboxTriage;
export declare function draftReply(message: ExternalMessage, body: string): ReplyDraft;
export interface EvidenceBackedExternalMessage {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly threadId: string;
    readonly platform: string;
    readonly kind?: SocialInboxKind;
    readonly externalAuthorRef: string;
    readonly body: string;
    readonly contentHash: string;
    readonly receivedAt: string;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
}
export interface EvidenceBackedInboxTriage {
    readonly messageId: string;
    readonly ownerId: string;
    readonly accountId: string;
    readonly category: SocialTriageCategory;
    readonly priority: SocialPriority;
    readonly trust: "untrusted_external";
    readonly instructionAuthority: "none";
    readonly suspiciousInstructionLikeContent: boolean;
    readonly requiresOwnerReview: boolean;
    readonly sendAuthorized: false;
}
export interface EvidenceBackedReplyDraft {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly messageId: string;
    readonly threadId: string;
    readonly version: number;
    readonly body: string;
    readonly contentHash: string;
    readonly provenanceRefs: readonly string[];
    readonly createdAt: string;
    readonly sendAuthorized: false;
}
export interface CommunicationSendAuthorization {
    readonly authorizationRef: string;
    readonly ownerId: string;
    readonly accountId: string;
    readonly replyDraftId: string;
    readonly replyDraftVersion: number;
    readonly replyContentHash: string;
    readonly observedAt: string;
    readonly expiresAt: string;
}
export interface CommunicationSendIntent {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly threadId: string;
    readonly replyDraftId: string;
    readonly replyDraftVersion: number;
    readonly replyContentHash: string;
    readonly authorizationRef: string;
    readonly idempotencyKey: string;
    readonly sendAuthorized: false;
    readonly externalTextInstructionAuthority: "none";
}
export interface SocialModerationPolicy {
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly version: number;
    readonly autoHideSpam: boolean;
    readonly autoHideHarassment: boolean;
    readonly autoDeleteAllowed: boolean;
    readonly escalationCategories: readonly SocialTriageCategory[];
    readonly evidenceRefs: readonly string[];
}
export interface SocialConversationThread {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly participantRefs: readonly string[];
    readonly messageIds: readonly string[];
    readonly openedAt: string;
    readonly lastObservedAt: string;
    readonly crmContactRef?: string;
    readonly evidenceRefs: readonly string[];
}
export declare class InboxMessageRegistry {
    #private;
    register(message: EvidenceBackedExternalMessage): EvidenceBackedExternalMessage;
    thread(id: string, ownerId: string, accountId: string): SocialConversationThread;
    listAccount(ownerId: string, accountId: string): readonly EvidenceBackedExternalMessage[];
    private upsertThreadFromMessage;
}
export declare function assessInboundMessage(message: EvidenceBackedExternalMessage): EvidenceBackedInboxTriage;
export declare function evaluateModeration(triage: EvidenceBackedInboxTriage, policy: SocialModerationPolicy): Readonly<{
    action: "none" | "hide" | "escalate";
    automatic: boolean;
}>;
export declare function createEvidenceBackedReplyDraft(message: EvidenceBackedExternalMessage, input: Omit<EvidenceBackedReplyDraft, "ownerId" | "brandId" | "accountId" | "messageId" | "threadId" | "sendAuthorized">): EvidenceBackedReplyDraft;
export declare function prepareCommunicationSendIntent(id: string, idempotencyKey: string, draft: EvidenceBackedReplyDraft, authorization: CommunicationSendAuthorization, now: string): CommunicationSendIntent;
export declare function inboundCommunicationContext(message: EvidenceBackedExternalMessage): Readonly<{
    messageId: string;
    accountId: string;
    threadId: string;
    untrustedContent: string;
    trust: "untrusted_external";
    instructionAuthority: "none";
    toolExecutionAllowed: false;
}>;
export declare function summarizeSocialFeedback(messages: readonly EvidenceBackedExternalMessage[], ownerId: string, accountId: string): Readonly<{
    ownerId: string;
    accountId: string;
    messageCount: number;
    counts: Readonly<Record<SocialTriageCategory, number>>;
    sendAuthorized: false;
}>;
export declare function socialReplyContentHash(draft: EvidenceBackedReplyDraft): Promise<string>;
