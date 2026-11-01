/** Executor: task state machine, heartbeat, wake/result, real claim, locks and impact. */

export type TaskState = "pending" | "claimed" | "working" | "done" | "failed";
export type TaskEvent = "claim" | "start" | "finish" | "fail" | "reset";

const TRANSITIONS: Readonly<Record<TaskState, Partial<Record<TaskEvent, TaskState>>>> = Object.freeze({
  pending: { claim: "claimed" },
  claimed: { start: "working", fail: "failed" },
  working: { finish: "done", fail: "failed" },
  done: { reset: "pending" },
  failed: { reset: "pending" }
});

export function taskTransition(state: TaskState, event: TaskEvent): TaskState {
  const next = TRANSITIONS[state][event];
  if (next === undefined) throw new Error(`Invalid task transition: ${state} + ${event}`);
  return next;
}

export function heartbeat(lastSeen: string, now: string, timeoutMs: number): "alive" | "stale" {
  const last = Date.parse(lastSeen);
  const current = Date.parse(now);
  if (Number.isNaN(last) || Number.isNaN(current)) throw new Error("Heartbeat timestamps must be valid");
  return current - last > timeoutMs ? "stale" : "alive";
}

export function wakeContract(reason: string): string {
  if (!reason.trim()) throw new Error("An executor wake requires a reason");
  return reason;
}

export function resultContract(result: { readonly taskId: string; readonly outcome: "done" | "failed" }): string {
  if (!result.taskId.trim()) throw new Error("An executor result requires a task");
  return `${result.taskId}:${result.outcome}`;
}

export function assertRealClaim(claim: { readonly executorId: string } | null): string {
  if (claim === null || !claim.executorId.trim()) throw new Error("Working requires a real executor claim");
  return claim.executorId;
}

export function assertObjectiveLock(change: { readonly objective: string }, locked: string): void {
  if (change.objective !== locked) throw new Error("The objective is hard locked");
}

export function impactRadius(scope: "task" | "project" | "company"): string {
  if (scope !== "task" && scope !== "project" && scope !== "company") throw new Error("Impact radius must be classified");
  return scope;
}
