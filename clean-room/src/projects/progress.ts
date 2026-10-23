import type { ProjectRoadmap } from "./roadmap.js";

export type ProjectProgress =
  | Readonly<{ kind: "percent"; verified: number; applicable: number; percent: number; roadmapVersion: number }>
  | Readonly<{ kind: "na"; label: "N/A"; reason: string; roadmapVersion: number }>;

export function calculateProjectProgress(roadmap: ProjectRoadmap, denominatorTrusted: boolean): ProjectProgress {
  if (!denominatorTrusted) return Object.freeze({ kind: "na", label: "N/A", reason: "roadmap_denominator_untrusted", roadmapVersion: roadmap.version });
  const applicable = roadmap.workUnits.filter((unit) => unit.applicable);
  if (applicable.length === 0) return Object.freeze({ kind: "na", label: "N/A", reason: "no_applicable_work_units", roadmapVersion: roadmap.version });
  const verified = applicable.filter((unit) => unit.status === "verified" || unit.status === "skipped").length;
  return Object.freeze({ kind: "percent", verified, applicable: applicable.length, percent: Math.round((verified / applicable.length) * 100), roadmapVersion: roadmap.version });
}

export interface AgencyRunProgress {
  readonly runId: string;
  readonly completedDurableTasks: number;
  readonly plannedDurableTasks?: number;
}

export function calculateAgencyProgress(run: AgencyRunProgress): Readonly<{ kind: "percent"; percent: number } | { kind: "na"; label: "N/A" }> {
  if (run.plannedDurableTasks === undefined || run.plannedDurableTasks <= 0) return Object.freeze({ kind: "na", label: "N/A" });
  if (run.completedDurableTasks < 0 || run.completedDurableTasks > run.plannedDurableTasks) throw new Error("Invalid Agency progress counts");
  return Object.freeze({ kind: "percent", percent: Math.round((run.completedDurableTasks / run.plannedDurableTasks) * 100) });
}
