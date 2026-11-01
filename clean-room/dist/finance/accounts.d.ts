import type { MoneyValue } from "./money.js";
import type { FinancialProviderAdapter } from "./providers.js";
export interface FinancialProviderBinding {
    readonly providerKey: string;
    readonly externalAccountId: string;
    readonly accountVersion: number;
    readonly sourceRef: string;
}
export interface FinancialProviderRebind {
    readonly operationId: string;
    readonly accountId: string;
    readonly ownerId: string;
    readonly expectedVersion: number;
    readonly provider: FinancialProviderAdapter;
    readonly externalAccountId: string;
    readonly requiredReadScope: string;
    readonly consentRef: string;
    readonly sourceRef: string;
}
export interface FinancialProviderRebindReceipt {
    readonly accountId: string;
    readonly accountVersion: number;
    readonly operationId: string;
    readonly protectedActionAuthorized: false;
}
export type FinancialAccountType = "checking" | "savings" | "cash" | "credit_card" | "loan" | "mortgage" | "investment" | "retirement" | "other";
export interface FinancialAccount {
    readonly id: string;
    readonly ownerId: string;
    readonly providerKey: string;
    readonly externalAccountId: string;
    readonly displayName: string;
    readonly type: FinancialAccountType;
    readonly balance: MoneyValue;
    readonly balanceAsOf: string;
    readonly liability: boolean;
    readonly sourceRef: string;
    readonly version: number;
}
export type FinancialAccountOwnership = "sole" | "joint" | "authorized_user" | "custodial" | "external";
export type FinancialPositionClass = "asset" | "liability";
export type FinancialPositionValue = Readonly<{
    state: "verified" | "pending" | "stale";
    cents: number;
    currency: string;
}> | Readonly<{
    state: "unavailable";
    reason: string;
}>;
export type FinancialPositionReconciliationDecision = "accept_newer" | "duplicate" | "reject_stale" | "manual_conflict";
export interface FinancialAccountPosition {
    readonly id: string;
    readonly ownerId: string;
    readonly accountId: string;
    readonly providerKey: string;
    readonly externalAccountId: string;
    readonly accountType: FinancialAccountType;
    readonly accountCurrency: string;
    readonly ownership: FinancialAccountOwnership;
    readonly positionClass: FinancialPositionClass;
    readonly value: FinancialPositionValue;
    readonly valuationDate: string;
    readonly observedAt: string;
    readonly provenanceRefs: readonly string[];
    readonly protectedActionAuthorized: false;
}
export declare function createFinancialAccountPosition(input: Omit<FinancialAccountPosition, "protectedActionAuthorized">): FinancialAccountPosition;
export declare function reconcileFinancialAccountPosition(current: FinancialAccountPosition | undefined, incoming: FinancialAccountPosition): FinancialPositionReconciliationDecision;
export declare class FinancialAccountRegistry {
    #private;
    register(account: FinancialAccount): void;
    replace(account: FinancialAccount, expectedVersion: number): void;
    get(id: string): FinancialAccount | undefined;
    /** Metadata-only identity repair. It neither changes provider consent/scopes nor authorizes effects. */
    rebindProvider(input: FinancialProviderRebind): FinancialProviderRebindReceipt;
    providerLineage(id: string): readonly FinancialProviderBinding[];
    list(ownerId: string): readonly FinancialAccount[];
}
