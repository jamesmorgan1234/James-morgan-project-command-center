import type { AgencyTask } from "./types.js";

export interface ScheduledTask extends AgencyTask {
  readonly priority: number;
  readonly createdSequence: number;
  readonly affinityKeys: readonly string[];
  readonly antiAffinityKeys: readonly string[];
}

export function readyTasks(tasks: readonly ScheduledTask[]): readonly ScheduledTask[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return Object.freeze(tasks.filter((task) => task.state === "pending" || task.state === "ready").filter((task) => task.dependencyIds.every((id) => ["verified", "skipped"].includes(byId.get(id)?.state ?? "missing"))).sort((a, b) => a.priority - b.priority || a.createdSequence - b.createdSequence));
}

export function safeSteal(candidate: ScheduledTask, workerCapabilities: readonly string[], heldAntiAffinity: readonly string[]): boolean {
  if (!workerCapabilities.includes(candidate.capability)) return false;
  if (candidate.antiAffinityKeys.some((key) => heldAntiAffinity.includes(key))) return false;
  return true;
}
