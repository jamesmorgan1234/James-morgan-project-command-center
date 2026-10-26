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

export interface EvidenceBackedSocialMetric {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly contentRef?: string | undefined;
  readonly metric: string;
  readonly value: number;
  readonly unit: string;
  readonly observedAt: string;
  readonly collectedAt: string;
  readonly sourceRefs: readonly string[];
  readonly confidence: MetricConfidence;
  readonly freshnessMaxAgeMs: number;
}

export interface EvidenceBackedAttribution {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly sourceMetricIds: readonly string[];
  readonly outcomeKind: "traffic" | "lead" | "sale" | "revenue";
  readonly outcomeRef: string;
  readonly amount?: number | undefined;
  readonly currency?: string | undefined;
  readonly confidence: MetricConfidence;
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface MetricAssessment {
  readonly metricId: string;
  readonly fresh: boolean;
  readonly confidence: MetricConfidence;
  readonly ageMs: number;
}

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function refs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicate references`);
  return Object.freeze(normalized);
}

export function validateEvidenceBackedMetric(metric: EvidenceBackedSocialMetric): EvidenceBackedSocialMetric {
  if (!metric.id.trim() || !metric.ownerId.trim() || !metric.brandId.trim() || !metric.accountId.trim() || !metric.metric.trim() || !metric.unit.trim()) throw new Error("evidence-backed social metric identity/account/metric/unit are required");
  if (!Number.isFinite(metric.value) || metric.value < 0) throw new Error("invalid social metric value");
  if (!Number.isSafeInteger(metric.freshnessMaxAgeMs) || metric.freshnessMaxAgeMs < 0) throw new Error("metric freshness policy is invalid");
  const observedAt = timestamp(metric.observedAt, "metric observedAt");
  const collectedAt = timestamp(metric.collectedAt, "metric collectedAt");
  if (observedAt > collectedAt) throw new Error("metric cannot be collected before observation");
  const sourceRefs = refs(metric.sourceRefs, "metric source refs");
  return Object.freeze({ ...metric, sourceRefs });
}

export function assessMetricFreshness(metric: EvidenceBackedSocialMetric, now: string): MetricAssessment {
  const valid = validateEvidenceBackedMetric(metric);
  const nowMs = timestamp(now, "metric assessment now");
  const collectedAt = timestamp(valid.collectedAt, "metric collectedAt");
  if (collectedAt > nowMs) throw new Error("metric evidence cannot originate in the future");
  const ageMs = nowMs - collectedAt;
  return Object.freeze({ metricId: valid.id, fresh: ageMs <= valid.freshnessMaxAgeMs, confidence: valid.confidence, ageMs });
}

export function validateEvidenceBackedAttribution(record: EvidenceBackedAttribution, metrics: readonly EvidenceBackedSocialMetric[]): EvidenceBackedAttribution {
  if (!record.id.trim() || !record.ownerId.trim() || !record.brandId.trim() || !record.accountId.trim() || !record.outcomeRef.trim()) throw new Error("attribution identity/account/outcome evidence is required");
  timestamp(record.observedAt, "attribution observedAt");
  const sourceMetricIds = refs(record.sourceMetricIds, "attribution source metric ids");
  const sourceRefs = refs(record.sourceRefs, "attribution source refs");
  const byId = new Map(metrics.map((metric) => [metric.id, validateEvidenceBackedMetric(metric)]));
  for (const id of sourceMetricIds) {
    const metric = byId.get(id);
    if (!metric) throw new Error("attribution references unknown metric");
    if (metric.ownerId !== record.ownerId || metric.brandId !== record.brandId || metric.accountId !== record.accountId) throw new Error("attribution cannot cross owner/brand/account boundaries");
  }
  if (record.outcomeKind === "revenue") {
    if (record.amount === undefined || !Number.isFinite(record.amount) || record.amount < 0 || !record.currency?.trim()) throw new Error("revenue attribution requires nonnegative amount and currency");
    if (record.confidence !== "confirmed") throw new Error("estimated attribution cannot be represented as confirmed revenue");
  } else if (record.amount !== undefined || record.currency !== undefined) {
    throw new Error("non-revenue attribution cannot carry monetary amount/currency");
  }
  return Object.freeze({ ...record, sourceMetricIds, sourceRefs });
}

export interface SocialPerformanceSnapshot {
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly generatedAt: string;
  readonly metricIds: readonly string[];
  readonly confirmedRevenueAttributionIds: readonly string[];
  readonly estimatedOutcomeIds: readonly string[];
}

export function buildSocialPerformanceSnapshot(metrics: readonly EvidenceBackedSocialMetric[], attributions: readonly EvidenceBackedAttribution[], ownerId: string, brandId: string, accountId: string, now: string): SocialPerformanceSnapshot {
  timestamp(now, "snapshot generatedAt");
  const scopedMetrics = metrics.map(validateEvidenceBackedMetric).filter((metric) => metric.ownerId === ownerId && metric.brandId === brandId && metric.accountId === accountId);
  const scopedAttributions = attributions
    .filter((record) => record.ownerId === ownerId && record.brandId === brandId && record.accountId === accountId)
    .map((record) => validateEvidenceBackedAttribution(record, scopedMetrics));
  const confirmedRevenueAttributionIds = scopedAttributions.filter((record) => record.outcomeKind === "revenue" && record.confidence === "confirmed").map((record) => record.id);
  const estimatedOutcomeIds = scopedAttributions.filter((record) => record.confidence === "estimated").map((record) => record.id);
  return Object.freeze({ ownerId, brandId, accountId, generatedAt: now, metricIds: Object.freeze(scopedMetrics.map((metric) => metric.id)), confirmedRevenueAttributionIds: Object.freeze(confirmedRevenueAttributionIds), estimatedOutcomeIds: Object.freeze(estimatedOutcomeIds) });
}
