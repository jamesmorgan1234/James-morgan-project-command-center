export type ProgressDisplay = Readonly<{
    kind: "percent";
    completed: number;
    total: number;
    percent: number;
}> | Readonly<{
    kind: "na";
    label: "N/A";
    reason: string;
}>;
export declare function verifiedProgress(completed: number | undefined, total: number | undefined, denominatorVerified: boolean): ProgressDisplay;
export type SemanticStatus = "active" | "live" | "in_progress" | "planning" | "ready" | "queued" | "blocked" | "complete" | "healthy" | "needs_owner";
export declare const STATUS_PRESENTATION: Readonly<Record<SemanticStatus, Readonly<{
    label: string;
    tone: "green" | "yellow" | "cyan" | "muted" | "red";
}>>>;
