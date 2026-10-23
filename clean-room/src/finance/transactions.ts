import { parseTimestamp } from "../security/types.js";

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

export class TransactionLedger {
  readonly #transactions = new Map<string, FinancialTransaction>();
  readonly #providerExternal = new Set<string>();
  readonly #corrections = new Map<string, TransactionCorrection>();

  ingest(transaction: FinancialTransaction): void {
    if (!transaction.id.trim() || !transaction.ownerId.trim() || !transaction.accountId.trim() || !transaction.providerKey.trim() || !transaction.externalTransactionId.trim() || !transaction.category.trim() || !transaction.sourceRef.trim()) throw new Error("Transaction identity/category/provenance fields are required");
    if (!Number.isSafeInteger(transaction.amountCents)) throw new Error("Transaction amount must be safe integer cents");
    if (!/^[A-Z]{3}$/.test(transaction.currency)) throw new Error("Transaction currency must be three uppercase letters");
    if (!Number.isFinite(transaction.classificationConfidence) || transaction.classificationConfidence < 0 || transaction.classificationConfidence > 1) throw new Error("Classification confidence must be 0..1");
    parseTimestamp(transaction.occurredAt, "occurredAt");
    const externalKey = `${transaction.providerKey}:${transaction.externalTransactionId}`;
    if (this.#transactions.has(transaction.id) || this.#providerExternal.has(externalKey)) throw new Error("Duplicate transaction ingestion blocked");
    this.#transactions.set(transaction.id, Object.freeze({ ...transaction }));
    this.#providerExternal.add(externalKey);
  }

  correct(correction: TransactionCorrection): void {
    if (!this.#transactions.has(correction.transactionId)) throw new Error(`Unknown transaction: ${correction.transactionId}`);
    if (!correction.category.trim() || !correction.ownerDecisionRef.trim()) throw new Error("Transaction correction requires category and owner decision evidence");
    this.#corrections.set(correction.transactionId, Object.freeze({ ...correction }));
  }

  effectiveCategory(transactionId: string): string {
    const transaction = this.#transactions.get(transactionId);
    if (!transaction) throw new Error(`Unknown transaction: ${transactionId}`);
    return this.#corrections.get(transactionId)?.category ?? transaction.category;
  }

  list(ownerId: string): readonly FinancialTransaction[] { return Object.freeze([...this.#transactions.values()].filter((transaction) => transaction.ownerId === ownerId)); }
}
