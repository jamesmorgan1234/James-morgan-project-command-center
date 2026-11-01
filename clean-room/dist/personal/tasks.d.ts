export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskState = "open" | "completed" | "cancelled";
export type TaskOccurrenceState = "reserved" | "completed" | "cancelled";
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
export interface TaskOccurrenceReservation {
    readonly taskId: string;
    readonly occurrenceKey: string;
    readonly scheduledFor: string;
    readonly evidenceRefs: readonly string[];
    readonly idempotencyKey?: string;
    readonly agencyExecutionRef?: string;
    readonly pifTraceRef?: string;
}
export interface TaskOccurrence extends TaskOccurrenceReservation {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly idempotencyKey: string;
    readonly state: TaskOccurrenceState;
}
export interface TaskCompletion {
    readonly taskId: string;
    readonly occurrenceKey: string;
    readonly completedAt: string;
    readonly evidenceRefs: readonly string[];
    /** Must equal the canonical task-occurrence key when supplied by Agency/external persistence. */
    readonly idempotencyKey?: string;
    /** Canonical Agency step/run reference when execution was performed by Agency. */
    readonly agencyExecutionRef?: string;
    /** PIF trace pointer for the decision/evidence chain; never a raw payload. */
    readonly pifTraceRef?: string;
}
export interface DurableTaskCompletion extends TaskCompletion {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly idempotencyKey: string;
}
export interface TaskPersistenceSnapshot {
    readonly schemaVersion: "cc-personal-tasks-v1";
    readonly tasks: readonly PersonalTask[];
    readonly occurrences: readonly TaskOccurrence[];
    readonly completions: readonly DurableTaskCompletion[];
}
export interface TaskSearchRequest {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly states?: readonly TaskState[];
    readonly priorities?: readonly TaskPriority[];
    readonly query?: string;
}
/**
 * Canonical occurrence identity shared with Agency's idempotency field. Personal Ops does not
 * schedule or execute work; when Agency executes a task occurrence it uses this exact key.
 */
export declare function taskOccurrenceIdempotencyKey(ownerId: string, taskId: string, occurrenceKey: string): string;
export declare class TaskLedger {
    #private;
    static rehydrate(snapshot: TaskPersistenceSnapshot): TaskLedger;
    register(task: PersonalTask): void;
    reserveOccurrence(input: TaskOccurrenceReservation): TaskOccurrence;
    complete(input: TaskCompletion): DurableTaskCompletion;
    exportSnapshot(): TaskPersistenceSnapshot;
    hasCompletedOccurrence(taskId: string, occurrenceKey: string): boolean;
    get(id: string): PersonalTask | undefined;
    list(): readonly PersonalTask[];
    occurrences(taskId?: string): readonly TaskOccurrence[];
    completionHistory(taskId?: string): readonly DurableTaskCompletion[];
    search(request: TaskSearchRequest): readonly PersonalTask[];
}
