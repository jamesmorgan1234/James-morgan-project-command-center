export function calculateBudgetVariance(lines) {
    return Object.freeze(lines.map((line) => {
        if (!Number.isSafeInteger(line.budgetCents) || line.budgetCents < 0)
            throw new Error(`Budget must be non-negative safe cents: ${line.category}`);
        if (line.actualCents === undefined)
            return Object.freeze({ category: line.category, state: "unknown" });
        if (!Number.isSafeInteger(line.actualCents) || line.actualCents < 0)
            throw new Error(`Actual must be non-negative safe cents: ${line.category}`);
        return Object.freeze({ category: line.category, state: "known", varianceCents: line.budgetCents - line.actualCents });
    }));
}
//# sourceMappingURL=budget.js.map