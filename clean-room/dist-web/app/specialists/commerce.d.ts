export interface CommerceProjectBinding {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly storeAccountRef: string;
    readonly supplierAccountRefs: readonly string[];
    readonly providerRefs: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface CommerceProductEconomics {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly productRef: string;
    readonly supplierRef: string;
    readonly landedCost: number;
    readonly salePrice: number;
    readonly currency: string;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
}
export interface CommerceStateEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly domain: "catalog" | "supplier" | "pricing" | "fulfillment" | "marketing" | "revenue";
    readonly canonicalRef: string;
    readonly state: string;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
}
export declare class CommerceIsolationRegistry {
    #private;
    bind(input: CommerceProjectBinding): CommerceProjectBinding;
    require(ownerId: string, projectId: string): CommerceProjectBinding;
}
export declare function validateCommerceEconomics(input: CommerceProductEconomics, binding: CommerceProjectBinding): CommerceProductEconomics;
export declare function validateCommerceState(input: CommerceStateEvidence, binding: CommerceProjectBinding): CommerceStateEvidence;
export declare const COMMERCE_TRUTH_OWNER: "specialist:commerce";
