import { parseTimestamp } from "../security/types.js";

export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskState = "open" | "completed" | "cancelled";

export interface PersonalTask {
  readonly id: string;
  readonly ownerId: string;
  readonly title: string;
  readonly priority: TaskPriority;
  readonly state: TaskState;
  readonly dueAt?: string;
  readonly recurrenceKey?: string;
  readonly projectId?: string;
  readonly sourceRefs: readonly string[];
  readonly version: number;
}

export interface TaskCompletion {
  readonly taskId: string;
  readonly occurrenceKey: string;
  readonly completedAt: string;
  readonly evidenceRefs: readonly string[];
}

export class TaskLedger {
  readonly #tasks = new Map<string, PersonalTask>();
  readonly #completions = new Map<string, TaskCompletion>();

  register(task: PersonalTask): void {
    if (!task.id.trim() || !task.ownerId.trim() || !task.title.trim()) throw new Error("Task identity/owner/title are required");
    if (!Number.isSafeInteger(task.version) || task.version !== 1) throw new Error("New task must start at version 1");
    if (task.sourceRefs.length === 0) throw new Error("Task requires provenance");
    if (task.dueAt) parseTimestamp(task.dueAt, "dueAt");
    if (this.#tasks.has(task.id)) throw new Error(`Task already exists: ${task.id}`);
    this.#tasks.set(task.id, Object.freeze({ ...task, sourceRefs: Object.freeze([...task.sourceRefs]) }));
  }

  complete(completion: TaskCompletion): void {
    const task = this.#tasks.get(completion.taskId);
    if (!task) throw new Error(`Unknown task: ${completion.taskId}`);
    if (task.state === "cancelled") throw new Error("Cancelled task cannot be completed");
    if (!completion.occurrenceKey.trim()) throw new Error("Completion occurrenceKey is required");
    parseTimestamp(completion.completedAt, "completedAt");
    if (completion.evidenceRefs.length === 0) throw new Error("Task completion requires evidence");
    const key = `${completion.taskId}:${completion.occurrenceKey}`;
    if (this.#completions.has(key)) throw new Error(`Duplicate task occurrence completion: ${key}`);
    this.#completions.set(key, Object.freeze({ ...completion, evidenceRefs: Object.freeze([...completion.evidenceRefs]) }));
  }

  hasCompletedOccurrence(taskId: string, occurrenceKey: string): boolean { return this.#completions.has(`${taskId}:${occurrenceKey}`); }
  get(id: string): PersonalTask | undefined { return this.#tasks.get(id); }
  list(): readonly PersonalTask[] { return Object.freeze([...this.#tasks.values()]); }
}
