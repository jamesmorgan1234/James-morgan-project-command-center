export class CommandCancelledError extends Error {
    reason;
    constructor(reason) {
        super(reason ? `Command cancelled: ${reason}` : "Command cancelled");
        this.name = "CommandCancelledError";
        this.reason = reason;
    }
}
function assertEnvelopeVersion(version, label) {
    if (!Number.isSafeInteger(version) || version < 1)
        throw new Error(`Invalid ${label} version: ${version}`);
    return version;
}
function assertNonBlank(value, label) {
    if (typeof value !== "string" || !value.trim())
        throw new Error(`${label} is required`);
    return value;
}
function assertRetryPolicy(policy) {
    const maxAttempts = policy?.maxAttempts ?? 1;
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1)
        throw new Error(`Retry maxAttempts must be a positive safe integer: ${maxAttempts}`);
    return maxAttempts;
}
function throwIfCancelled(signal) {
    if (signal?.cancelled)
        throw new CommandCancelledError(signal.reason);
}
function commandReplayScope(command) {
    // Replay namespace only. Authorization remains the responsibility of the canonical policy/domain gates.
    return Object.freeze([command.actor, command.projectId ?? null]);
}
function commandInboxKey(command) {
    const [actor, projectId] = commandReplayScope(command);
    return JSON.stringify([actor, projectId, command.id]);
}
function commandIdempotencyKey(command) {
    if (!command.idempotencyKey)
        return undefined;
    const [actor, projectId] = commandReplayScope(command);
    return JSON.stringify([actor, projectId, command.type, command.idempotencyKey]);
}
export function assertCommandEnvelope(command) {
    assertNonBlank(command.id, "command id");
    assertNonBlank(command.type, "command type");
    assertEnvelopeVersion(command.version, "command");
    assertNonBlank(command.correlationId, "command correlationId");
    assertNonBlank(command.actor, "command actor");
    if (command.causationId !== undefined)
        assertNonBlank(command.causationId, "command causationId");
    if (command.idempotencyKey !== undefined)
        assertNonBlank(command.idempotencyKey, "command idempotencyKey");
    if (command.projectId !== undefined)
        assertNonBlank(command.projectId, "command projectId");
    return command;
}
function assertEventEnvelope(event, command) {
    assertNonBlank(event.id, "event id");
    assertNonBlank(event.type, "event type");
    assertEnvelopeVersion(event.version, "event");
    assertNonBlank(event.correlationId, "event correlationId");
    assertNonBlank(event.causationId, "event causationId");
    if (event.correlationId !== command.correlationId)
        throw new Error("Event correlationId must match originating command correlationId");
    if (event.causationId !== command.id)
        throw new Error("Event causationId must match originating command id");
}
export class CommandRuntime {
    #handlers = new Map();
    #idempotency = new Map();
    #inbox = new Map();
    #inboxCommandIds = new Set();
    #outbox = [];
    #sequence = 0;
    register(type, handler) {
        assertNonBlank(type, "Command type");
        if (this.#handlers.has(type))
            throw new Error(`Command handler already registered: ${type}`);
        this.#handlers.set(type, handler);
    }
    registeredTypes() {
        return Object.freeze([...this.#handlers.keys()].sort());
    }
    execute(command, options = {}) {
        assertCommandEnvelope(command);
        const handler = this.#handlers.get(command.type);
        if (!handler)
            throw new Error(`No command handler registered for ${command.type}`);
        const inboxKey = commandInboxKey(command);
        const inboxReplay = this.#inbox.get(inboxKey);
        if (inboxReplay)
            return inboxReplay;
        const dedupeKey = commandIdempotencyKey(command);
        if (dedupeKey) {
            const replay = this.#idempotency.get(dedupeKey);
            if (replay) {
                this.#inbox.set(inboxKey, replay);
                this.#inboxCommandIds.add(command.id);
                return replay;
            }
        }
        const maxAttempts = assertRetryPolicy(options.retry);
        const transactionId = options.transactionId === undefined
            ? `tx:${command.id}`
            : assertNonBlank(options.transactionId, "transactionId");
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                throwIfCancelled(options.cancellation);
                const context = options.cancellation
                    ? Object.freeze({ attempt, transactionId, cancellation: options.cancellation })
                    : Object.freeze({ attempt, transactionId });
                const drafts = handler(command, context);
                throwIfCancelled(options.cancellation);
                for (const event of drafts)
                    assertEventEnvelope(event, command);
                const eventIds = new Set();
                const existingOutboxIds = new Set(this.#outbox.map((record) => record.event.id));
                for (const event of drafts) {
                    if (eventIds.has(event.id) || existingOutboxIds.has(event.id))
                        throw new Error(`Duplicate event id: ${event.id}`);
                    eventIds.add(event.id);
                }
                const startingSequence = this.#sequence;
                const events = Object.freeze(drafts.map((event, index) => Object.freeze({
                    ...event,
                    sequence: startingSequence + index + 1
                })));
                const outboxRecords = events.map((event) => Object.freeze({ event, transactionId, published: false }));
                // Transaction boundary: sequence, scoped inbox, scoped idempotency, and outbox become visible together only after validation succeeds.
                this.#sequence = startingSequence + events.length;
                this.#inbox.set(inboxKey, events);
                this.#inboxCommandIds.add(command.id);
                if (dedupeKey)
                    this.#idempotency.set(dedupeKey, events);
                this.#outbox.push(...outboxRecords);
                return events;
            }
            catch (error) {
                lastError = error;
                if (error instanceof CommandCancelledError)
                    break;
                const retryAllowed = options.retry?.shouldRetry?.(error, attempt) ?? true;
                if (attempt >= maxAttempts || !retryAllowed)
                    break;
            }
        }
        if (options.compensate)
            options.compensate(command, lastError, maxAttempts);
        throw lastError;
    }
    inboxHas(commandId) {
        assertNonBlank(commandId, "command id");
        return this.#inboxCommandIds.has(commandId);
    }
    pendingOutbox() {
        return Object.freeze(this.#outbox.filter((record) => !record.published));
    }
    acknowledgeOutbox(eventId) {
        assertNonBlank(eventId, "event id");
        const index = this.#outbox.findIndex((record) => record.event.id === eventId);
        if (index < 0)
            throw new Error(`Unknown outbox event: ${eventId}`);
        const current = this.#outbox[index];
        if (current.published)
            return current;
        const next = Object.freeze({ ...current, published: true });
        this.#outbox[index] = next;
        return next;
    }
}
export class StateMachine {
    #transitions;
    constructor(transitions) {
        const seen = new Map();
        const snapshot = transitions.map((transition) => {
            const from = assertNonBlank(transition.from, "transition from");
            const event = assertNonBlank(transition.event, "transition event");
            const to = assertNonBlank(transition.to, "transition to");
            const key = JSON.stringify([from, event]);
            const existing = seen.get(key);
            if (existing !== undefined) {
                if (existing !== to)
                    throw new Error(`Conflicting state transition: ${from} --${event}--> ${existing} or ${to}`);
                throw new Error(`Duplicate state transition: ${from} --${event}--> ${to}`);
            }
            seen.set(key, to);
            return Object.freeze({ from, event, to });
        });
        this.#transitions = Object.freeze(snapshot);
    }
    next(current, event) {
        const match = this.#transitions.find((transition) => transition.from === current && transition.event === event);
        if (!match)
            throw new Error(`Invalid state transition: ${current} --${event}--> ?`);
        return match.to;
    }
}
export class WorkflowRuntime {
    execute(workflow, context, cancellation) {
        assertNonBlank(workflow.id, "workflow id");
        assertNonBlank(workflow.correlationId, "workflow correlationId");
        if (workflow.steps.length === 0)
            throw new Error(`Workflow requires at least one step: ${workflow.id}`);
        const seen = new Set();
        for (const step of workflow.steps) {
            assertNonBlank(step.key, "workflow step key");
            if (seen.has(step.key))
                throw new Error(`Duplicate workflow step key: ${step.key}`);
            seen.add(step.key);
            assertRetryPolicy(step.retry);
        }
        const completed = [];
        try {
            for (const step of workflow.steps) {
                const maxAttempts = assertRetryPolicy(step.retry);
                let stepCompleted = false;
                let lastError;
                for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                    try {
                        throwIfCancelled(cancellation);
                        step.run(context, attempt);
                        throwIfCancelled(cancellation);
                        stepCompleted = true;
                        break;
                    }
                    catch (error) {
                        lastError = error;
                        if (error instanceof CommandCancelledError)
                            break;
                        const retryAllowed = step.retry?.shouldRetry?.(error, attempt) ?? true;
                        if (attempt >= maxAttempts || !retryAllowed)
                            break;
                    }
                }
                if (!stepCompleted)
                    throw lastError;
                completed.push(step);
            }
        }
        catch (error) {
            for (const step of [...completed].reverse())
                step.compensate?.(context, error);
            throw error;
        }
        return Object.freeze({
            workflowId: workflow.id,
            correlationId: workflow.correlationId,
            completedSteps: Object.freeze(completed.map((step) => step.key))
        });
    }
}
//# sourceMappingURL=command-runtime.js.map