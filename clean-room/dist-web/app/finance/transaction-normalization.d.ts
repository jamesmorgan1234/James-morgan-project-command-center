import { type CashflowTotals } from "./cashflow.js";
import type { TransactionClassificationSource } from "./transactions.js";
export type FinancialPostingState = "pending" | "posted";
export interface NormalizedFinancialTransactionInput {
    readonly id: string;
    readonly canonicalTransactionRef: string;
    readonly ownerId: string;
    readonly accountId: string;
    readonly providerKey: string;
    readonly providerIdentity: string;
    readonly externalTransactionId: string;
    readonly postingState: FinancialPostingState;
    readonly occurredAt: string;
    readonly postedAt?: string | undefined;
    readonly observedAt: string;
    readonly amountCents: number;
    readonly currency: string;
    readonly merchantName?: string | undefined;
    readonly merchantProvenanceRefs: readonly string[];
    readonly category: string;
    readonly categoryProvenanceRefs: readonly string[];
    readonly classificationSource: TransactionClassificationSource;
    readonly classificationConfidence: number;
    readonly transferGroupId?: string | undefined;
    readonly correctionOf?: string | undefined;
    readonly rawSourceRefs: readonly string[];
}
export interface NormalizedFinancialTransaction extends NormalizedFinancialTransactionInput {
    readonly protectedActionAuthorized: false;
}
export interface NormalizedTransactionCorrection {
    readonly id: string;
    readonly ownerId: string;
    readonly canonicalTransactionRef: string;
    readonly category: string;
    readonly merchantName?: string | undefined;
    readonly ownerDecisionRef: string;
    readonly observedAt: string;
    readonly provenanceRefs: readonly string[];
}
export interface CorrectedFinancialTransactionProjection extends NormalizedFinancialTransaction {
    readonly correctionRef: string;
    readonly correctionProvenanceRefs: readonly string[];
}
export declare function createNormalizedFinancialTransaction(input: NormalizedFinancialTransactionInput): NormalizedFinancialTransaction;
export declare function dedupeNormalizedFinancialTransactions(transactions: readonly NormalizedFinancialTransaction[]): readonly NormalizedFinancialTransaction[];
export declare function selectCurrentNormalizedFinancialTransactions(transactions: readonly NormalizedFinancialTransaction[], ownerId: string): readonly NormalizedFinancialTransaction[];
export declare function applyNormalizedTransactionCorrection(transaction: NormalizedFinancialTransaction, correction: NormalizedTransactionCorrection): CorrectedFinancialTransactionProjection;
export declare function summarizeNormalizedCashflow(transactions: readonly NormalizedFinancialTransaction[], ownerId: string, currency?: string): CashflowTotals;
