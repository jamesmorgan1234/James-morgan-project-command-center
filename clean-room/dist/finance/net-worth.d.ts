import type { FinancialAccount, FinancialAccountPosition } from "./accounts.js";
export interface NetWorthSnapshot {
    readonly ownerId: string;
    readonly currency: string;
    readonly knownAssetsCents: number;
    readonly knownLiabilitiesCents: number;
    readonly knownNetWorthCents: number;
    readonly unknownAccountIds: readonly string[];
    readonly complete: boolean;
}
export interface FinancialPositionNetWorthSnapshot {
    readonly ownerId: string;
    readonly currency: string;
    readonly asOf: string;
    readonly verifiedAssetsCents: number;
    readonly verifiedLiabilitiesCents: number;
    readonly verifiedNetWorthCents: number;
    readonly verifiedAccountIds: readonly string[];
    readonly verifiedZeroAccountIds: readonly string[];
    readonly pendingAccountIds: readonly string[];
    readonly staleAccountIds: readonly string[];
    readonly unavailableAccountIds: readonly string[];
    readonly sourceDatesByAccount: Readonly<Record<string, string>>;
    readonly complete: boolean;
}
export declare function calculateNetWorth(ownerId: string, accounts: readonly FinancialAccount[], currency?: string): NetWorthSnapshot;
export declare function calculatePositionNetWorth(ownerId: string, positions: readonly FinancialAccountPosition[], currency?: string, asOf?: string): FinancialPositionNetWorthSnapshot;
