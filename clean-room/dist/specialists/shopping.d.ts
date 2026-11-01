export type ShoppingTruth = "verified" | "estimated" | "stale" | "unavailable";
export type SavingsTiming = "immediate" | "delayed_rebate" | "cashback";
export type TripPriority = "preserve_cash_today" | "lowest_final_cost" | "closest_practical";
export interface ShoppingOfferEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly providerKey: string;
    readonly merchantRef: string;
    readonly itemRef: string;
    readonly amount: number;
    readonly timing: SavingsTiming;
    readonly truth: ShoppingTruth;
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
    readonly expiresAt?: string;
}
export interface ShoppingTripOption {
    readonly merchantRef: string;
    readonly baseCost: number;
    readonly travelCost: number;
    readonly travelMinutes?: number;
    readonly offers: readonly ShoppingOfferEvidence[];
}
export interface ShoppingTripAssessment {
    readonly merchantRef: string;
    readonly outOfPocketToday: number;
    readonly delayedSavings: number;
    readonly effectiveFinalCost: number;
    readonly travelMinutes?: number;
    readonly priority: TripPriority;
    readonly evidenceRefs: readonly string[];
}
export interface ShoppingSpecialistProfile {
    readonly key: "shopping";
    readonly truthOwner: "specialist:shopping";
    readonly privacyClass: "personal_family";
    readonly providerCapabilities: readonly string[];
    readonly sourceRefs: readonly string[];
}
export declare const SHOPPING_SPECIALIST_PROFILE: ShoppingSpecialistProfile;
export declare function validateShoppingOffer(offer: ShoppingOfferEvidence, now?: string): ShoppingOfferEvidence;
export declare function assessShoppingTrip(option: ShoppingTripOption, priority: TripPriority, now: string): ShoppingTripAssessment;
export declare function rankShoppingTrips(options: readonly ShoppingTripOption[], priority: TripPriority, now: string): readonly ShoppingTripAssessment[];
export declare function assertShoppingTruthOwnership(truthOwner: string): void;
