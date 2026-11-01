import type { PublishingFormat } from "./metadata.js";
export declare const DEFAULT_BOOK_AUTHOR_BYLINE: "James Morgan";
export type BookPriceState = "recommended" | "approved";
export interface BookFormatFileMapping {
    readonly format: PublishingFormat;
    readonly fileRef: string;
    readonly contentHash: string;
    readonly assetVersion: number;
}
export interface BookFormatPrice {
    readonly format: PublishingFormat;
    readonly amount: number;
    readonly currency: string;
    readonly state: BookPriceState;
    readonly recommendationRef?: string | undefined;
    readonly approvalRef?: string | undefined;
}
export interface EvidenceBackedBookPublicationMetadata {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly version: number;
    readonly title: string;
    readonly subtitle: string | null;
    readonly edition: string;
    readonly authorIdentityRef: string;
    readonly authorDisplayName: string;
    readonly isbnRef?: string | undefined;
    readonly trimSize: string;
    readonly bleed: boolean;
    readonly printSpecificationsRef: string;
    readonly formats: readonly PublishingFormat[];
    readonly packageManifestRef: string;
    readonly fileMappings: readonly BookFormatFileMapping[];
    readonly prices: readonly BookFormatPrice[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export declare function validateBookPublicationMetadata(metadata: EvidenceBackedBookPublicationMetadata): EvidenceBackedBookPublicationMetadata;
export declare function approvedPriceFor(metadata: EvidenceBackedBookPublicationMetadata, format: PublishingFormat): BookFormatPrice | undefined;
