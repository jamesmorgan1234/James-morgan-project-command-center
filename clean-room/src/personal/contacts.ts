import { parseTimestamp } from "../security/types.js";

export interface ContactRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly displayName: string;
  readonly sensitivity: "internal" | "sensitive" | "protected";
  readonly relationshipContextRefs: readonly string[];
}

export interface FollowUpRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly contactId: string;
  readonly dueAt?: string;
  readonly reason: string;
  readonly state: "open" | "done" | "dismissed";
  readonly communicationBoundary: "recommend_only" | "draft_allowed" | "send_requires_authorization";
  readonly sourceRefs: readonly string[];
}

export interface FollowUpRecommendation {
  readonly followUpId: string;
  readonly contactId: string;
  readonly reason: string;
  readonly sendAuthorized: false;
}

export function recommendFollowUps(contacts: readonly ContactRecord[], followUps: readonly FollowUpRecord[], now: string): readonly FollowUpRecommendation[] {
  const nowMs = parseTimestamp(now, "now");
  const contactIds = new Set(contacts.map((contact) => contact.id));
  return Object.freeze(followUps.filter((followUp) => followUp.state === "open" && contactIds.has(followUp.contactId) && (!followUp.dueAt || parseTimestamp(followUp.dueAt, "dueAt") <= nowMs)).map((followUp) => Object.freeze({ followUpId: followUp.id, contactId: followUp.contactId, reason: followUp.reason, sendAuthorized: false as const })));
}
