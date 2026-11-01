export type ServiceBusinessDomain = "lead" | "estimate" | "contract" | "job" | "material" | "schedule" | "payment" | "follow_up" | "reputation";
export interface ServiceBusinessBinding {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly crmRef: string;
    readonly calendarRef?: string | undefined;
    readonly paymentProviderRef?: string | undefined;
    readonly sourceRefs: readonly string[];
}
export interface ServiceBusinessState {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly domain: ServiceBusinessDomain;
    readonly canonicalRef: string;
    readonly state: string;
    readonly providerRef?: string | undefined;
    readonly sourceRefs: readonly string[];
}
export interface ServiceBusinessJobLink {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly leadRef?: string | undefined;
    readonly estimateRef?: string | undefined;
    readonly contractRef?: string | undefined;
    readonly jobRef: string;
    readonly scheduleRef?: string | undefined;
    readonly paymentRef?: string | undefined;
    readonly sourceRefs: readonly string[];
}
export declare class ServiceBusinessRegistry {
    #private;
    register(input: ServiceBusinessBinding): ServiceBusinessBinding;
    require(ownerId: string, projectId: string): ServiceBusinessBinding;
}
export declare function validateServiceBusinessState(input: ServiceBusinessState, binding: ServiceBusinessBinding): ServiceBusinessState;
export declare function validateServiceBusinessJobLink(input: ServiceBusinessJobLink, binding: ServiceBusinessBinding): ServiceBusinessJobLink;
export declare const SERVICE_BUSINESS_TRUTH_OWNER: "specialist:service_business";
