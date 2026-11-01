export interface FinancialGoal {
    readonly id: string;
    readonly ownerId: string;
    readonly title: string;
    readonly targetCents: number;
    readonly currentCents?: number;
    readonly dueDate?: string;
    readonly sourceRefs: readonly string[];
}
export type FinancialGoalProgress = Readonly<{
    kind: "percent";
    percent: number;
    currentCents: number;
    targetCents: number;
}> | Readonly<{
    kind: "na";
    label: "N/A";
    reason: string;
}>;
export declare function goalProgress(goal: FinancialGoal): FinancialGoalProgress;
