export interface AnalyticsEvent {
  readonly id: string;
  readonly metricKey: string;
  readonly value: number;
  readonly occurredAt: string;
  readonly sourceRef: string;
  readonly retentionClass: "short" | "standard" | "long";
  readonly containsSensitivePayload: boolean;
}

export function normalizeAnalyticsEvents(events: readonly AnalyticsEvent[]): readonly AnalyticsEvent[] {
  const seen = new Set<string>();
  const output: AnalyticsEvent[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    if (event.containsSensitivePayload) throw new Error("analytics event violates privacy minimization");
    if (!event.metricKey.trim() || !event.occurredAt.includes("T") || !event.sourceRef.trim() || !Number.isFinite(event.value)) throw new Error("invalid analytics event");
    seen.add(event.id);
    output.push(Object.freeze({ ...event }));
  }
  return Object.freeze(output.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)));
}

export function recalculate(events: readonly AnalyticsEvent[], metricKey: string): number {
  return normalizeAnalyticsEvents(events).filter((event) => event.metricKey === metricKey).reduce((sum, event) => sum + event.value, 0);
}
