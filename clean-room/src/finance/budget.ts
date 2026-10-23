export interface BudgetLine {
  readonly category: string;
  readonly budgetCents: number;
  readonly actualCents?: number;
}

export interface BudgetVariance {
  readonly category: string;
  readonly state: "known" | "unknown";
  readonly varianceCents?: number;
}

export function calculateBudgetVariance(lines: readonly BudgetLine[]): readonly BudgetVariance[] {
  return Object.freeze(lines.map((line) => {
    if (!Number.isSafeInteger(line.budgetCents) || line.budgetCents < 0) throw new Error(`Budget must be non-negative safe cents: ${line.category}`);
    if (line.actualCents === undefined) return Object.freeze({ category: line.category, state: "unknown" as const });
    if (!Number.isSafeInteger(line.actualCents) || line.actualCents < 0) throw new Error(`Actual must be non-negative safe cents: ${line.category}`);
    return Object.freeze({ category: line.category, state: "known" as const, varianceCents: line.budgetCents - line.actualCents });
  }));
}
