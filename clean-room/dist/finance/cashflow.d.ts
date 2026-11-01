export interface CashflowTransaction {
    readonly id: string;
    readonly amountCents: number;
    readonly postingState: "pending" | "posted";
    readonly transferGroupId?: string;
    readonly accountId: string;
}
export interface CashflowTotals {
    readonly postedExternalInflowCents: number;
    readonly postedExternalOutflowCents: number;
    readonly pendingExternalInflowCents: number;
    readonly pendingExternalOutflowCents: number;
    readonly excludedInternalTransferCount: number;
}
export declare function summarizeCashflowFlows(transactions: readonly CashflowTransaction[]): CashflowTotals;
