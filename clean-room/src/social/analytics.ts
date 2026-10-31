export type MetricConfidence = "confirmed" | "estimated";
export type SocialMetricName =
  | "followers"
  | "subscribers"
  | "impressions"
  | "reach"
  | "views"
  | "watch_time"
  | "engagement"
  | "clicks"
  | "conversions"
  | "revenue"
  | "post_performance";

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

export interface EvidenceBackedSocialMetric {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly contentRef?: string;
  readonly metric: string;
  readonly value?: number;
  readonly truthState?: "known" | "unknown" | "unavailable" | "partial" | "conflicting";
  readonly sourceKind?: "unknown" | "observed" | "provider_reported" | "calculated" | "inferred";
  readonly reportingWindowStart?: string;
  readonly reportingWindowEnd?: string;
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
  readonly attributionConfidence?: MetricConfidence;
  readonly attributionBasis?: "unknown" | "direct_provider" | "declared_assumption";
  readonly attributionEvidenceRefs?: readonly string[];
  readonly assumptionRefs?: readonly string[];
  readonly outcomeRef: string;
  readonly amount?: number;
  readonly currency?: string;
  readonly confidence: MetricConfidence;
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface VerifiedSocialOutcome {
  readonly ref: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly amount: number;
  readonly currency: string;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
  readonly testData: boolean;
}

export interface MetricAssessment {
  readonly metricId: string;
  readonly fresh: boolean;
  readonly confidence: MetricConfidence;
  readonly ageMs: number;
}

export interface SocialPerformanceSnapshot {
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly generatedAt: string;
  readonly metricIds: readonly string[];
  readonly metricEvidence: readonly Readonly<{ metricId: string; state: string; sourceKind: string; fresh: boolean; confidence: MetricConfidence; observedAt: string; sourceRefs: readonly string[] }>[];
  readonly confirmedRevenueAttributionIds: readonly string[];
  readonly estimatedOutcomeIds: readonly string[];
  readonly estimatedAttributionIds: readonly string[];
}

export interface SocialPostingWindowEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly platform: string;
  readonly weekday: number;
  readonly startMinuteLocal: number;
  readonly endMinuteLocal: number;
  readonly timeZone: string;
  readonly basisMetricIds: readonly string[];
  readonly score: number;
  readonly confidence: MetricConfidence;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
}

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicate references`);
  return Object.freeze(normalized);
}

export function validateMetric(metric: SocialMetric): SocialMetric {
  if (!metric.id.trim() || !metric.accountId.trim() || !metric.metric.trim() || !metric.sourceRef.trim()) throw new Error("social metric identity and provenance required");
  if (!Number.isFinite(metric.value) || metric.value < 0) throw new Error("invalid social metric value");
  timestamp(metric.observedAt, "social metric observedAt");
  return Object.freeze({ ...metric });
}

export function validateAttribution(record: AttributionRecord, metrics: readonly SocialMetric[], verifiedOutcomeRefs: readonly string[] = []): AttributionRecord {
  const metricIds = new Set(metrics.map((metric) => metric.id));
  if (!record.sourceMetricIds.length || !record.sourceRefs.length) throw new Error("attribution requires evidence");
  if (!record.sourceMetricIds.every((id) => metricIds.has(id))) throw new Error("attribution references unknown metric");
  if (record.outcomeKind === "revenue") {
    if (record.amount === undefined || !record.currency?.trim()) throw new Error("revenue attribution requires amount and currency");
    if (record.confidence !== "confirmed") throw new Error("estimated attribution cannot be represented as confirmed revenue");
    if (!record.sourceRefs.some((ref) => verifiedOutcomeRefs.includes(ref))) throw new Error("confirmed revenue requires independent verified outcome evidence");
  }
  return Object.freeze({ ...record, sourceMetricIds: Object.freeze([...record.sourceMetricIds]), sourceRefs: Object.freeze([...record.sourceRefs]) });
}

export function validateEvidenceBackedMetric(metric: EvidenceBackedSocialMetric): EvidenceBackedSocialMetric {
  if (!metric.id.trim() || !metric.ownerId.trim() || !metric.brandId.trim() || !metric.accountId.trim() || !metric.metric.trim() || !metric.unit.trim()) throw new Error("evidence-backed social metric identity/account/metric/unit are required");
  const state = metric.truthState ?? "known";
  if (!["known", "unknown", "unavailable", "partial", "conflicting"].includes(state)) throw new Error("unknown metric truth state");
  if (!["confirmed", "estimated"].includes(metric.confidence)) throw new Error("unknown metric confidence");
  if (state === "known" || state === "partial") {
    if (metric.value === undefined || !Number.isFinite(metric.value) || metric.value < 0) throw new Error("known metric requires nonnegative numeric value");
  } else if (metric.value !== undefined) {
    throw new Error("unknown/unavailable/conflicting metric cannot carry a fabricated value");
  }
  if (metric.sourceKind !== undefined && !["unknown", "observed", "provider_reported", "calculated", "inferred"].includes(metric.sourceKind)) throw new Error("unknown metric source kind");
  if (metric.sourceKind === "inferred" && metric.confidence !== "estimated") throw new Error("inferred metric must remain estimated");
  if ((metric.reportingWindowStart === undefined) !== (metric.reportingWindowEnd === undefined)) throw new Error("metric reporting window must be complete");
  if (metric.reportingWindowStart && (timestamp(metric.reportingWindowStart, "window start") > timestamp(metric.reportingWindowEnd!, "window end") || timestamp(metric.reportingWindowEnd!, "window end") > timestamp(metric.observedAt, "observation"))) throw new Error("invalid metric reporting window");
  if (!Number.isSafeInteger(metric.freshnessMaxAgeMs) || metric.freshnessMaxAgeMs < 0) throw new Error("metric freshness policy is invalid");
  if (timestamp(metric.observedAt, "metric observedAt") > timestamp(metric.collectedAt, "metric collectedAt")) throw new Error("metric cannot be collected before observation");
  return Object.freeze({ ...metric, sourceRefs: refs(metric.sourceRefs, "metric source refs") });
}

export function assessMetricFreshness(metric: EvidenceBackedSocialMetric, now: string): MetricAssessment {
  const valid = validateEvidenceBackedMetric(metric);
  const nowMs = timestamp(now, "metric assessment now");
  const collectedAt = timestamp(valid.collectedAt, "metric collectedAt");
  if (collectedAt > nowMs) throw new Error("metric evidence cannot originate in the future");
  const ageMs = nowMs - timestamp(valid.observedAt, "metric observedAt");
  return Object.freeze({ metricId: valid.id, fresh: ageMs <= valid.freshnessMaxAgeMs, confidence: valid.confidence, ageMs });
}

export function validateEvidenceBackedAttribution(record: EvidenceBackedAttribution, metrics: readonly EvidenceBackedSocialMetric[], outcomes: readonly VerifiedSocialOutcome[] = []): EvidenceBackedAttribution {
  if (!record.id.trim() || !record.ownerId.trim() || !record.brandId.trim() || !record.accountId.trim() || !record.outcomeRef.trim()) throw new Error("attribution identity/account/outcome evidence is required");
  if (record.attributionConfidence !== undefined && !["confirmed", "estimated"].includes(record.attributionConfidence)) throw new Error("unknown causal attribution confidence");
  if (record.attributionBasis !== undefined && !["unknown", "direct_provider", "declared_assumption"].includes(record.attributionBasis)) throw new Error("unknown attribution basis");
  if (record.attributionConfidence === "confirmed" && (record.attributionBasis !== "direct_provider" || !record.attributionEvidenceRefs?.length)) throw new Error("confirmed attribution requires direct provider evidence");
  if (record.attributionBasis === "declared_assumption") refs(record.assumptionRefs ?? [], "attribution assumptions");
  timestamp(record.observedAt, "attribution observedAt");
  const sourceMetricIds = refs(record.sourceMetricIds, "attribution source metric ids");
  const sourceRefs = refs(record.sourceRefs, "attribution source refs");
  const byId = new Map<string, EvidenceBackedSocialMetric>();
  for (const metric of metrics) {
    const valid = validateEvidenceBackedMetric(metric);
    const prior = byId.get(valid.id);
    if (prior && prior.observedAt === valid.observedAt && JSON.stringify(prior) !== JSON.stringify(valid)) throw new Error("conflicting metric evidence");
    if (!prior || Date.parse(valid.observedAt) > Date.parse(prior.observedAt)) byId.set(valid.id, valid);
  }
  for (const id of sourceMetricIds) {
    const metric = byId.get(id);
    if (!metric) throw new Error("attribution references unknown metric");
    if (Date.parse(metric.collectedAt) > Date.parse(record.observedAt)) throw new Error("attribution cannot predate metric evidence");
    if (metric.ownerId !== record.ownerId || metric.brandId !== record.brandId || metric.accountId !== record.accountId) throw new Error("attribution cannot cross owner/brand/account boundaries");
  }
  if (record.outcomeKind === "revenue") {
    if (record.amount === undefined || !Number.isFinite(record.amount) || record.amount < 0 || !record.currency?.trim()) throw new Error("revenue attribution requires nonnegative amount and currency");
    if (record.confidence !== "confirmed") throw new Error("estimated attribution cannot be represented as confirmed revenue");
    const outcome = outcomes.find((item) => item.ref === record.outcomeRef && item.ownerId === record.ownerId && item.brandId === record.brandId && item.accountId === record.accountId);
    if (!outcome || outcome.testData !== false || outcome.amount !== record.amount || outcome.currency !== record.currency || !/^[A-Z]{3}$/.test(outcome.currency) || timestamp(outcome.observedAt, "outcome observedAt") > timestamp(record.observedAt, "attribution observedAt")) throw new Error("confirmed revenue requires exact independent non-test outcome evidence");
    refs(outcome.sourceRefs, "verified outcome source refs");
  } else if (record.amount !== undefined || record.currency !== undefined) {
    throw new Error("non-revenue attribution cannot carry monetary amount/currency");
  }
  return Object.freeze({ ...record, sourceMetricIds, sourceRefs, ...(record.attributionEvidenceRefs ? { attributionEvidenceRefs: Object.freeze([...record.attributionEvidenceRefs]) } : {}), ...(record.assumptionRefs ? { assumptionRefs: Object.freeze([...record.assumptionRefs]) } : {}) });
}

export function validatePostingWindowEvidence(window: SocialPostingWindowEvidence, metrics: readonly EvidenceBackedSocialMetric[]): SocialPostingWindowEvidence {
  if (!window.id.trim() || !window.ownerId.trim() || !window.brandId.trim() || !window.accountId.trim() || !window.platform.trim() || !window.timeZone.trim()) throw new Error("posting-window identity and timezone are required");
  if (!Number.isSafeInteger(window.weekday) || window.weekday < 0 || window.weekday > 6) throw new Error("posting-window weekday must be 0-6");
  if (!Number.isSafeInteger(window.startMinuteLocal) || !Number.isSafeInteger(window.endMinuteLocal) || window.startMinuteLocal < 0 || window.endMinuteLocal > 1440 || window.startMinuteLocal >= window.endMinuteLocal) throw new Error("invalid posting-window minute range");
  if (!Number.isFinite(window.score) || window.score < 0) throw new Error("posting-window score must be nonnegative");
  timestamp(window.observedAt, "posting-window observedAt");
  const basis = refs(window.basisMetricIds, "posting-window basis metrics");
  refs(window.sourceRefs, "posting-window source refs");
  const available = new Map(metrics.map((metric) => [metric.id, validateEvidenceBackedMetric(metric)]));
  for (const id of basis) {
    const metric = available.get(id);
    if (!metric || metric.ownerId !== window.ownerId || metric.brandId !== window.brandId || metric.accountId !== window.accountId) throw new Error("posting-window evidence must use scoped social metrics");
  }
  return Object.freeze({ ...window, basisMetricIds: basis, sourceRefs: refs(window.sourceRefs, "posting-window source refs") });
}

export function buildSocialPerformanceSnapshot(metrics: readonly EvidenceBackedSocialMetric[], attributions: readonly EvidenceBackedAttribution[], ownerId: string, brandId: string, accountId: string, now: string, outcomes: readonly VerifiedSocialOutcome[] = []): SocialPerformanceSnapshot {
  timestamp(now, "snapshot generatedAt");
  const current = new Map<string, EvidenceBackedSocialMetric>();
  for (const metric of metrics.filter((item) => item.ownerId === ownerId && item.brandId === brandId && item.accountId === accountId).map(validateEvidenceBackedMetric)) {
    const prior = current.get(metric.id);
    if (prior && prior.observedAt === metric.observedAt && JSON.stringify(prior) !== JSON.stringify(metric)) throw new Error("conflicting metric evidence");
    if (!prior || Date.parse(metric.observedAt) > Date.parse(prior.observedAt)) current.set(metric.id, metric);
  }
  const scopedMetrics = [...current.values()];
  const scopedAttributions = attributions.filter((record) => record.ownerId === ownerId && record.brandId === brandId && record.accountId === accountId).map((record) => {
    if (Date.parse(record.observedAt) > Date.parse(now)) throw new Error("future attribution cannot be current truth");
    return validateEvidenceBackedAttribution(record, scopedMetrics, outcomes);
  });
  const metricEvidence = Object.freeze(scopedMetrics.map((metric) => Object.freeze({ metricId: metric.id, state: metric.truthState ?? "known", sourceKind: metric.sourceKind ?? "unknown", fresh: assessMetricFreshness(metric, now).fresh, confidence: metric.confidence, observedAt: metric.observedAt, sourceRefs: metric.sourceRefs })));
  return Object.freeze({
    ownerId,
    brandId,
    accountId,
    generatedAt: now,
    metricIds: Object.freeze(scopedMetrics.map((metric) => metric.id)),
    metricEvidence,
    confirmedRevenueAttributionIds: Object.freeze(scopedAttributions.filter((record) => record.outcomeKind === "revenue" && record.confidence === "confirmed").map((record) => record.id)),
    estimatedOutcomeIds: Object.freeze(scopedAttributions.filter((record) => record.confidence === "estimated").map((record) => record.id)),
    estimatedAttributionIds: Object.freeze(scopedAttributions.filter((record) => record.attributionConfidence !== "confirmed").map((record) => record.id))
  });
}
