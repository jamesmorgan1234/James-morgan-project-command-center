import { type SocialConnection, type SocialConnectionEvidence } from "./connections.js";
import { type SocialDraft } from "./drafts.js";
export type PublishState = "prepared" | "scheduled" | "submitting" | "uncertain" | "published" | "failed" | "cancelled";
export interface PublishIntent {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly draftId: string;
    readonly idempotencyKey: string;
    readonly state: PublishState;
    readonly scheduledAt?: string;
    readonly authorizationRef: string;
    readonly requiredScopes: readonly string[];
}
export interface PublishReceipt {
    readonly intentId: string;
    readonly accountId: string;
    readonly externalPublicationId: string;
    readonly providerRef: string;
    readonly canonicalPostUrl?: string;
    readonly publishedAt: string;
}
export interface SocialContentCalendarEntry {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly draftId: string;
    readonly scheduledAt: string;
    readonly status: "planned" | "scheduled" | "published" | "failed" | "cancelled";
    readonly sourceRefs: readonly string[];
}
export interface SocialPublicationHistoryRecord {
    readonly intentId: string;
    readonly accountId: string;
    readonly draftId: string;
    readonly state: PublishState;
    readonly externalPublicationId?: string;
    readonly canonicalPostUrl?: string;
    readonly publishedAt?: string;
    readonly failedReason?: string;
    readonly evidenceRefs: readonly string[];
}
export declare class SocialContentCalendar {
    #private;
    upsert(x: SocialContentCalendarEntry): Readonly<{
        sourceRefs: readonly string[];
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        scheduledAt: string;
        status: "planned" | "scheduled" | "published" | "failed" | "cancelled";
    }>;
    list(ownerId: string, brandId?: string, accountId?: string): readonly SocialContentCalendarEntry[];
}
export declare class PublishLedger {
    #private;
    prepare(i: PublishIntent, d: SocialDraft, c: SocialConnection, now?: string): PublishIntent;
    transition(id: string, expected: PublishState, next: PublishState): Readonly<{
        state: PublishState;
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        idempotencyKey: string;
        scheduledAt?: string;
        authorizationRef: string;
        requiredScopes: readonly string[];
    }>;
    recordReceipt(r: PublishReceipt): void;
    recordFailure(id: string, reason: string): PublishIntent;
    receipt(id: string): PublishReceipt | undefined;
    history(ownerId: string): readonly SocialPublicationHistoryRecord[];
}
export interface EvidenceBackedPublishIntent {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly draftId: string;
    readonly draftVersion: number;
    readonly draftContentHash: string;
    readonly profileKey: string;
    readonly profileVersion: number;
    readonly idempotencyKey: string;
    readonly state: PublishState;
    readonly scheduledAt?: string;
    readonly authorizationRef: string;
    readonly authorizationAccountId: string;
    readonly authorizationObservedAt: string;
    readonly authorizationExpiresAt: string;
    readonly requiredScopes: readonly string[];
    readonly workflowId?: string;
    readonly workflowOrdinal?: number;
}
export type PublishAttemptState = "submitted" | "acknowledged" | "failed" | "unknown";
export interface PublishAttemptEvidence {
    readonly attemptId: string;
    readonly intentId: string;
    readonly accountId: string;
    readonly idempotencyKey: string;
    readonly state: PublishAttemptState;
    readonly providerRequestRef: string;
    readonly observedAt: string;
    readonly responseRef?: string;
    readonly externalPublicationId?: string;
}
export interface EvidenceBackedPublishReceipt {
    readonly intentId: string;
    readonly accountId: string;
    readonly idempotencyKey: string;
    readonly externalPublicationId: string;
    readonly providerRef: string;
    readonly canonicalPostUrl?: string;
    readonly publishedAt: string;
    readonly evidenceRefs: readonly string[];
}
export declare class EvidenceBackedPublishLedger {
    #private;
    prepare(i: EvidenceBackedPublishIntent, d: SocialDraft, c: SocialConnectionEvidence, now: string, maxAge: number): EvidenceBackedPublishIntent;
    schedule(id: string, at: string): Readonly<{
        requiredScopes: readonly string[];
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        draftVersion: number;
        draftContentHash: string;
        profileKey: string;
        profileVersion: number;
        idempotencyKey: string;
        state: PublishState;
        scheduledAt?: string;
        authorizationRef: string;
        authorizationAccountId: string;
        authorizationObservedAt: string;
        authorizationExpiresAt: string;
        workflowId?: string;
        workflowOrdinal?: number;
    }>;
    startAttempt(a: PublishAttemptEvidence): Readonly<{
        attemptId: string;
        intentId: string;
        accountId: string;
        idempotencyKey: string;
        state: PublishAttemptState;
        providerRequestRef: string;
        observedAt: string;
        responseRef?: string;
        externalPublicationId?: string;
    }>;
    markAttemptUnknown(id: string, responseRef: string, at: string): Readonly<{
        requiredScopes: readonly string[];
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        draftVersion: number;
        draftContentHash: string;
        profileKey: string;
        profileVersion: number;
        idempotencyKey: string;
        state: PublishState;
        scheduledAt?: string;
        authorizationRef: string;
        authorizationAccountId: string;
        authorizationObservedAt: string;
        authorizationExpiresAt: string;
        workflowId?: string;
        workflowOrdinal?: number;
    }>;
    reconcileReceipt(r: EvidenceBackedPublishReceipt): EvidenceBackedPublishReceipt;
    recordFailure(id: string, evidenceRef: string, reason?: string): Readonly<{
        requiredScopes: readonly string[];
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        draftVersion: number;
        draftContentHash: string;
        profileKey: string;
        profileVersion: number;
        idempotencyKey: string;
        state: PublishState;
        scheduledAt?: string;
        authorizationRef: string;
        authorizationAccountId: string;
        authorizationObservedAt: string;
        authorizationExpiresAt: string;
        workflowId?: string;
        workflowOrdinal?: number;
    }>;
    cancel(id: string): Readonly<{
        requiredScopes: readonly string[];
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        draftVersion: number;
        draftContentHash: string;
        profileKey: string;
        profileVersion: number;
        idempotencyKey: string;
        state: PublishState;
        scheduledAt?: string;
        authorizationRef: string;
        authorizationAccountId: string;
        authorizationObservedAt: string;
        authorizationExpiresAt: string;
        workflowId?: string;
        workflowOrdinal?: number;
    }>;
    reschedule(id: string, at: string, now: string): Readonly<{
        requiredScopes: readonly string[];
        id: string;
        ownerId: string;
        brandId: string;
        accountId: string;
        draftId: string;
        draftVersion: number;
        draftContentHash: string;
        profileKey: string;
        profileVersion: number;
        idempotencyKey: string;
        state: PublishState;
        scheduledAt?: string;
        authorizationRef: string;
        authorizationAccountId: string;
        authorizationObservedAt: string;
        authorizationExpiresAt: string;
        workflowId?: string;
        workflowOrdinal?: number;
    }>;
    intent(id: string): EvidenceBackedPublishIntent | undefined;
    receipt(id: string): EvidenceBackedPublishReceipt | undefined;
    history(ownerId: string): readonly SocialPublicationHistoryRecord[];
    private req;
    private put;
}
