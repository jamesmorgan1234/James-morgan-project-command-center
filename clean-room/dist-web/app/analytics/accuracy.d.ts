export interface AnalyticsEvent {
    readonly id: string;
    readonly metricKey: string;
    readonly value: number;
    readonly occurredAt: string;
    readonly sourceRef: string;
    readonly retentionClass: "short" | "standard" | "long";
    readonly containsSensitivePayload: boolean;
}
export declare function normalizeAnalyticsEvents(events: readonly AnalyticsEvent[]): readonly AnalyticsEvent[];
export declare function recalculate(events: readonly AnalyticsEvent[], metricKey: string): number;
