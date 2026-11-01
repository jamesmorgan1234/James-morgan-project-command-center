import { parseTimestamp } from "../security/types.js";
function contactKey(ownerId, contactId) { return `${ownerId}:${contactId}`; }
function validateContact(contact) {
    if (!contact.id.trim() || !contact.ownerId.trim() || !contact.displayName.trim())
        throw new Error("Contact identity/owner/name are required");
    if (contact.relationshipContextRefs.some((ref) => !ref.trim()) || new Set(contact.relationshipContextRefs).size !== contact.relationshipContextRefs.length)
        throw new Error("Contact relationship context refs must be unique and nonblank");
}
function validateFollowUp(followUp) {
    if (!followUp.id.trim() || !followUp.ownerId.trim() || !followUp.contactId.trim() || !followUp.reason.trim())
        throw new Error("Follow-up identity/owner/contact/reason are required");
    if (followUp.dueAt)
        parseTimestamp(followUp.dueAt, "dueAt");
    if (followUp.sourceRefs.length === 0 || followUp.sourceRefs.some((ref) => !ref.trim()))
        throw new Error("Follow-up requires provenance");
}
/**
 * Recommendations are intentionally non-executable. Sensitive relationship context stays in
 * the scoped contact record and is never copied into the recommendation payload.
 */
export function recommendFollowUps(contacts, followUps, now) {
    const nowMs = parseTimestamp(now, "now");
    const byScope = new Map();
    for (const contact of contacts) {
        validateContact(contact);
        const key = contactKey(contact.ownerId, contact.id);
        if (byScope.has(key))
            throw new Error(`Duplicate scoped contact: ${key}`);
        byScope.set(key, contact);
    }
    return Object.freeze(followUps.flatMap((followUp) => {
        validateFollowUp(followUp);
        if (followUp.state !== "open" || (followUp.dueAt && parseTimestamp(followUp.dueAt, "dueAt") > nowMs))
            return [];
        const contact = byScope.get(contactKey(followUp.ownerId, followUp.contactId));
        if (!contact)
            return [];
        return [Object.freeze({ followUpId: followUp.id, contactId: followUp.contactId, ownerId: followUp.ownerId, reason: followUp.reason, sensitivity: contact.sensitivity, communicationBoundary: followUp.communicationBoundary, sendAuthorized: false })];
    }));
}
//# sourceMappingURL=contacts.js.map