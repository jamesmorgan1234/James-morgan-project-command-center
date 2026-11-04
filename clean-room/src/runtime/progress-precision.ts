/** Precise, evidence-gated canonical work-unit progress. The caller must
 * separately prove that the full roadmap denominator is trusted. */
export function verifiedWorkUnitPercent(units: readonly Readonly<{ applicable: unknown; status: unknown }>[]): number | undefined {
  const applicable = units.filter((unit) => unit.applicable === true);
  if (applicable.length === 0) return undefined;
  const complete = applicable.filter((unit) => unit.status === "verified" || unit.status === "skipped").length;
  return Math.round((complete * 10000) / applicable.length) / 100;
}
export function formatProgressPercent(percent: number): string {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error("Progress percentage is out of range");
  return `${Number(percent.toFixed(2))}%`;
}
