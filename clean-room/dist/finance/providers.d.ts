export type FinancialProviderConnectionState = "unconfigured" | "connected" | "disconnected" | "expired" | "revoked";
export type FinancialProviderConsentState = "required" | "granted" | "revoked";
export type FinancialProviderHealth = "available" | "degraded" | "unavailable";
export type FinancialProviderFreshness = "fresh" | "stale" | "disconnected" | "unknown";
export interface FinancialProviderAdapter {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly connectionState: FinancialProviderConnectionState;
    readonly consentState: FinancialProviderConsentState;
    readonly capabilities: readonly ("accounts.read" | "transactions.read" | "liabilities.read" | "credit.read" | "investments.read" | "transfer.write" | "payment.write" | "account.write")[];
    readonly dataScopes: readonly string[];
    readonly freshnessSeconds: number;
    readonly health: FinancialProviderHealth;
    readonly credentialRef?: string;
}
export interface FinancialProviderConnectionEvidence {
    readonly providerKey: string;
    readonly ownerId: string;
    readonly providerIdentity: string;
    readonly connectionState: FinancialProviderConnectionState;
    readonly consentState: FinancialProviderConsentState;
    readonly consentRef?: string;
    readonly reconnectRef?: string;
    readonly lastSuccessfulSyncAt?: string;
    readonly observedAt: string;
    readonly freshnessSeconds: number;
    readonly provenanceRefs: readonly string[];
}
export interface FinancialProviderConnectionAssessment {
    readonly providerKey: string;
    readonly providerIdentity: string;
    readonly connectionState: FinancialProviderConnectionState;
    readonly consentState: FinancialProviderConsentState;
    readonly freshness: FinancialProviderFreshness;
    readonly reconnectRequired: boolean;
    readonly historicalRecordsPreserved: true;
    readonly provenanceRefs: readonly string[];
    readonly protectedActionAuthorized: false;
}
export declare function assessFinancialProviderConnection(evidence: FinancialProviderConnectionEvidence, now: string): FinancialProviderConnectionAssessment;
export declare class FinancialProviderRegistry {
    #private;
    register(provider: FinancialProviderAdapter): void;
    eligible(capability: FinancialProviderAdapter["capabilities"][number], requiredScope?: string): readonly FinancialProviderAdapter[];
    get(key: string): FinancialProviderAdapter | undefined;
    list(): readonly FinancialProviderAdapter[];
}
