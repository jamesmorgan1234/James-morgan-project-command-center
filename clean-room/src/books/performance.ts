export type RevenueTruth = "projected" | "confirmed" | "settled";

export interface BookPerformanceMetric {
  readonly id: string;
  readonly bookId: string;
  readonly format: string;
  readonly metric: "sales" | "royalties" | "returns" | "read_through";
  readonly value: number;
  readonly currency: string | null;
  readonly truth: RevenueTruth;
  readonly sourceRef: string;
  readonly observedAt: string;
}

export function reconcileBookMetrics(metrics: readonly BookPerformanceMetric[]): readonly BookPerformanceMetric[] {
  const ids = new Set<string>();
  const result: BookPerformanceMetric[] = [];
  for (const metric of metrics) {
    if (ids.has(metric.id)) continue;
    if (!metric.bookId.trim() || !metric.format.trim() || !metric.sourceRef.trim() || !metric.observedAt.includes("T") || !Number.isFinite(metric.value)) throw new Error("invalid book performance metric");
    if ((metric.metric === "royalties") && !metric.currency?.trim()) throw new Error("royalty metric requires currency");
    ids.add(metric.id);
    result.push(Object.freeze({ ...metric }));
  }
  return Object.freeze(result);
}

export interface EvidenceBackedBookPerformanceMetric {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly format: string;
  readonly metric: "sales" | "royalties" | "returns" | "read_through";
  readonly value: number;
  readonly currency?: string | undefined;
  readonly truth: RevenueTruth;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
  readonly providerRecordRef: string;
  readonly settlementRef?: string | undefined;
}

export interface BookPerformanceReconciliation {
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly format: string;
  readonly metric: EvidenceBackedBookPerformanceMetric["metric"];
  readonly projected: number;
  readonly confirmed: number;
  readonly settled: number;
  readonly currency?: string | undefined;
  readonly latestObservedAt: string;
  readonly metricIds: readonly string[];
}

export interface BookPerformanceSummary {
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly confirmedSales: number;
  readonly confirmedReturns: number;
  readonly settledRoyalties: number;
  readonly royaltyCurrency?: string | undefined;
  readonly projectedRoyaltyMetricIds: readonly string[];
  readonly confirmedMetricIds: readonly string[];
  readonly settledMetricIds: readonly string[];
}

function performanceTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function performanceRefs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export function validateEvidenceBackedBookMetric(metric: EvidenceBackedBookPerformanceMetric): EvidenceBackedBookPerformanceMetric {
  if (!metric.id.trim() || !metric.ownerId.trim() || !metric.projectId.trim() || !metric.bookId.trim() || !metric.format.trim() || !metric.providerRecordRef.trim()) throw new Error("book performance metric identity/scope/provider record are required");
  if (!Number.isFinite(metric.value) || metric.value < 0) throw new Error("book performance metric value must be nonnegative");
  const periodStart = performanceTimestamp(metric.periodStart, "book performance periodStart");
  const periodEnd = performanceTimestamp(metric.periodEnd, "book performance periodEnd");
  const observedAt = performanceTimestamp(metric.observedAt, "book performance observedAt");
  if (periodEnd < periodStart) throw new Error("book performance period cannot end before it starts");
  if (observedAt < periodEnd) throw new Error("book performance cannot be observed before period end");
  const sourceRefs = performanceRefs(metric.sourceRefs, "book performance source refs");
  if (metric.metric === "royalties") {
    if (!metric.currency?.trim()) throw new Error("royalty metric requires currency");
    if (metric.truth === "settled" && !metric.settlementRef?.trim()) throw new Error("settled royalty metric requires settlement evidence");
  } else if (metric.currency !== undefined) {
    throw new Error("non-royalty performance metric cannot carry currency");
  }
  if (metric.truth !== "settled" && metric.settlementRef !== undefined) throw new Error("settlement evidence is only valid for settled truth");
  return Object.freeze({ ...metric, sourceRefs });
}

export function reconcileEvidenceBackedBookMetrics(metrics: readonly EvidenceBackedBookPerformanceMetric[]): readonly BookPerformanceReconciliation[] {
  const byId = new Map<string, EvidenceBackedBookPerformanceMetric>();
  for (const metric of metrics) {
    const valid = validateEvidenceBackedBookMetric(metric);
    const prior = byId.get(valid.id);
    if (prior) {
      if (JSON.stringify(prior) !== JSON.stringify(valid)) throw new Error("duplicate book performance metric id has conflicting evidence");
      continue;
    }
    byId.set(valid.id, valid);
  }
  const groups = new Map<string, EvidenceBackedBookPerformanceMetric[]>();
  for (const metric of byId.values()) {
    const key = `${metric.ownerId}:${metric.projectId}:${metric.bookId}:${metric.format}:${metric.metric}:${metric.metric === "royalties" ? metric.currency : "unitless"}`;
    const group = groups.get(key) ?? [];
    group.push(metric);
    groups.set(key, group);
  }
  const output: BookPerformanceReconciliation[] = [];
  for (const group of groups.values()) {
    const first = group[0]!;
    const sum = (truth: RevenueTruth) => group.filter((item) => item.truth === truth).reduce((total, item) => total + item.value, 0);
    const latestObservedAt = group.reduce((latest, item) => performanceTimestamp(item.observedAt, "book performance observedAt") > performanceTimestamp(latest, "latest observedAt") ? item.observedAt : latest, first.observedAt);
    output.push(Object.freeze({ ownerId: first.ownerId, projectId: first.projectId, bookId: first.bookId, format: first.format, metric: first.metric, projected: sum("projected"), confirmed: sum("confirmed"), settled: sum("settled"), currency: first.currency, latestObservedAt, metricIds: Object.freeze(group.map((item) => item.id)) }));
  }
  return Object.freeze(output);
}

export function summarizeBookPerformance(metrics: readonly EvidenceBackedBookPerformanceMetric[], ownerId: string, projectId: string, bookId: string): BookPerformanceSummary {
  const scoped = metrics.map(validateEvidenceBackedBookMetric).filter((item) => item.ownerId === ownerId && item.projectId === projectId && item.bookId === bookId);
  const confirmedSales = scoped.filter((item) => item.metric === "sales" && (item.truth === "confirmed" || item.truth === "settled")).reduce((sum, item) => sum + item.value, 0);
  const confirmedReturns = scoped.filter((item) => item.metric === "returns" && (item.truth === "confirmed" || item.truth === "settled")).reduce((sum, item) => sum + item.value, 0);
  const settledRoyaltyMetrics = scoped.filter((item) => item.metric === "royalties" && item.truth === "settled");
  const currencies = new Set(settledRoyaltyMetrics.map((item) => item.currency));
  if (currencies.size > 1) throw new Error("book performance summary cannot combine settled royalties across currencies");
  return Object.freeze({ ownerId, projectId, bookId, confirmedSales, confirmedReturns, settledRoyalties: settledRoyaltyMetrics.reduce((sum, item) => sum + item.value, 0), royaltyCurrency: settledRoyaltyMetrics[0]?.currency, projectedRoyaltyMetricIds: Object.freeze(scoped.filter((item) => item.metric === "royalties" && item.truth === "projected").map((item) => item.id)), confirmedMetricIds: Object.freeze(scoped.filter((item) => item.truth === "confirmed").map((item) => item.id)), settledMetricIds: Object.freeze(scoped.filter((item) => item.truth === "settled").map((item) => item.id)) });
}
