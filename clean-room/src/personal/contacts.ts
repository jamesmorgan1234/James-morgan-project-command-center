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
  readonly ownerId: string;
  readonly reason: string;
  readonly sensitivity: ContactRecord["sensitivity"];
  readonly communicationBoundary: FollowUpRecord["communicationBoundary"];
  readonly sendAuthorized: false;
}

function contactKey(ownerId: string, contactId: string): string { return `${ownerId}:${contactId}`; }

function validateContact(contact: ContactRecord): void {
  if (!contact.id.trim() || !contact.ownerId.trim() || !contact.displayName.trim()) throw new Error("Contact identity/owner/name are required");
  if (contact.relationshipContextRefs.some((ref) => !ref.trim()) || new Set(contact.relationshipContextRefs).size !== contact.relationshipContextRefs.length) throw new Error("Contact relationship context refs must be unique and nonblank");
}

function validateFollowUp(followUp: FollowUpRecord): void {
  if (!followUp.id.trim() || !followUp.ownerId.trim() || !followUp.contactId.trim() || !followUp.reason.trim()) throw new Error("Follow-up identity/owner/contact/reason are required");
  if (followUp.dueAt) parseTimestamp(followUp.dueAt, "dueAt");
  if (followUp.sourceRefs.length === 0 || followUp.sourceRefs.some((ref) => !ref.trim())) throw new Error("Follow-up requires provenance");
}

/**
 * Recommendations are intentionally non-executable. Sensitive relationship context stays in
 * the scoped contact record and is never copied into the recommendation payload.
 */
export function recommendFollowUps(contacts: readonly ContactRecord[], followUps: readonly FollowUpRecord[], now: string): readonly FollowUpRecommendation[] {
  const nowMs = parseTimestamp(now, "now");
  const byScope = new Map<string, ContactRecord>();
  for (const contact of contacts) { validateContact(contact); const key = contactKey(contact.ownerId, contact.id); if (byScope.has(key)) throw new Error(`Duplicate scoped contact: ${key}`); byScope.set(key, contact); }
  return Object.freeze(followUps.flatMap((followUp) => {
    validateFollowUp(followUp);
    if (followUp.state !== "open" || (followUp.dueAt && parseTimestamp(followUp.dueAt, "dueAt") > nowMs)) return [];
    const contact = byScope.get(contactKey(followUp.ownerId, followUp.contactId));
    if (!contact) return [];
    return [Object.freeze({ followUpId: followUp.id, contactId: followUp.contactId, ownerId: followUp.ownerId, reason: followUp.reason, sensitivity: contact.sensitivity, communicationBoundary: followUp.communicationBoundary, sendAuthorized: false as const })];
  }));
}
