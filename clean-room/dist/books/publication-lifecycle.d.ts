import type { BookFormat } from "./registry.js";
export type PublicationLifecycleState = "not_prepared" | "prepared" | "upload_ready" | "uploaded" | "draft" | "submitted" | "in_review" | "changes_required" | "blocked" | "rejected" | "approved" | "live" | "unpublished" | "archived" | "superseded";
export interface BookPublicationLifecycleEvent {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly edition: string;
    readonly format: BookFormat;
    readonly providerKey: string;
    readonly providerListingId?: string | undefined;
    readonly state: PublicationLifecycleState;
    readonly providerReceiptRef?: string | undefined;
    readonly providerPublicationRef?: string | undefined;
    readonly providerTimestamp?: string | undefined;
    readonly errorRefs: readonly string[];
    readonly correctionRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly uncertainty?: string | undefined;
    readonly supersedesEventId?: string | undefined;
    readonly observedAt: string;
    readonly lastVerifiedAt: string;
}
export declare function validatePublicationLifecycleEvent(event: BookPublicationLifecycleEvent): BookPublicationLifecycleEvent;
export declare class BookPublicationLifecycleLedger {
    #private;
    record(event: BookPublicationLifecycleEvent): BookPublicationLifecycleEvent;
    current(ownerId: string, projectId: string, bookId: string, edition: string, format: BookFormat, providerKey: string): BookPublicationLifecycleEvent | undefined;
    history(ownerId: string, bookId: string): readonly BookPublicationLifecycleEvent[];
}
export declare function isProviderVerifiedLivePublication(event: BookPublicationLifecycleEvent): boolean;
