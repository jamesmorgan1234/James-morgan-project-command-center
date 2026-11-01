import type { BookFormat } from "./registry.js";
export type PublicationState = "draft" | "uploaded" | "submitted" | "review" | "live" | "blocked";
export interface PublicationRecord {
    readonly id: string;
    readonly bookId: string;
    readonly format: BookFormat;
    readonly providerKey: string;
    readonly state: PublicationState;
    readonly providerReceiptRef: string | null;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
    readonly testOrder: boolean;
}
export declare function validatePublication(record: PublicationRecord): PublicationRecord;
export declare function countsAsSale(record: PublicationRecord): boolean;
export interface EvidenceBackedPublicationEvent {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly format: BookFormat;
    readonly providerKey: string;
    readonly state: PublicationState;
    readonly providerReceiptRef?: string | undefined;
    readonly providerPublicationRef?: string | undefined;
    readonly submittedAt?: string | undefined;
    readonly reviewedAt?: string | undefined;
    readonly liveAt?: string | undefined;
    readonly blockedReason?: string | undefined;
    readonly errorRef?: string | undefined;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
    readonly testOrder: boolean;
}
export interface PublicationStateSnapshot {
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly format: BookFormat;
    readonly providerKey: string;
    readonly state: PublicationState;
    readonly eventId: string;
    readonly providerReceiptRef?: string | undefined;
    readonly providerPublicationRef?: string | undefined;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
}
export declare function validateEvidenceBackedPublication(event: EvidenceBackedPublicationEvent): EvidenceBackedPublicationEvent;
export declare class BookPublicationLedger {
    #private;
    record(event: EvidenceBackedPublicationEvent): EvidenceBackedPublicationEvent;
    current(ownerId: string, projectId: string, bookId: string, format: BookFormat, providerKey: string): PublicationStateSnapshot | undefined;
    history(ownerId: string, bookId: string): readonly EvidenceBackedPublicationEvent[];
}
export declare function isConfirmedPublished(event: EvidenceBackedPublicationEvent): boolean;
export declare function countsAsConfirmedBookSale(event: EvidenceBackedPublicationEvent, saleEvidenceRef?: string): boolean;
