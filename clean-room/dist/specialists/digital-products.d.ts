export type DigitalProductDomain = "product_file" | "delivery" | "storefront" | "pricing" | "promotion" | "analytics" | "support";
export interface DigitalProductVentureBinding {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly storefrontRef: string;
    readonly deliveryProviderRef: string;
    readonly analyticsProviderRefs: readonly string[];
    readonly sourceRefs: readonly string[];
}
export interface DigitalProductArtifact {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly productRef: string;
    readonly fileRef: string;
    readonly contentHash: string;
    readonly deliveryRef: string;
    readonly price: number;
    readonly currency: string;
    readonly sourceRefs: readonly string[];
}
export interface DigitalProductState {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly domain: DigitalProductDomain;
    readonly canonicalRef: string;
    readonly state: string;
    readonly providerRef?: string;
    readonly sourceRefs: readonly string[];
}
export declare class DigitalProductVentureRegistry {
    #private;
    register(input: DigitalProductVentureBinding): DigitalProductVentureBinding;
    require(ownerId: string, projectId: string): DigitalProductVentureBinding;
}
export declare function validateDigitalProductArtifact(input: DigitalProductArtifact, binding: DigitalProductVentureBinding): DigitalProductArtifact;
export declare function validateDigitalProductState(input: DigitalProductState, binding: DigitalProductVentureBinding): DigitalProductState;
export declare const DIGITAL_PRODUCT_TRUTH_OWNER: "specialist:digital_products";
