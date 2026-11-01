import type { FinancialTransaction } from "./transactions.js";
export interface SpendingSummary {
    readonly currency: string;
    readonly totalExpenseCents: number;
    readonly totalIncomeCents: number;
    readonly transactionCount: number;
    readonly sourceCoverageComplete: boolean;
    readonly missingSourceRefs: readonly string[];
}
export declare function summarizeSpending(transactions: readonly FinancialTransaction[], currency: string, expectedSourceRefs: readonly string[], observedSourceRefs: readonly string[]): SpendingSummary;
