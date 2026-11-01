/** Run resumption: trustworthy plans, evidence-linked progress and no recreation. */

export function assertTrustworthyPlan(plan: { readonly tasks: readonly { readonly verified: boolean }[] }): void {
  if (plan.tasks.length === 0) throw new Error("A plan requires tasks");
  if (!plan.tasks.every((task) => task.verified)) throw new Error("Only verified tasks form a trustworthy plan");
}

export function taskWeight(task: { readonly weight: number | null }): number {
  if (task.weight === null) throw new Error("Task weights exist only where legitimately defined");
  if (!Number.isFinite(task.weight) || task.weight <= 0) throw new Error("A task weight must be positive");
  return task.weight;
}

export function linkProgressToEvidence(progress: { readonly evidenceIds: readonly string[] }): void {
  if (progress.evidenceIds.length === 0) throw new Error("Roadmap progress must link to evidence");
}

export function checkpointReverify(downstream: readonly { readonly id: string }[]): readonly string[] {
  return Object.freeze(downstream.map((item) => item.id));
}

export function resumeSameRun(runId: string, blockerTaskId: string): { readonly runId: string; readonly resumeAt: string } {
  if (!runId.trim() || !blockerTaskId.trim()) throw new Error("Resumption requires a run and a blocker");
  return Object.freeze({ runId, resumeAt: blockerTaskId });
}

export function assertNoRunRecreation(before: string, after: string): void {
  if (before !== after) throw new Error("The same run must resume after verification");
}

export function assertNoProjectSwitch(before: string, after: string): void {
  if (before !== after) throw new Error("No project switching after a blocker");
}

export function smallestBlockedOperation(tasks: readonly { readonly id: string; readonly size: number }[]): string {
  if (tasks.length === 0) throw new Error("A blocked operation requires tasks");
  return [...tasks].sort((a, b) => a.size - b.size)[0]?.id as string;
}
