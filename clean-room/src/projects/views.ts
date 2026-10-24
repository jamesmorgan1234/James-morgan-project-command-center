import { parseTimestamp } from "../security/types.js";
import type { ProjectRecord, ProjectLifecycle, ProjectPriority, ProjectVerification } from "./types.js";
import type { ProjectProgress } from "./progress.js";
import type { WorkReadiness } from "./roadmap.js";

export interface ProjectListItem {
  readonly project: ProjectRecord;
  readonly progress: ProjectProgress;
  readonly nextAction?: string;
}

export interface ProjectViewFilter {
  readonly query?: string;
  readonly lifecycle?: readonly ProjectLifecycle[];
  readonly priorities?: readonly ProjectPriority[];
  readonly verification?: readonly ProjectVerification[];
  readonly typeKeys?: readonly string[];
  readonly companyIds?: readonly string[];
  readonly includeArchived?: boolean;
}

function normalizedSet(values: readonly string[] | undefined): ReadonlySet<string> | undefined {
  if (!values) return undefined;
  return new Set(values.map((value) => value.trim()).filter(Boolean));
}

export function projectsView(items: readonly ProjectListItem[], filter: ProjectViewFilter = {}): readonly ProjectListItem[] {
  const query = filter.query?.trim().toLocaleLowerCase();
  const lifecycle = normalizedSet(filter.lifecycle);
  const priorities = normalizedSet(filter.priorities);
  const verification = normalizedSet(filter.verification);
  const typeKeys = normalizedSet(filter.typeKeys);
  const companyIds = normalizedSet(filter.companyIds);
  return Object.freeze([...items]
    .filter((item) => filter.includeArchived === true || item.project.lifecycle !== "archived")
    .filter((item) => !query || `${item.project.name}\n${item.project.mission}`.toLocaleLowerCase().includes(query))
    .filter((item) => !lifecycle || lifecycle.has(item.project.lifecycle))
    .filter((item) => !priorities || priorities.has(item.project.priority))
    .filter((item) => !verification || verification.has(item.project.verification))
    .filter((item) => !typeKeys || typeKeys.has(item.project.typeKey))
    .filter((item) => !companyIds || (item.project.companyId ? companyIds.has(item.project.companyId) : false))
    .sort((a, b) => a.project.name.localeCompare(b.project.name)));
}

export type ProjectGroupKey = "type" | "company" | "lifecycle" | "priority";
export interface ProjectGroup {
  readonly key: string;
  readonly items: readonly ProjectListItem[];
}

export function groupProjects(items: readonly ProjectListItem[], groupBy: ProjectGroupKey): readonly ProjectGroup[] {
  const groups = new Map<string, ProjectListItem[]>();
  for (const item of items) {
    const key = groupBy === "type" ? item.project.typeKey
      : groupBy === "company" ? item.project.companyId ?? "company:unassigned"
      : groupBy === "lifecycle" ? item.project.lifecycle
      : item.project.priority;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return Object.freeze([...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => Object.freeze({ key, items: Object.freeze([...values].sort((a, b) => a.project.name.localeCompare(b.project.name))) })));
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
  if (!Number.isFinite(staleAfterMs) || staleAfterMs <= 0) throw new Error("Active/live stale threshold must be positive");
  const nowMs = parseTimestamp(now, "now");
  const byProject = new Map(projects.map((project) => [project.id, project]));
  const freshest = new Map<string, Readonly<{ activity: ExecutorActivity; heartbeat: number }>>();
  for (const activity of activities) {
    if (activity.status !== "working" || !activity.executorClaimed || !activity.lastHeartbeatAt) continue;
    const heartbeat = parseTimestamp(activity.lastHeartbeatAt, "lastHeartbeatAt");
    if (heartbeat > nowMs || nowMs - heartbeat > staleAfterMs) continue;
    const project = byProject.get(activity.projectId);
    if (!project || ["archived", "superseded", "completed"].includes(project.lifecycle)) continue;
    const current = freshest.get(project.id);
    if (!current || heartbeat > current.heartbeat) freshest.set(project.id, Object.freeze({ activity, heartbeat }));
  }
  return Object.freeze([...freshest.entries()]
    .map(([projectId, current]) => Object.freeze({ project: byProject.get(projectId) as ProjectRecord, activity: current.activity }))
    .sort((a, b) => a.project.name.localeCompare(b.project.name)));
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
    .filter((candidate) => Number.isFinite(candidate.priorityRank))
    .filter((candidate) => candidate.readiness.ready && candidate.evidenceRefs.length > 0 && candidate.evidenceRefs.every((ref) => ref.trim().length > 0) && !["archived", "superseded", "completed"].includes(candidate.project.lifecycle))
    .sort((a, b) => a.priorityRank - b.priorityRank || a.project.name.localeCompare(b.project.name) || a.workUnitId.localeCompare(b.workUnitId)));
}
