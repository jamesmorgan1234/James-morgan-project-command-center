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
/**
 * Recommendations are intentionally non-executable. Sensitive relationship context stays in
 * the scoped contact record and is never copied into the recommendation payload.
 */
export declare function recommendFollowUps(contacts: readonly ContactRecord[], followUps: readonly FollowUpRecord[], now: string): readonly FollowUpRecommendation[];
