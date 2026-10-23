export type MetricConfidence = "confirmed" | "estimated";

export interface SocialMetric {
  readonly id: string;
  readonly accountId: string;
  readonly contentRef?: string;
  readonly metric: string;
  readonly value: number;
  readonly observedAt: string;
  readonly sourceRef: string;
  readonly confidence: MetricConfidence;
}

export interface AttributionRecord {
  readonly id: string;
  readonly sourceMetricIds: readonly string[];
  readonly outcomeKind: "traffic" | "lead" | "sale" | "revenue";
  readonly amount?: number;
  readonly currency?: string;
  readonly confidence: MetricConfidence;
  readonly sourceRefs: readonly string[];
}

export function validateMetric(metric: SocialMetric): SocialMetric {
  if (!metric.id.trim() || !metric.accountId.trim() || !metric.metric.trim() || !metric.sourceRef.trim()) throw new Error("social metric identity and provenance required");
  if (!Number.isFinite(metric.value) || metric.value < 0) throw new Error("invalid social metric value");
  if (!metric.observedAt.includes("T")) throw new Error("social metric requires timestamp freshness");
  return Object.freeze({ ...metric });
}

export function validateAttribution(record: AttributionRecord, metrics: readonly SocialMetric[]): AttributionRecord {
  const metricIds = new Set(metrics.map((metric) => metric.id));
  if (record.sourceMetricIds.length === 0 || record.sourceRefs.length === 0) throw new Error("attribution requires evidence");
  if (!record.sourceMetricIds.every((id) => metricIds.has(id))) throw new Error("attribution references unknown metric");
  if (record.outcomeKind === "revenue") {
    if (record.amount === undefined || !record.currency?.trim()) throw new Error("revenue attribution requires amount and currency");
    if (record.confidence !== "confirmed") throw new Error("estimated attribution cannot be represented as confirmed revenue");
  }
  return Object.freeze({ ...record, sourceMetricIds: Object.freeze([...record.sourceMetricIds]), sourceRefs: Object.freeze([...record.sourceRefs]) });
}
