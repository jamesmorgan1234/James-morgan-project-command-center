export interface RestoreItem {
  readonly id: string;
  readonly kind: string;
  readonly contentHash: string;
  readonly dependencyIds: readonly string[];
}

export interface RestorePlan {
  readonly backupId: string;
  readonly isolatedEnvironment: boolean;
  readonly items: readonly RestoreItem[];
  readonly expectedContentHash: string;
  readonly observedContentHash: string;
}

export function validateRestore(plan: RestorePlan): Readonly<{ restored: number; consistent: true }> {
  if (!plan.isolatedEnvironment) throw new Error("restore must run in isolated recovery environment");
  if (!plan.backupId.trim() || !plan.expectedContentHash.trim() || plan.expectedContentHash !== plan.observedContentHash) throw new Error("restore integrity mismatch");
  const ids = new Set(plan.items.map((item) => item.id));
  for (const item of plan.items) {
    if (!item.id.trim() || !item.kind.trim() || !item.contentHash.trim()) throw new Error("restore item incomplete");
    if (!item.dependencyIds.every((id) => ids.has(id))) throw new Error("restore dependency missing");
  }
  return Object.freeze({ restored: plan.items.length, consistent: true as const });
}
