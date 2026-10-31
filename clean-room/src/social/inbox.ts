import { assertSecretChannelSafe, redactSecretText } from "../security/secret-channels.js";

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

export function triageExternalMessage(message: ExternalMessage): InboxTriage {
  if (!message.id.trim() || !message.accountId.trim() || !message.sourceRef.trim()) throw new Error("external message identity/provenance required");
  const lower = message.body.toLowerCase();
  const spam = lower.includes("giveaway") || lower.includes("send password");
  return Object.freeze({
    messageId: message.id,
    category: spam ? "spam" : lower.includes("?") ? "question" : "unknown",
    priority: spam ? "low" : "normal",
    instructionAuthority: "none",
    requiresOwnerReview: !spam
  });
}

export function draftReply(message: ExternalMessage, body: string): ReplyDraft {
  if (!body.trim()) throw new Error("reply draft body is required");
  return Object.freeze({ messageId: message.id, accountId: message.accountId, body, sendAuthorized: false });
}

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

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export class InboxMessageRegistry {
  readonly #byId = new Map<string, EvidenceBackedExternalMessage>();
  readonly #bySource = new Map<string, string>();
  readonly #threads = new Map<string, SocialConversationThread>();

  register(message: EvidenceBackedExternalMessage): EvidenceBackedExternalMessage {
    if (!message.id.trim() || !message.ownerId.trim() || !message.brandId.trim() || !message.accountId.trim() || !message.threadId.trim() || !message.platform.trim() || !message.externalAuthorRef.trim() || !message.contentHash.trim()) throw new Error("inbound message requires explicit owner/brand/account/thread/platform/source identity");
    if (!message.body.trim()) throw new Error("inbound message body is required");
    if (message.kind !== undefined && !["comment", "mention", "direct_message", "reply", "other"].includes(message.kind)) throw new Error("unknown social inbox message kind");
    const receivedAt = timestamp(message.receivedAt, "inbound message receivedAt");
    const observedAt = timestamp(message.observedAt, "inbound message observedAt");
    if (receivedAt > observedAt) throw new Error("inbound message cannot be observed before it was received");
    const sourceRefs = refs(message.sourceRefs, "inbound message source refs");
    for (const sourceRef of sourceRefs) {
      const sourceKey = JSON.stringify([message.ownerId, message.accountId, sourceRef]);
      const existing = this.#bySource.get(sourceKey);
      if (existing && existing !== message.id) throw new Error("provider message source is already bound to another canonical inbound message");
    }
    const current = this.#byId.get(message.id);
    if (current && (current.ownerId !== message.ownerId || current.brandId !== message.brandId || current.accountId !== message.accountId || current.threadId !== message.threadId || current.contentHash !== message.contentHash || current.body !== message.body || current.platform !== message.platform || current.externalAuthorRef !== message.externalAuthorRef || current.receivedAt !== message.receivedAt)) throw new Error("canonical inbound message identity/content cannot be substituted");
    if (current && Date.parse(message.observedAt) < Date.parse(current.observedAt)) throw new Error("inbound observation time cannot regress");
    const frozen = Object.freeze({ ...message, sourceRefs: Object.freeze([...new Set([...(current?.sourceRefs ?? []), ...sourceRefs])]) });
    this.#byId.set(message.id, frozen);
    for (const sourceRef of sourceRefs) this.#bySource.set(JSON.stringify([message.ownerId, message.accountId, sourceRef]), message.id);
    this.upsertThreadFromMessage(frozen);
    return frozen;
  }

  thread(id: string, ownerId: string, accountId: string): SocialConversationThread {
    const thread = this.#threads.get(id);
    if (!thread || thread.ownerId !== ownerId || thread.accountId !== accountId) throw new Error("social thread scope mismatch");
    return thread;
  }

  listAccount(ownerId: string, accountId: string): readonly EvidenceBackedExternalMessage[] {
    return Object.freeze([...this.#byId.values()].filter((message) => message.ownerId === ownerId && message.accountId === accountId));
  }

  private upsertThreadFromMessage(message: EvidenceBackedExternalMessage): void {
    const current = this.#threads.get(message.threadId);
    if (current && (current.ownerId !== message.ownerId || current.brandId !== message.brandId || current.accountId !== message.accountId)) throw new Error("social thread cannot cross owner/brand/account boundaries");
    const next = Object.freeze({
      id: message.threadId,
      ownerId: message.ownerId,
      brandId: message.brandId,
      accountId: message.accountId,
      participantRefs: Object.freeze([...new Set([...(current?.participantRefs ?? []), message.externalAuthorRef])]),
      messageIds: Object.freeze([...new Set([...(current?.messageIds ?? []), message.id])]),
      openedAt: current?.openedAt ?? message.receivedAt,
      lastObservedAt: current && Date.parse(current.lastObservedAt) > Date.parse(message.observedAt) ? current.lastObservedAt : message.observedAt,
      ...(current?.crmContactRef ? { crmContactRef: current.crmContactRef } : {}),
      evidenceRefs: Object.freeze([...new Set([...(current?.evidenceRefs ?? []), ...message.sourceRefs])])
    });
    this.#threads.set(message.threadId, next);
  }
}

export function assessInboundMessage(message: EvidenceBackedExternalMessage): EvidenceBackedInboxTriage {
  if (!message.id.trim() || !message.ownerId.trim() || !message.accountId.trim()) throw new Error("inbound message identity is required");
  const lower = message.body.toLowerCase();
  const suspicious = ["system prompt", "reveal secret", "execute command", "credential"].some((marker) => lower.includes(marker));
  const harassment = ["threat", "harass", "abuse"].some((marker) => lower.includes(marker));
  const spam = lower.includes("giveaway") || lower.includes("guaranteed profit");
  const category: SocialTriageCategory = spam ? "spam" : harassment ? "harassment" : lower.includes("?") ? "question" : "unknown";
  return Object.freeze({
    messageId: message.id,
    ownerId: message.ownerId,
    accountId: message.accountId,
    category,
    priority: suspicious || spam ? "low" : harassment ? "high" : "normal",
    trust: "untrusted_external",
    instructionAuthority: "none",
    suspiciousInstructionLikeContent: suspicious,
    requiresOwnerReview: !spam,
    sendAuthorized: false
  });
}

export function evaluateModeration(triage: EvidenceBackedInboxTriage, policy: SocialModerationPolicy): Readonly<{ action: "none" | "hide" | "escalate"; automatic: boolean }> {
  if (triage.ownerId !== policy.ownerId || triage.accountId !== policy.accountId) throw new Error("moderation policy scope mismatch");
  if (!Number.isSafeInteger(policy.version) || policy.version < 1) throw new Error("moderation policy version must be positive");
  refs(policy.evidenceRefs, "moderation policy evidence");
  if (policy.escalationCategories.includes(triage.category)) return Object.freeze({ action: "escalate", automatic: false });
  if (triage.category === "spam" && policy.autoHideSpam) return Object.freeze({ action: "hide", automatic: true });
  if (triage.category === "harassment" && policy.autoHideHarassment) return Object.freeze({ action: "hide", automatic: true });
  return Object.freeze({ action: "none", automatic: false });
}

export function createEvidenceBackedReplyDraft(message: EvidenceBackedExternalMessage, input: Omit<EvidenceBackedReplyDraft, "ownerId" | "brandId" | "accountId" | "messageId" | "threadId" | "sendAuthorized">): EvidenceBackedReplyDraft {
  if (!input.id.trim() || !input.body.trim() || !input.contentHash.trim() || !Number.isSafeInteger(input.version) || input.version < 1) throw new Error("reply draft identity/version/body/content hash are required");
  assertSecretChannelSafe("brain_memory", input);
  timestamp(input.createdAt, "reply draft createdAt");
  if (Date.parse(input.createdAt) < Date.parse(message.receivedAt)) throw new Error("reply cannot predate inbound message");
  const provenanceRefs = refs(input.provenanceRefs, "reply draft provenance");
  return Object.freeze({ ...input, ownerId: message.ownerId, brandId: message.brandId, accountId: message.accountId, messageId: message.id, threadId: message.threadId, provenanceRefs, sendAuthorized: false });
}

export function prepareCommunicationSendIntent(id: string, idempotencyKey: string, draft: EvidenceBackedReplyDraft, authorization: CommunicationSendAuthorization, now: string): CommunicationSendIntent {
  const nowMs = timestamp(now, "communication send now");
  const observedAt = timestamp(authorization.observedAt, "communication authorization observedAt");
  const expiresAt = timestamp(authorization.expiresAt, "communication authorization expiresAt");
  if (!id.trim() || !idempotencyKey.trim() || !authorization.authorizationRef.trim()) throw new Error("communication send intent/idempotency/authorization evidence is required");
  if (observedAt > nowMs || expiresAt <= nowMs || expiresAt <= observedAt) throw new Error("communication send authorization must be current and unexpired");
  if (authorization.ownerId !== draft.ownerId || authorization.accountId !== draft.accountId || authorization.replyDraftId !== draft.id || authorization.replyDraftVersion !== draft.version || authorization.replyContentHash !== draft.contentHash) throw new Error("communication authorization must bind the exact reply revision/content/account");
  return Object.freeze({ id, ownerId: draft.ownerId, brandId: draft.brandId, accountId: draft.accountId, threadId: draft.threadId, replyDraftId: draft.id, replyDraftVersion: draft.version, replyContentHash: draft.contentHash, authorizationRef: authorization.authorizationRef, idempotencyKey, sendAuthorized: false, externalTextInstructionAuthority: "none" });
}

export function inboundCommunicationContext(message: EvidenceBackedExternalMessage) {
  return Object.freeze({
    messageId: message.id,
    accountId: message.accountId,
    threadId: message.threadId,
    untrustedContent: redactSecretText(message.body),
    trust: "untrusted_external" as const,
    instructionAuthority: "none" as const,
    toolExecutionAllowed: false as const
  });
}

export function summarizeSocialFeedback(messages: readonly EvidenceBackedExternalMessage[], ownerId: string, accountId: string) {
  const scoped = messages.filter((message) => message.ownerId === ownerId && message.accountId === accountId);
  const triage = scoped.map(assessInboundMessage);
  const counts = triage.reduce<Record<SocialTriageCategory, number>>((acc, item) => {
    acc[item.category] += 1;
    return acc;
  }, { question: 0, support: 0, lead: 0, spam: 0, harassment: 0, unknown: 0 });
  return Object.freeze({ ownerId, accountId, messageCount: scoped.length, counts: Object.freeze(counts), sendAuthorized: false as const });
}

export async function socialReplyContentHash(draft: EvidenceBackedReplyDraft): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([draft.ownerId, draft.brandId, draft.accountId, draft.messageId, draft.threadId, draft.id, draft.version, draft.body, draft.provenanceRefs]));
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return "sha256:" + [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, "0")).join("");
}
