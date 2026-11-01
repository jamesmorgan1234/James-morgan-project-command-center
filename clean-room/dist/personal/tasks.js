import { parseTimestamp } from "../security/types.js";
function uniqueNonBlank(values, label, requireOne = false) {
    if (requireOne && values.length === 0)
        throw new Error(`${label} requires at least one value`);
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => !value) || new Set(normalized).size !== normalized.length)
        throw new Error(`${label} must be unique and nonblank`);
    return Object.freeze(normalized);
}
function mergedEvidence(values, label) {
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => !value))
        throw new Error(`${label} must be nonblank`);
    const merged = [...new Set(normalized)];
    if (merged.length === 0)
        throw new Error(`${label} requires at least one value`);
    return Object.freeze(merged);
}
function required(value, label) {
    const normalized = value.trim();
    if (!normalized)
        throw new Error(`${label} is required`);
    return normalized;
}
/**
 * Canonical occurrence identity shared with Agency's idempotency field. Personal Ops does not
 * schedule or execute work; when Agency executes a task occurrence it uses this exact key.
 */
export function taskOccurrenceIdempotencyKey(ownerId, taskId, occurrenceKey) {
    return `personal-task:${encodeURIComponent(required(ownerId, "Task owner"))}:${encodeURIComponent(required(taskId, "Task id"))}:${encodeURIComponent(required(occurrenceKey, "Task occurrenceKey"))}`;
}
function validateTask(task) {
    if (!task.id.trim() || !task.ownerId.trim() || !task.title.trim())
        throw new Error("Task identity/owner/title are required");
    if (!Number.isSafeInteger(task.version) || task.version < 1)
        throw new Error("Task version must be a positive integer");
    if (task.dueAt)
        parseTimestamp(task.dueAt, "dueAt");
    if (task.recurrenceKey !== undefined && !task.recurrenceKey.trim())
        throw new Error("Task recurrenceKey must be nonblank when supplied");
    if (task.projectId !== undefined && !task.projectId.trim())
        throw new Error("Task projectId must be nonblank when supplied");
    return Object.freeze({ ...task, sourceRefs: uniqueNonBlank(task.sourceRefs, "Task provenance", true) });
}
function validateOptionalRef(value, label) {
    if (value !== undefined && !value.trim())
        throw new Error(`${label} must be nonblank when supplied`);
}
export class TaskLedger {
    #tasks = new Map();
    #occurrences = new Map();
    #completions = new Map();
    #idempotencyKeys = new Set();
    static rehydrate(snapshot) {
        if (snapshot.schemaVersion !== "cc-personal-tasks-v1")
            throw new Error("Unsupported task persistence snapshot");
        const ledger = new TaskLedger();
        for (const task of snapshot.tasks)
            ledger.#restoreTask(task);
        for (const occurrence of snapshot.occurrences)
            ledger.#restoreOccurrence(occurrence);
        for (const completion of snapshot.completions)
            ledger.#restoreCompletion(completion);
        return ledger;
    }
    register(task) {
        if (task.version !== 1)
            throw new Error("New task must start at version 1");
        this.#restoreTask(task);
    }
    reserveOccurrence(input) {
        const task = this.#tasks.get(input.taskId);
        if (!task)
            throw new Error(`Unknown task: ${input.taskId}`);
        if (task.state !== "open")
            throw new Error("Only open tasks can reserve occurrences");
        const occurrenceKey = required(input.occurrenceKey, "Task occurrenceKey");
        parseTimestamp(input.scheduledFor, "scheduledFor");
        validateOptionalRef(input.agencyExecutionRef, "Agency execution reference");
        validateOptionalRef(input.pifTraceRef, "PIF trace reference");
        const idempotencyKey = taskOccurrenceIdempotencyKey(task.ownerId, task.id, occurrenceKey);
        if (input.idempotencyKey !== undefined && input.idempotencyKey !== idempotencyKey)
            throw new Error("Task occurrence idempotency key does not match canonical Agency-compatible identity");
        const occurrence = Object.freeze({
            ...input,
            occurrenceKey,
            ownerId: task.ownerId,
            ...(task.projectId !== undefined ? { projectId: task.projectId } : {}),
            idempotencyKey,
            state: "reserved",
            evidenceRefs: uniqueNonBlank(input.evidenceRefs, "Task occurrence evidence", true)
        });
        this.#restoreOccurrence(occurrence);
        return occurrence;
    }
    complete(input) {
        const task = this.#tasks.get(input.taskId);
        if (!task)
            throw new Error(`Unknown task: ${input.taskId}`);
        if (task.state === "cancelled")
            throw new Error("Cancelled task cannot be completed");
        const occurrenceKey = required(input.occurrenceKey, "Completion occurrenceKey");
        parseTimestamp(input.completedAt, "completedAt");
        const evidenceRefs = uniqueNonBlank(input.evidenceRefs, "Task completion evidence", true);
        validateOptionalRef(input.agencyExecutionRef, "Agency execution reference");
        validateOptionalRef(input.pifTraceRef, "PIF trace reference");
        const idempotencyKey = taskOccurrenceIdempotencyKey(task.ownerId, task.id, occurrenceKey);
        if (input.idempotencyKey !== undefined && input.idempotencyKey !== idempotencyKey)
            throw new Error("Task occurrence idempotency key does not match canonical Agency-compatible identity");
        const occurrenceMapKey = `${task.id}:${occurrenceKey}`;
        let occurrence = this.#occurrences.get(occurrenceMapKey);
        if (!occurrence) {
            occurrence = this.reserveOccurrence({
                taskId: task.id,
                occurrenceKey,
                scheduledFor: input.completedAt,
                evidenceRefs,
                idempotencyKey,
                ...(input.agencyExecutionRef !== undefined ? { agencyExecutionRef: input.agencyExecutionRef } : {}),
                ...(input.pifTraceRef !== undefined ? { pifTraceRef: input.pifTraceRef } : {})
            });
        }
        if (occurrence.state === "completed")
            throw new Error(`Duplicate task occurrence completion: ${occurrenceMapKey}`);
        if (occurrence.state === "cancelled")
            throw new Error("Cancelled task occurrence cannot be completed");
        if (occurrence.idempotencyKey !== idempotencyKey)
            throw new Error("Task completion does not match reserved occurrence identity");
        if (input.agencyExecutionRef !== undefined && occurrence.agencyExecutionRef !== undefined && input.agencyExecutionRef !== occurrence.agencyExecutionRef)
            throw new Error("Task completion Agency execution reference conflicts with reservation");
        if (input.pifTraceRef !== undefined && occurrence.pifTraceRef !== undefined && input.pifTraceRef !== occurrence.pifTraceRef)
            throw new Error("Task completion PIF trace conflicts with reservation");
        const completion = Object.freeze({
            ...input,
            occurrenceKey,
            ownerId: task.ownerId,
            ...(task.projectId !== undefined ? { projectId: task.projectId } : {}),
            idempotencyKey,
            evidenceRefs
        });
        const completionKey = `${input.taskId}:${occurrenceKey}`;
        if (this.#completions.has(completionKey))
            throw new Error(`Duplicate task occurrence completion: ${completionKey}`);
        this.#completions.set(completionKey, completion);
        this.#occurrences.set(occurrenceMapKey, Object.freeze({
            ...occurrence,
            state: "completed",
            evidenceRefs: mergedEvidence([...occurrence.evidenceRefs, ...evidenceRefs], "Task occurrence evidence")
        }));
        return completion;
    }
    exportSnapshot() {
        return Object.freeze({
            schemaVersion: "cc-personal-tasks-v1",
            tasks: Object.freeze([...this.#tasks.values()]),
            occurrences: Object.freeze([...this.#occurrences.values()]),
            completions: Object.freeze([...this.#completions.values()])
        });
    }
    hasCompletedOccurrence(taskId, occurrenceKey) { return this.#completions.has(`${taskId}:${occurrenceKey}`); }
    get(id) { return this.#tasks.get(id); }
    list() { return Object.freeze([...this.#tasks.values()]); }
    occurrences(taskId) {
        return Object.freeze([...this.#occurrences.values()].filter((item) => taskId === undefined || item.taskId === taskId).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.occurrenceKey.localeCompare(b.occurrenceKey)));
    }
    completionHistory(taskId) {
        return Object.freeze([...this.#completions.values()].filter((item) => taskId === undefined || item.taskId === taskId).sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.occurrenceKey.localeCompare(b.occurrenceKey)));
    }
    search(request) {
        if (!request.ownerId.trim())
            throw new Error("Task search owner is required");
        const needle = request.query?.trim().toLocaleLowerCase();
        const states = request.states ? new Set(request.states) : undefined;
        const priorities = request.priorities ? new Set(request.priorities) : undefined;
        return Object.freeze([...this.#tasks.values()].filter((task) => {
            if (task.ownerId !== request.ownerId)
                return false;
            if (request.projectId !== undefined && task.projectId !== request.projectId)
                return false;
            if (states && !states.has(task.state))
                return false;
            if (priorities && !priorities.has(task.priority))
                return false;
            if (needle && !`${task.title} ${task.id} ${task.recurrenceKey ?? ""}`.toLocaleLowerCase().includes(needle))
                return false;
            return true;
        }).sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999") || a.id.localeCompare(b.id)));
    }
    #restoreTask(input) {
        const task = validateTask(input);
        if (this.#tasks.has(task.id))
            throw new Error(`Task already exists: ${task.id}`);
        this.#tasks.set(task.id, task);
    }
    #restoreOccurrence(input) {
        const task = this.#tasks.get(input.taskId);
        if (!task)
            throw new Error(`Persisted task occurrence references unknown task: ${input.taskId}`);
        if (input.ownerId !== task.ownerId || input.projectId !== task.projectId)
            throw new Error("Persisted task occurrence crosses owner/project boundary");
        const occurrenceKey = required(input.occurrenceKey, "Persisted task occurrenceKey");
        parseTimestamp(input.scheduledFor, "scheduledFor");
        validateOptionalRef(input.agencyExecutionRef, "Agency execution reference");
        validateOptionalRef(input.pifTraceRef, "PIF trace reference");
        const expected = taskOccurrenceIdempotencyKey(task.ownerId, task.id, occurrenceKey);
        if (input.idempotencyKey !== expected)
            throw new Error("Persisted task occurrence idempotency identity is invalid");
        const key = `${input.taskId}:${occurrenceKey}`;
        if (this.#occurrences.has(key) || this.#idempotencyKeys.has(input.idempotencyKey))
            throw new Error(`Duplicate task occurrence: ${key}`);
        const occurrence = Object.freeze({ ...input, occurrenceKey, evidenceRefs: uniqueNonBlank(input.evidenceRefs, "Task occurrence evidence", true) });
        this.#occurrences.set(key, occurrence);
        this.#idempotencyKeys.add(input.idempotencyKey);
    }
    #restoreCompletion(input) {
        const task = this.#tasks.get(input.taskId);
        if (!task)
            throw new Error(`Persisted task completion references unknown task: ${input.taskId}`);
        if (input.ownerId !== task.ownerId || input.projectId !== task.projectId)
            throw new Error("Persisted task completion crosses owner/project boundary");
        const occurrenceKey = required(input.occurrenceKey, "Persisted task completion occurrenceKey");
        parseTimestamp(input.completedAt, "completedAt");
        const expected = taskOccurrenceIdempotencyKey(task.ownerId, task.id, occurrenceKey);
        if (input.idempotencyKey !== expected)
            throw new Error("Persisted task completion idempotency identity is invalid");
        const key = `${input.taskId}:${occurrenceKey}`;
        const occurrence = this.#occurrences.get(key);
        if (!occurrence || occurrence.state !== "completed" || occurrence.idempotencyKey !== input.idempotencyKey)
            throw new Error("Persisted task completion requires its exact completed occurrence");
        if (this.#completions.has(key))
            throw new Error(`Duplicate task occurrence completion: ${key}`);
        this.#completions.set(key, Object.freeze({ ...input, occurrenceKey, evidenceRefs: uniqueNonBlank(input.evidenceRefs, "Task completion evidence", true) }));
    }
}
//# sourceMappingURL=tasks.js.map