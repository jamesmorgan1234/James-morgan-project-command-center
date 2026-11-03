export type RuntimeBookMetricKind = "royalties" | "sales" | "pages_read";
export interface RuntimeBookMetric {
  readonly id: string; readonly kind: RuntimeBookMetricKind; readonly value: number;
  readonly currency?: string; readonly observedAt: string; readonly source: string;
}
type Row = Readonly<Record<string,unknown>>;
const text = (v: unknown): string | undefined => typeof v === "string" && v.trim() ? v.trim() : undefined;
const value = (v: unknown): number | undefined => { const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN; return Number.isFinite(n) && n >= 0 ? n : undefined; };
/** Cumulative owner reports are snapshots, never transactions to sum over time. */
export function latestOwnerBookMetrics(rows: readonly Row[], scope: Readonly<{ownerId:string;projectId:string;bookId:string}>): readonly RuntimeBookMetric[] {
  const latest = new Map<RuntimeBookMetricKind,RuntimeBookMetric>();
  const seen = new Set<RuntimeBookMetricKind>();
  for (const row of [...rows].sort((a,b) => String(b.source_date).localeCompare(String(a.source_date)) || String(b.observed_at).localeCompare(String(a.observed_at)))) {
    if (row.owner_id !== scope.ownerId || row.project_id !== scope.projectId || row.book_id !== scope.bookId || row.provider_key !== "owner_report" || row.edition !== "current" || row.format !== "all_formats" || row.truth !== "confirmed") continue;
    if (!["royalties","sales","pages_read"].includes(String(row.metric))) continue;
    const kind = row.metric as RuntimeBookMetricKind, numeric = value(row.value), id = text(row.metric_id), observedAt = text(row.source_date), source = text(row.source);
    if (seen.has(kind) || !id || !observedAt || !Number.isFinite(Date.parse(observedAt)) || !source || !Array.isArray(row.source_refs) || !row.source_refs.length || !row.source_refs.every(ref => typeof ref === "string" && ref.trim() !== "")) continue;
    seen.add(kind);
    if (numeric === undefined) continue;
    if (kind !== "royalties" && !Number.isSafeInteger(numeric)) continue;
    const currency = text(row.currency); if (kind === "royalties" && !currency) continue;
    latest.set(kind,Object.freeze({id,kind,value:numeric,...(currency ? {currency} : {}),observedAt,source}));
  }
  return Object.freeze([...latest.values()]);
}
export function completeOwnerBookTotals(books: readonly Readonly<{performance?:readonly RuntimeBookMetric[]}>[]): Readonly<{royalties:number;sales:number;pagesRead:number;currency:string}> | undefined {
  if (!books.length) return undefined;
  let royalties = 0, sales = 0, pagesRead = 0, currency: string | undefined;
  for (const book of books) {
    const r = book.performance?.find(m=>m.kind==="royalties"),s=book.performance?.find(m=>m.kind==="sales"),p=book.performance?.find(m=>m.kind==="pages_read");
    if (!r || !s || !p || !r.currency || (currency && currency!==r.currency)) return undefined;
    currency=r.currency; royalties+=r.value; sales+=s.value; pagesRead+=p.value;
  }
  return Object.freeze({royalties:Math.round(royalties*100)/100,sales,pagesRead,currency:currency!});
}
