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
export declare function calculateBudgetVariance(lines: readonly BudgetLine[]): readonly BudgetVariance[];
