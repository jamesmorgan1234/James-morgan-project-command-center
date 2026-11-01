export declare const FINANCIAL_PRIMITIVE_KINDS: readonly ["account", "balance", "asset", "debt", "category", "merchant", "transaction", "valuation", "forecast", "account_type", "connection_state", "confidence"];
export type FinancialPrimitiveKind = (typeof FINANCIAL_PRIMITIVE_KINDS)[number];
export type FinancialTruthState = "realized" | "projected";
export type FinancialSourceFreshness = "fresh" | "stale" | "disconnected" | "unknown";
export interface FinancialConfidencePrimitive {
    readonly score: number;
    readonly basis: "provider" | "rule" | "model" | "owner" | "verified";
    readonly evidenceRefs: readonly string[];
}
export interface FinancialPrimitiveSource {
    readonly providerKey: string;
    readonly providerIdentity: string;
    readonly providerRecordId: string;
    readonly fetchedAt: string;
    readonly freshness: FinancialSourceFreshness;
    readonly provenanceRefs: readonly string[];
}
export interface FinancialPrimitiveInput {
    readonly id: string;
    readonly ownerId: string;
    readonly kind: FinancialPrimitiveKind;
    readonly canonicalRef: string;
    readonly truthState: FinancialTruthState;
    readonly observedAt: string;
    readonly occurredAt?: string;
    readonly accountRef?: string;
    readonly amountCents?: number;
    readonly currency?: string;
    readonly label?: string;
    readonly assumptionRefs?: readonly string[] | undefined;
    readonly scenarioRef?: string;
    readonly confidence: FinancialConfidencePrimitive;
    readonly source: FinancialPrimitiveSource;
}
export interface FinancialPrimitiveRecord extends FinancialPrimitiveInput {
    readonly protectedActionAuthorized: false;
}
export interface FinancialProviderRawRecord {
    readonly providerKey: string;
    readonly providerIdentity: string;
    readonly providerRecordId: string;
    readonly ownerId: string;
    readonly fetchedAt: string;
    readonly provenanceRefs: readonly string[];
    readonly providerPayload: Readonly<Record<string, unknown>>;
}
export declare function createFinancialPrimitive(input: FinancialPrimitiveInput): FinancialPrimitiveRecord;
export declare function normalizeFinancialProviderRecord(raw: FinancialProviderRawRecord, canonical: Omit<FinancialPrimitiveInput, "ownerId" | "source"> & {
    readonly freshness: FinancialSourceFreshness;
}): FinancialPrimitiveRecord;
export interface FinancialCurrentHistoryView {
    readonly current: FinancialPrimitiveRecord | undefined;
    readonly history: readonly FinancialPrimitiveRecord[];
}
export declare function financialCurrentAndHistory(records: readonly FinancialPrimitiveRecord[], ownerId: string, kind: FinancialPrimitiveKind, canonicalRef: string): FinancialCurrentHistoryView;
