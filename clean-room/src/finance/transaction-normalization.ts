import { parseTimestamp } from "../security/types.js";
import { summarizeCashflowFlows, type CashflowTotals, type CashflowTransaction } from "./cashflow.js";
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

function nonblank(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

function mergedRefs(left: readonly string[], right: readonly string[]): readonly string[] {
  return Object.freeze([...new Set([...left, ...right])]);
}

export function createNormalizedFinancialTransaction(input: NormalizedFinancialTransactionInput): NormalizedFinancialTransaction {
  nonblank(input.id, "Transaction id");
  nonblank(input.canonicalTransactionRef, "Canonical transaction ref");
  nonblank(input.ownerId, "Transaction ownerId");
  nonblank(input.accountId, "Transaction accountId");
  if (!input.providerKey.startsWith("finance-provider:")) throw new Error("Transaction provider key must start with finance-provider:");
  nonblank(input.providerIdentity, "Transaction provider identity");
  nonblank(input.externalTransactionId, "External transaction id");
  parseTimestamp(input.occurredAt, "Transaction occurredAt");
  parseTimestamp(input.observedAt, "Transaction observedAt");
  if (input.postedAt !== undefined) parseTimestamp(input.postedAt, "Transaction postedAt");
  if (input.postingState === "posted" && input.postedAt === undefined) throw new Error("Posted transaction requires postedAt");
  if (input.postingState === "pending" && input.postedAt !== undefined) throw new Error("Pending transaction cannot have postedAt");
  if (!Number.isSafeInteger(input.amountCents)) throw new Error("Transaction amount must be safe integer cents");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("Transaction currency must be three uppercase letters");
  nonblank(input.category, "Transaction category");
  if (!Number.isFinite(input.classificationConfidence) || input.classificationConfidence < 0 || input.classificationConfidence > 1) throw new Error("Classification confidence must be 0..1");
  if (input.transferGroupId !== undefined) nonblank(input.transferGroupId, "Transfer group id");
  if (input.correctionOf !== undefined) nonblank(input.correctionOf, "Correction lineage ref");
  const rawSourceRefs = refs(input.rawSourceRefs, "Transaction rawSourceRefs");
  const merchantProvenanceRefs = refs(input.merchantProvenanceRefs, "Merchant provenance", input.merchantName !== undefined);
  const categoryProvenanceRefs = refs(input.categoryProvenanceRefs, "Category provenance");
  return Object.freeze({ ...input, rawSourceRefs, merchantProvenanceRefs, categoryProvenanceRefs, protectedActionAuthorized: false as const });
}

function sameNormalizedTruth(left: NormalizedFinancialTransaction, right: NormalizedFinancialTransaction): boolean {
  return left.canonicalTransactionRef === right.canonicalTransactionRef && left.accountId === right.accountId && left.providerIdentity === right.providerIdentity && left.postingState === right.postingState && left.occurredAt === right.occurredAt && left.postedAt === right.postedAt && left.amountCents === right.amountCents && left.currency === right.currency && left.merchantName === right.merchantName && left.category === right.category && left.transferGroupId === right.transferGroupId && left.correctionOf === right.correctionOf;
}

function mergeLineage(primary: NormalizedFinancialTransaction, secondary: NormalizedFinancialTransaction): NormalizedFinancialTransaction {
  return Object.freeze({
    ...primary,
    rawSourceRefs: mergedRefs(primary.rawSourceRefs, secondary.rawSourceRefs),
    merchantProvenanceRefs: mergedRefs(primary.merchantProvenanceRefs, secondary.merchantProvenanceRefs),
    categoryProvenanceRefs: mergedRefs(primary.categoryProvenanceRefs, secondary.categoryProvenanceRefs)
  });
}

export function dedupeNormalizedFinancialTransactions(transactions: readonly NormalizedFinancialTransaction[]): readonly NormalizedFinancialTransaction[] {
  const unique = new Map<string, NormalizedFinancialTransaction>();
  for (const transaction of transactions) {
    const key = `${transaction.ownerId}:${transaction.providerKey}:${transaction.externalTransactionId}:${transaction.postingState}`;
    const existing = unique.get(key);
    if (!existing) { unique.set(key, transaction); continue; }
    if (!sameNormalizedTruth(existing, transaction)) throw new Error(`Conflicting duplicate financial transaction: ${key}`);
    unique.set(key, mergeLineage(existing, transaction));
  }
  return Object.freeze([...unique.values()]);
}

export function selectCurrentNormalizedFinancialTransactions(transactions: readonly NormalizedFinancialTransaction[], ownerId: string): readonly NormalizedFinancialTransaction[] {
  const current = new Map<string, NormalizedFinancialTransaction>();
  for (const transaction of dedupeNormalizedFinancialTransactions(transactions).filter((item) => item.ownerId === ownerId)) {
    const existing = current.get(transaction.canonicalTransactionRef);
    if (!existing) { current.set(transaction.canonicalTransactionRef, transaction); continue; }
    const existingRank = existing.postingState === "posted" ? 1 : 0;
    const incomingRank = transaction.postingState === "posted" ? 1 : 0;
    if (incomingRank > existingRank || (incomingRank === existingRank && Date.parse(transaction.observedAt) > Date.parse(existing.observedAt))) {
      current.set(transaction.canonicalTransactionRef, mergeLineage(transaction, existing));
      continue;
    }
    if (incomingRank === existingRank && transaction.observedAt === existing.observedAt && !sameNormalizedTruth(existing, transaction)) throw new Error(`Conflicting current transaction truth: ${transaction.canonicalTransactionRef}`);
    current.set(transaction.canonicalTransactionRef, mergeLineage(existing, transaction));
  }
  return Object.freeze([...current.values()]);
}

export function applyNormalizedTransactionCorrection(transaction: NormalizedFinancialTransaction, correction: NormalizedTransactionCorrection): CorrectedFinancialTransactionProjection {
  if (transaction.ownerId !== correction.ownerId || transaction.canonicalTransactionRef !== correction.canonicalTransactionRef) throw new Error("Transaction correction scope mismatch");
  nonblank(correction.id, "Transaction correction id");
  nonblank(correction.category, "Transaction correction category");
  nonblank(correction.ownerDecisionRef, "Transaction correction owner decision");
  parseTimestamp(correction.observedAt, "Transaction correction observedAt");
  if (Date.parse(correction.observedAt) < Date.parse(transaction.observedAt)) throw new Error("Transaction correction cannot predate observed transaction truth");
  const correctionProvenanceRefs = refs(correction.provenanceRefs, "Transaction correction provenance");
  return Object.freeze({
    ...transaction,
    category: correction.category,
    merchantName: correction.merchantName ?? transaction.merchantName,
    classificationSource: "owner",
    classificationConfidence: 1,
    correctionRef: correction.id,
    correctionProvenanceRefs
  });
}

export function summarizeNormalizedCashflow(transactions: readonly NormalizedFinancialTransaction[], ownerId: string, currency = "USD"): CashflowTotals {
  const cashflowRows: CashflowTransaction[] = selectCurrentNormalizedFinancialTransactions(transactions, ownerId)
    .filter((transaction) => transaction.currency === currency)
    .map((transaction) => ({
      id: transaction.id,
      amountCents: transaction.amountCents,
      postingState: transaction.postingState,
      accountId: transaction.accountId,
      ...(transaction.transferGroupId === undefined ? {} : { transferGroupId: transaction.transferGroupId })
    }));
  return summarizeCashflowFlows(cashflowRows);
}
