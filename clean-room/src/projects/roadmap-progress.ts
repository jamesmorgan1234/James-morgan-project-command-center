/** Roadmap progress: plan versioning, expansion, diffs and honest percentages. */

export function planVersion(version: number): number {
  if (!Number.isSafeInteger(version) || version < 1) throw new Error("A plan version must be a positive integer");
  return version;
}

export function expandPlan(plan: { readonly units: readonly string[]; readonly version: number }, added: readonly string[]): { readonly units: readonly string[]; readonly version: number } {
  if (added.length === 0) throw new Error("Expansion requires at least one unit");
  if (added.some((unit) => plan.units.includes(unit))) throw new Error("Expansion cannot duplicate existing units");
  return Object.freeze({ units: Object.freeze([...plan.units, ...added]), version: planVersion(plan.version + 1) });
}

export function planDiff(before: readonly string[], after: readonly string[]): { readonly added: readonly string[]; readonly removed: readonly string[] } {
  return Object.freeze({
    added: Object.freeze(after.filter((unit) => !before.includes(unit))),
    removed: Object.freeze(before.filter((unit) => !after.includes(unit)))
  });
}

export function percentageAfterExpansion(before: number, after: number): number {
  if (before < 0 || after < 0 || before > 100 || after > 100) throw new Error("Percentages are bounded to 0..100");
  if (after > before) throw new Error("Plan expansion can decrease, never inflate, the percentage");
  return after;
}

export function barrierSweep(count: number, done: number): { readonly count: number; readonly done: number; readonly percentage: number } {
  if (count < 0 || done < 0 || done > count) throw new Error("Sweep counts must be consistent");
  return Object.freeze({ count, done, percentage: count === 0 ? 0 : Math.round((done / count) * 100) });
}

export function rejectTimeBasedProgress(elapsedMs: number, percentage: number): void {
  if (elapsedMs > 0 && percentage > 0) throw new Error("Progress cannot be derived from elapsed time");
}

export function rejectStatusBasedProgress(percentage: number): void {
  if (percentage > 0) throw new Error("Progress cannot be derived from status alone");
}

export function progressExplanation(units: readonly { readonly id: string; readonly done: boolean }[]): string {
  if (units.length === 0) throw new Error("Progress requires units");
  const remaining = units.filter((unit) => !unit.done).map((unit) => unit.id);
  return remaining.length === 0 ? "complete" : `remaining:${remaining.join(",")}`;
}
