/** Brain surface: portfolio context, roadmap comparison, compliance scan and guarded routing. */

export function buildPortfolioContext(projects: readonly { readonly id: string; readonly scope: string }[], scope: string): readonly string[] {
  if (!scope.trim()) throw new Error("Context requires a portfolio scope");
  const ids = projects.filter((project) => project.scope === scope).map((project) => project.id);
  if (ids.length === 0) throw new Error("Portfolio-scoped context cannot be empty");
  return Object.freeze(ids);
}

export function roadmapComparison(planned: readonly string[], actual: readonly string[]): { readonly onTrack: readonly string[]; readonly behind: readonly string[] } {
  const delivered = new Set(actual);
  const onTrack = planned.filter((item) => delivered.has(item));
  const behind = planned.filter((item) => !delivered.has(item));
  return Object.freeze({ onTrack: Object.freeze(onTrack), behind: Object.freeze(behind) });
}

export function complianceScan(requirements: readonly { readonly id: string; readonly met: boolean }[]): { readonly met: number; readonly missing: readonly string[] } {
  if (requirements.length === 0) throw new Error("A compliance scan requires requirements");
  const missing = requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.id);
  return Object.freeze({ met: requirements.length - missing.length, missing: Object.freeze(missing) });
}

export function routeProtectedAction(action: { readonly protected: boolean }, viaSecurity: boolean): string {
  if (action.protected && !viaSecurity) throw new Error("Protected actions must route through Security");
  return viaSecurity ? "security" : "direct";
}

export function assertNoSuggestionBypass(path: { readonly to: string; readonly approved: boolean }): void {
  if (path.to === "agent" && !path.approved) throw new Error("No hidden suggestion-to-Agent bypass");
}

export function actionPreview(action: { readonly consequential: boolean; readonly previewed: boolean }): void {
  if (action.consequential && !action.previewed) throw new Error("Consequential actions require a preview");
}
