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
