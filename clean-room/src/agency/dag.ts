import type { AgencyTask } from "./types.js";

export interface ScheduledTask extends AgencyTask {
  readonly priority: number;
  readonly createdSequence: number;
  readonly affinityKeys: readonly string[];
  readonly antiAffinityKeys: readonly string[];
}

export interface FairScheduledTask extends ScheduledTask {
  readonly waitRounds: number;
}

export interface DependencyGraphProof {
  readonly taskCount: number;
  readonly edgeCount: number;
  readonly acyclic: true;
}

export function validateDependencyGraph(tasks: readonly ScheduledTask[]): DependencyGraphProof {
  const byId = new Map<string, ScheduledTask>();
  let edgeCount = 0;
  for (const task of tasks) {
    if (!task.id.trim()) throw new Error("Dependency graph task id is required");
    if (byId.has(task.id)) throw new Error(`Duplicate dependency graph task id: ${task.id}`);
    byId.set(task.id, task);
    edgeCount += task.dependencyIds.length;
  }

  for (const task of tasks) {
    for (const dependencyId of task.dependencyIds) {
      const dependency = byId.get(dependencyId);
      if (!dependency) throw new Error(`Missing dependency task: ${dependencyId}`);
      if (dependency.projectId !== task.projectId || dependency.runId !== task.runId) throw new Error(`Dependency must stay in same project/run: ${task.id} -> ${dependencyId}`);
    }
  }

  const state = new Map<string, 0 | 1 | 2>();
  const visit = (taskId: string, path: readonly string[]): void => {
    const current = state.get(taskId) ?? 0;
    if (current === 2) return;
    if (current === 1) throw new Error(`Dependency cycle detected: ${[...path, taskId].join(" -> ")}`);
    state.set(taskId, 1);
    const task = byId.get(taskId)!;
    for (const dependencyId of task.dependencyIds) visit(dependencyId, [...path, taskId]);
    state.set(taskId, 2);
  };
  for (const task of tasks) visit(task.id, []);
  return Object.freeze({ taskCount: tasks.length, edgeCount, acyclic: true as const });
}

export function readyTasks(tasks: readonly ScheduledTask[]): readonly ScheduledTask[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return Object.freeze(tasks.filter((task) => task.state === "pending" || task.state === "ready").filter((task) => task.dependencyIds.every((id) => ["verified", "skipped"].includes(byId.get(id)?.state ?? "missing"))).sort((a, b) => a.priority - b.priority || a.createdSequence - b.createdSequence));
}

export function fairReadyTasks(tasks: readonly FairScheduledTask[], starvationThresholdRounds: number): readonly FairScheduledTask[] {
  if (!Number.isSafeInteger(starvationThresholdRounds) || starvationThresholdRounds < 1) throw new Error("starvationThresholdRounds must be a positive safe integer");
  validateDependencyGraph(tasks);
  for (const task of tasks) if (!Number.isSafeInteger(task.waitRounds) || task.waitRounds < 0 || task.waitRounds > starvationThresholdRounds) throw new Error(`Invalid bounded waitRounds for ${task.id}`);
  const readyIds = new Set(readyTasks(tasks).map((task) => task.id));
  return Object.freeze(tasks.filter((task) => readyIds.has(task.id)).sort((a, b) => {
    const aStarved = a.waitRounds >= starvationThresholdRounds;
    const bStarved = b.waitRounds >= starvationThresholdRounds;
    if (aStarved !== bStarved) return aStarved ? -1 : 1;
    if (aStarved && bStarved) return a.createdSequence - b.createdSequence || a.priority - b.priority || a.id.localeCompare(b.id);
    return a.priority - b.priority || a.createdSequence - b.createdSequence || a.id.localeCompare(b.id);
  }));
}

export function advanceSchedulingRound(tasks: readonly FairScheduledTask[], selectedTaskIds: readonly string[], starvationThresholdRounds: number): readonly FairScheduledTask[] {
  if (!Number.isSafeInteger(starvationThresholdRounds) || starvationThresholdRounds < 1) throw new Error("starvationThresholdRounds must be a positive safe integer");
  validateDependencyGraph(tasks);
  if (new Set(selectedTaskIds).size !== selectedTaskIds.length) throw new Error("Selected task ids must be unique");
  const selected = new Set(selectedTaskIds);
  const ready = new Set(readyTasks(tasks).map((task) => task.id));
  for (const id of selected) if (!ready.has(id)) throw new Error(`Selected task is not ready: ${id}`);
  return Object.freeze(tasks.map((task) => Object.freeze({
    ...task,
    waitRounds: selected.has(task.id) ? 0 : ready.has(task.id) ? Math.min(starvationThresholdRounds, task.waitRounds + 1) : task.waitRounds
  })));
}

export function safeSteal(candidate: ScheduledTask, workerCapabilities: readonly string[], heldAntiAffinity: readonly string[]): boolean {
  if (!workerCapabilities.includes(candidate.capability)) return false;
  if (candidate.antiAffinityKeys.some((key) => heldAntiAffinity.includes(key))) return false;
  return true;
}
