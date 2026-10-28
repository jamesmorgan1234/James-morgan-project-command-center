import {canonicalAnalyticsJson} from "./contracts.js";
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
  const seen = new Map<string, AnalyticsEvent>();
  const output: AnalyticsEvent[] = [];
  for (const event of events) {
    const prior=seen.get(event.id);
    if (event.containsSensitivePayload) throw new Error("analytics event violates privacy minimization");
    if(!["short","standard","long"].includes(event.retentionClass)||!Number.isFinite(Date.parse(event.occurredAt)))throw new Error("invalid analytics retention/time");
    if (!event.metricKey.trim() || !event.occurredAt.includes("T") || !event.sourceRef.trim() || !Number.isFinite(event.value)) throw new Error("invalid analytics event");
    if(prior){if(canonicalAnalyticsJson(prior)!==canonicalAnalyticsJson(event))throw new Error("Conflicting duplicate analytics event");continue;}
    seen.set(event.id,event);
    output.push(Object.freeze({ ...event }));
  }
  return Object.freeze(output.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)));
}

export function recalculate(events: readonly AnalyticsEvent[], metricKey: string): number {
  const result=normalizeAnalyticsEvents(events).filter((event) => event.metricKey === metricKey).reduce((sum, event) => sum + event.value, 0);
  if(!Number.isFinite(result))throw new Error("Analytics aggregation overflow");return result;
}
