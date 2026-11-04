/** Evidence-scoped revenue projection for the owner-only Home card.
 * These rows are recorded checkpoints, not live provider receipts or a
 * complete portfolio total. Never convert an absent record into zero. */
export interface RecordedRevenueSummary {
  readonly amountUsd: number;
  readonly projectCount: number;
  readonly latestObservedAt: string;
  readonly basis: "verified_recorded_projects";
}

export function summarizeRecordedRevenue(rows: readonly Record<string, unknown>[]): RecordedRevenueSummary | undefined {
  const latestByProject = new Map<string, { cents: number; at: string; when: number }>();
  for (const row of rows) {
    if (row.verified !== true || row.metric_key !== "verified_revenue_usd" || row.currency !== "USD") continue;
    const project = typeof row.project_id === "string" ? row.project_id.trim() : "";
    const at = typeof row.observed_at === "string" ? row.observed_at.trim() : "";
    const when = Date.parse(at);
    const value = typeof row.value_numeric === "number" ? row.value_numeric
      : typeof row.value_numeric === "string" && row.value_numeric.trim() ? Number(row.value_numeric) : Number.NaN;
    const cents = Math.round(value * 100);
    if (!project || !at || !Number.isFinite(when) || !Number.isSafeInteger(cents)) continue;
    const previous = latestByProject.get(project);
    if (!previous || when > previous.when) latestByProject.set(project, { cents, at, when });
  }
  if (latestByProject.size === 0) return undefined;
  const rowsByProject = [...latestByProject.values()];
  const totalCents = rowsByProject.reduce((total, row) => total + row.cents, 0);
  if (!Number.isSafeInteger(totalCents)) return undefined;
  const newest = rowsByProject.reduce((mostRecent, row) => row.when > mostRecent.when ? row : mostRecent);
  return Object.freeze({
    amountUsd: totalCents / 100,
    projectCount: rowsByProject.length,
    latestObservedAt: newest.at,
    basis: "verified_recorded_projects" as const
  });
}
