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
  readonly category: "question" | "support" | "lead" | "spam" | "unknown";
  readonly priority: "low" | "normal" | "high";
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
  const spam = lower.includes("crypto giveaway") || lower.includes("send password") || lower.includes("ignore previous instructions");
  return Object.freeze({ messageId: message.id, category: spam ? "spam" : lower.includes("?") ? "question" : "unknown", priority: spam ? "low" : "normal", instructionAuthority: "none", requiresOwnerReview: !spam });
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
  readonly category: "question" | "support" | "lead" | "spam" | "unknown";
  readonly priority: "low" | "normal" | "high";
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
  readonly sendAuthorized: true;
  readonly externalTextInstructionAuthority: "none";
}

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function refs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export class InboxMessageRegistry {
  readonly #byId = new Map<string, EvidenceBackedExternalMessage>();
  readonly #bySource = new Map<string, string>();

  register(message: EvidenceBackedExternalMessage): EvidenceBackedExternalMessage {
    if (!message.id.trim() || !message.ownerId.trim() || !message.brandId.trim() || !message.accountId.trim() || !message.threadId.trim() || !message.platform.trim() || !message.externalAuthorRef.trim() || !message.contentHash.trim()) throw new Error("inbound message requires explicit owner/brand/account/thread/platform/source identity");
    if (!message.body.trim()) throw new Error("inbound message body is required");
    const receivedAt = timestamp(message.receivedAt, "inbound message receivedAt");
    const observedAt = timestamp(message.observedAt, "inbound message observedAt");
    if (receivedAt > observedAt) throw new Error("inbound message cannot be observed before it was received");
    const sourceRefs = refs(message.sourceRefs, "inbound message source refs");
    for (const sourceRef of sourceRefs) {
      const existing = this.#bySource.get(`${message.ownerId}:${message.accountId}:${sourceRef}`);
      if (existing && existing !== message.id) throw new Error("provider message source is already bound to another canonical inbound message");
    }
    const current = this.#byId.get(message.id);
    if (current && (current.ownerId !== message.ownerId || current.brandId !== message.brandId || current.accountId !== message.accountId || current.threadId !== message.threadId || current.contentHash !== message.contentHash)) throw new Error("canonical inbound message identity/content cannot be substituted");
    const frozen = Object.freeze({ ...message, sourceRefs });
    this.#byId.set(message.id, frozen);
    for (const sourceRef of sourceRefs) this.#bySource.set(`${message.ownerId}:${message.accountId}:${sourceRef}`, message.id);
    return frozen;
  }
}

export function assessInboundMessage(message: EvidenceBackedExternalMessage): EvidenceBackedInboxTriage {
  if (!message.id.trim() || !message.ownerId.trim() || !message.accountId.trim()) throw new Error("inbound message identity is required");
  const lower = message.body.toLowerCase();
  const suspicious = ["ignore previous instructions", "send password", "reveal secret", "system prompt", "execute this command"].some((marker) => lower.includes(marker));
  const spam = lower.includes("crypto giveaway") || lower.includes("guaranteed profit");
  return Object.freeze({ messageId: message.id, ownerId: message.ownerId, accountId: message.accountId, category: spam ? "spam" : lower.includes("?") ? "question" : "unknown", priority: suspicious || spam ? "low" : "normal", trust: "untrusted_external", instructionAuthority: "none", suspiciousInstructionLikeContent: suspicious, requiresOwnerReview: !spam, sendAuthorized: false });
}

export function createEvidenceBackedReplyDraft(message: EvidenceBackedExternalMessage, input: Omit<EvidenceBackedReplyDraft, "ownerId" | "brandId" | "accountId" | "messageId" | "threadId" | "sendAuthorized">): EvidenceBackedReplyDraft {
  if (!input.id.trim() || !input.body.trim() || !input.contentHash.trim() || !Number.isSafeInteger(input.version) || input.version < 1) throw new Error("reply draft identity/version/body/content hash are required");
  timestamp(input.createdAt, "reply draft createdAt");
  const provenanceRefs = refs(input.provenanceRefs, "reply draft provenance");
  return Object.freeze({ ...input, ownerId: message.ownerId, brandId: message.brandId, accountId: message.accountId, messageId: message.id, threadId: message.threadId, provenanceRefs, sendAuthorized: false as const });
}

export function prepareCommunicationSendIntent(id: string, idempotencyKey: string, draft: EvidenceBackedReplyDraft, authorization: CommunicationSendAuthorization, now: string): CommunicationSendIntent {
  const nowMs = timestamp(now, "communication send now");
  const observedAt = timestamp(authorization.observedAt, "communication authorization observedAt");
  const expiresAt = timestamp(authorization.expiresAt, "communication authorization expiresAt");
  if (!id.trim() || !idempotencyKey.trim() || !authorization.authorizationRef.trim()) throw new Error("communication send intent/idempotency/authorization evidence is required");
  if (observedAt > nowMs || expiresAt <= nowMs || expiresAt <= observedAt) throw new Error("communication send authorization must be current and unexpired");
  if (authorization.ownerId !== draft.ownerId || authorization.accountId !== draft.accountId || authorization.replyDraftId !== draft.id || authorization.replyDraftVersion !== draft.version || authorization.replyContentHash !== draft.contentHash) throw new Error("communication authorization must bind the exact reply revision/content/account");
  return Object.freeze({ id, ownerId: draft.ownerId, brandId: draft.brandId, accountId: draft.accountId, threadId: draft.threadId, replyDraftId: draft.id, replyDraftVersion: draft.version, replyContentHash: draft.contentHash, authorizationRef: authorization.authorizationRef, idempotencyKey, sendAuthorized: true as const, externalTextInstructionAuthority: "none" as const });
}
