export type TransactionClassificationSource = "provider" | "rule" | "model" | "owner";
export interface FinancialTransaction {
    readonly id: string;
    readonly ownerId: string;
    readonly accountId: string;
    readonly providerKey: string;
    readonly externalTransactionId: string;
    readonly occurredAt: string;
    readonly amountCents: number;
    readonly currency: string;
    readonly merchant?: string;
    readonly category: string;
    readonly classificationSource: TransactionClassificationSource;
    readonly classificationConfidence: number;
    readonly sourceRef: string;
}
export interface TransactionCorrection {
    readonly transactionId: string;
    readonly category: string;
    readonly ownerDecisionRef: string;
}
export declare class TransactionLedger {
    #private;
    ingest(transaction: FinancialTransaction): void;
    correct(correction: TransactionCorrection): void;
    effectiveCategory(transactionId: string): string;
    list(ownerId: string): readonly FinancialTransaction[];
}
