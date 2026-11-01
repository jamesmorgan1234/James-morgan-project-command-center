import type { BookFormat } from "./registry.js";
export interface BookMetadataVersion {
    readonly bookId: string;
    readonly version: number;
    readonly description: string;
    readonly keywords: readonly string[];
    readonly categories: readonly string[];
    readonly trimRef: string;
    readonly bleed: boolean;
    readonly packageManifestHash: string;
    readonly sourceRefs: readonly string[];
}
export interface RolloutStep {
    readonly order: number;
    readonly format: BookFormat | "collection";
    readonly kdpSelect: boolean;
}
export declare function validateMetadata(metadata: BookMetadataVersion): BookMetadataVersion;
export declare function validateRollout(steps: readonly RolloutStep[]): readonly RolloutStep[];
export type PublishingFormat = BookFormat | "collection_kindle" | "collection_paperback" | "collection_hardcover";
export type PricingConfidence = "confirmed" | "recommended";
export interface EvidenceBackedBookMetadataPackage {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly version: number;
    readonly description: string;
    readonly keywords: readonly string[];
    readonly categories: readonly string[];
    readonly trimRef: string;
    readonly bleed: boolean;
    readonly formats: readonly PublishingFormat[];
    readonly packageManifestHash: string;
    readonly packageManifestRef: string;
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface BookPricingRecommendation {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly format: PublishingFormat;
    readonly amount: number;
    readonly currency: string;
    readonly confidence: PricingConfidence;
    readonly rationaleRefs: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface LockedRolloutStep {
    readonly id: string;
    readonly order: number;
    readonly phase: number;
    readonly bookId: string;
    readonly format: PublishingFormat;
    readonly kdpSelect: boolean;
}
export interface LockedBookRolloutPlan {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly version: number;
    readonly ownerLockedOrderRef: string;
    readonly steps: readonly LockedRolloutStep[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface BookPackageReadinessAssessment {
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly metadataVersion: number;
    readonly packageManifestHash: string;
    readonly rolloutPlanId: string;
    readonly ready: boolean;
    readonly blockers: readonly string[];
}
export declare function validateEvidenceBackedBookMetadata(metadata: EvidenceBackedBookMetadataPackage): EvidenceBackedBookMetadataPackage;
export declare function validatePricingRecommendation(recommendation: BookPricingRecommendation): BookPricingRecommendation;
export declare function validateLockedBookRollout(plan: LockedBookRolloutPlan): LockedBookRolloutPlan;
export declare function assertRolloutMatchesOwnerLockedOrder(candidate: LockedBookRolloutPlan, locked: LockedBookRolloutPlan): void;
export declare function assessBookPackageReadiness(metadata: EvidenceBackedBookMetadataPackage, rollout: LockedBookRolloutPlan, pricing: readonly BookPricingRecommendation[]): BookPackageReadinessAssessment;
