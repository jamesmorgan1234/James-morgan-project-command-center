import type { FinancialTransaction } from "./transactions.js";

export interface SpendingSummary {
  readonly currency: string;
  readonly totalExpenseCents: number;
  readonly totalIncomeCents: number;
  readonly transactionCount: number;
  readonly sourceCoverageComplete: boolean;
  readonly missingSourceRefs: readonly string[];
}

export function summarizeSpending(transactions: readonly FinancialTransaction[], currency: string, expectedSourceRefs: readonly string[], observedSourceRefs: readonly string[]): SpendingSummary {
  const relevant = transactions.filter((transaction) => transaction.currency === currency);
  const totalExpenseCents = relevant.filter((transaction) => transaction.amountCents < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amountCents), 0);
  const totalIncomeCents = relevant.filter((transaction) => transaction.amountCents > 0).reduce((sum, transaction) => sum + transaction.amountCents, 0);
  const observed = new Set(observedSourceRefs);
  const missing = expectedSourceRefs.filter((source) => !observed.has(source));
  return Object.freeze({ currency, totalExpenseCents, totalIncomeCents, transactionCount: relevant.length, sourceCoverageComplete: missing.length === 0, missingSourceRefs: Object.freeze(missing) });
}
