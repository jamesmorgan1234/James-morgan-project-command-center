export function summarizeSpending(transactions, currency, expectedSourceRefs, observedSourceRefs) {
    const relevant = transactions.filter((transaction) => transaction.currency === currency);
    const totalExpenseCents = relevant.filter((transaction) => transaction.amountCents < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amountCents), 0);
    const totalIncomeCents = relevant.filter((transaction) => transaction.amountCents > 0).reduce((sum, transaction) => sum + transaction.amountCents, 0);
    const observed = new Set(observedSourceRefs);
    const missing = expectedSourceRefs.filter((source) => !observed.has(source));
    return Object.freeze({ currency, totalExpenseCents, totalIncomeCents, transactionCount: relevant.length, sourceCoverageComplete: missing.length === 0, missingSourceRefs: Object.freeze(missing) });
}
//# sourceMappingURL=spending.js.map