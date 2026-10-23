export interface MigrationStep {
  readonly id: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly preconditionRefs: readonly string[];
  readonly backupRef: string;
  readonly rollbackRef: string;
  readonly compatibleFrom: readonly number[];
}

export function dryRunMigration(step: MigrationStep, currentVersion: number): Readonly<{ canApply: boolean; reason: string }> {
  if (step.toVersion <= step.fromVersion || step.preconditionRefs.length === 0 || !step.backupRef.trim() || !step.rollbackRef.trim()) return Object.freeze({ canApply: false, reason: "migration_contract_incomplete" });
  if (currentVersion !== step.fromVersion || !step.compatibleFrom.includes(currentVersion)) return Object.freeze({ canApply: false, reason: "incompatible_source_version" });
  return Object.freeze({ canApply: true, reason: "dry_run_passed" });
}

export function rollbackRequired(result: "applied" | "failed" | "uncertain"): boolean {
  return result !== "applied";
}
