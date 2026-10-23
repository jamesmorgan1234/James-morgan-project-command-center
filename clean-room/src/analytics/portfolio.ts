export interface ProjectDeliveryMetric {
  readonly projectId: string;
  readonly verifiedCompleted: number;
  readonly verifiedTotal: number | null;
  readonly agencyCompleted: number;
  readonly agencyTotal: number | null;
  readonly cycleTimeMs: number | null;
  readonly blockedTimeMs: number;
  readonly ownerWaitTimeMs: number;
  readonly evidenceRefs: readonly string[];
}

export function projectAnalytics(metric: ProjectDeliveryMetric): Readonly<{ projectPercent: number | null; agencyPercent: number | null; cycleTimeMs: number | null; blockedTimeMs: number; ownerWaitTimeMs: number }> {
  if (metric.evidenceRefs.length === 0) throw new Error("project analytics require evidence");
  const percent = (done: number, total: number | null): number | null => total === null || total <= 0 || done < 0 || done > total ? null : Math.round((done / total) * 10000) / 100;
  return Object.freeze({ projectPercent: percent(metric.verifiedCompleted, metric.verifiedTotal), agencyPercent: percent(metric.agencyCompleted, metric.agencyTotal), cycleTimeMs: metric.cycleTimeMs, blockedTimeMs: metric.blockedTimeMs, ownerWaitTimeMs: metric.ownerWaitTimeMs });
}
