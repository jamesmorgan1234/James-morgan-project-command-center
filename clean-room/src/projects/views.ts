import { parseTimestamp } from "../security/types.js";
import type { ProjectRecord } from "./types.js";
import type { ProjectProgress } from "./progress.js";
import type { WorkReadiness } from "./roadmap.js";

export interface ProjectListItem {
  readonly project: ProjectRecord;
  readonly progress: ProjectProgress;
  readonly nextAction?: string;
}

export function projectsView(items: readonly ProjectListItem[]): readonly ProjectListItem[] {
  return Object.freeze([...items].filter((item) => item.project.lifecycle !== "archived").sort((a, b) => a.project.name.localeCompare(b.project.name)));
}

export interface ExecutorActivity {
  readonly projectId: string;
  readonly runId: string;
  readonly taskId: string;
  readonly status: "queued" | "working" | "blocked" | "completed" | "stopped";
  readonly executorClaimed: boolean;
  readonly lastHeartbeatAt?: string;
  readonly currentTaskTitle?: string;
  readonly blocker?: string;
}

export interface ActiveProjectItem {
  readonly project: ProjectRecord;
  readonly activity: ExecutorActivity;
}

export function activeLiveView(projects: readonly ProjectRecord[], activities: readonly ExecutorActivity[], now: string, staleAfterMs = 120_000): readonly ActiveProjectItem[] {
  const nowMs = parseTimestamp(now, "now");
  const byProject = new Map(projects.map((project) => [project.id, project]));
  const active: ActiveProjectItem[] = [];
  for (const activity of activities) {
    if (activity.status !== "working" || !activity.executorClaimed || !activity.lastHeartbeatAt) continue;
    const heartbeat = parseTimestamp(activity.lastHeartbeatAt, "lastHeartbeatAt");
    if (heartbeat > nowMs || nowMs - heartbeat > staleAfterMs) continue;
    const project = byProject.get(activity.projectId);
    if (!project || ["archived", "superseded", "completed"].includes(project.lifecycle)) continue;
    active.push(Object.freeze({ project, activity }));
  }
  return Object.freeze(active);
}

export interface NextUpCandidate {
  readonly project: ProjectRecord;
  readonly workUnitId: string;
  readonly title: string;
  readonly readiness: WorkReadiness;
  readonly priorityRank: number;
  readonly evidenceRefs: readonly string[];
}

export function nextUpView(candidates: readonly NextUpCandidate[]): readonly NextUpCandidate[] {
  return Object.freeze([...candidates]
    .filter((candidate) => candidate.readiness.ready && candidate.evidenceRefs.length > 0 && !["archived", "superseded", "completed"].includes(candidate.project.lifecycle))
    .sort((a, b) => a.priorityRank - b.priorityRank || a.project.name.localeCompare(b.project.name)));
}
