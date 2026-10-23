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
