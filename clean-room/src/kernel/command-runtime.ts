export interface CommandEnvelope<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly version: number;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly idempotencyKey?: string;
  readonly actor: string;
  readonly projectId?: string;
  readonly payload: T;
}

export interface EventEnvelope<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly version: number;
  readonly sequence: number;
  readonly correlationId: string;
  readonly causationId: string;
  readonly payload: T;
}

export interface CancellationSignal {
  readonly cancelled: boolean;
  readonly reason?: string;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface CommandExecutionContext {
  readonly attempt: number;
  readonly transactionId: string;
  readonly cancellation?: CancellationSignal;
}

export interface CommandExecutionOptions {
  readonly transactionId?: string;
  readonly cancellation?: CancellationSignal;
  readonly retry?: RetryPolicy;
  readonly compensate?: (command: CommandEnvelope, error: unknown, attempts: number) => void;
}

export interface OutboxRecord {
  readonly event: EventEnvelope;
  readonly transactionId: string;
  readonly published: boolean;
}

export type CommandHandler<T = unknown> = (
  command: CommandEnvelope<T>,
  context: CommandExecutionContext
) => readonly Omit<EventEnvelope, "sequence">[];

export class CommandCancelledError extends Error {
  readonly reason: string | undefined;
  constructor(reason?: string) {
    super(reason ? `Command cancelled: ${reason}` : "Command cancelled");
    this.name = "CommandCancelledError";
    this.reason = reason;
  }
}

function assertEnvelopeVersion(version: number, label: string): number {
  if (!Number.isSafeInteger(version) || version < 1) throw new Error(`Invalid ${label} version: ${version}`);
  return version;
}

function assertNonBlank(value: string | undefined, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value;
}

function assertRetryPolicy(policy: RetryPolicy | undefined): number {
  const maxAttempts = policy?.maxAttempts ?? 1;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) throw new Error(`Retry maxAttempts must be a positive safe integer: ${maxAttempts}`);
  return maxAttempts;
}

function throwIfCancelled(signal: CancellationSignal | undefined): void {
  if (signal?.cancelled) throw new CommandCancelledError(signal.reason);
}

function commandReplayScope(command: CommandEnvelope): readonly [string, string | null] {
  // Replay namespace only. Authorization remains the responsibility of the canonical policy/domain gates.
  return Object.freeze([command.actor, command.projectId ?? null]);
}

function commandInboxKey(command: CommandEnvelope): string {
  const [actor, projectId] = commandReplayScope(command);
  return JSON.stringify([actor, projectId, command.id]);
}

function commandIdempotencyKey(command: CommandEnvelope): string | undefined {
  if (!command.idempotencyKey) return undefined;
  const [actor, projectId] = commandReplayScope(command);
  return JSON.stringify([actor, projectId, command.type, command.idempotencyKey]);
}

export function assertCommandEnvelope(command: CommandEnvelope): CommandEnvelope {
  assertNonBlank(command.id, "command id");
  assertNonBlank(command.type, "command type");
  assertEnvelopeVersion(command.version, "command");
  assertNonBlank(command.correlationId, "command correlationId");
  assertNonBlank(command.actor, "command actor");
  if (command.causationId !== undefined) assertNonBlank(command.causationId, "command causationId");
  if (command.idempotencyKey !== undefined) assertNonBlank(command.idempotencyKey, "command idempotencyKey");
  if (command.projectId !== undefined) assertNonBlank(command.projectId, "command projectId");
  return command;
}

function assertEventEnvelope(event: Omit<EventEnvelope, "sequence">, command: CommandEnvelope): void {
  assertNonBlank(event.id, "event id");
  assertNonBlank(event.type, "event type");
  assertEnvelopeVersion(event.version, "event");
  assertNonBlank(event.correlationId, "event correlationId");
  assertNonBlank(event.causationId, "event causationId");
  if (event.correlationId !== command.correlationId) throw new Error("Event correlationId must match originating command correlationId");
  if (event.causationId !== command.id) throw new Error("Event causationId must match originating command id");
}

export class CommandRuntime {
  readonly #handlers = new Map<string, CommandHandler>();
  readonly #idempotency = new Map<string, readonly EventEnvelope[]>();
  readonly #inbox = new Map<string, readonly EventEnvelope[]>();
  readonly #inboxCommandIds = new Set<string>();
  #outbox: OutboxRecord[] = [];
  #sequence = 0;

  register(type: string, handler: CommandHandler): void {
    assertNonBlank(type, "Command type");
    if (this.#handlers.has(type)) throw new Error(`Command handler already registered: ${type}`);
    this.#handlers.set(type, handler);
  }

  registeredTypes(): readonly string[] {
    return Object.freeze([...this.#handlers.keys()].sort());
  }

  execute(command: CommandEnvelope, options: CommandExecutionOptions = {}): readonly EventEnvelope[] {
    assertCommandEnvelope(command);
    const handler = this.#handlers.get(command.type);
    if (!handler) throw new Error(`No command handler registered for ${command.type}`);

    const inboxKey = commandInboxKey(command);
    const inboxReplay = this.#inbox.get(inboxKey);
    if (inboxReplay) return inboxReplay;

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

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        throwIfCancelled(options.cancellation);
        const context: CommandExecutionContext = options.cancellation
          ? Object.freeze({ attempt, transactionId, cancellation: options.cancellation })
          : Object.freeze({ attempt, transactionId });
        const drafts = handler(command, context);
        throwIfCancelled(options.cancellation);

        for (const event of drafts) assertEventEnvelope(event, command);
        const eventIds = new Set<string>();
        const existingOutboxIds = new Set(this.#outbox.map((record) => record.event.id));
        for (const event of drafts) {
          if (eventIds.has(event.id) || existingOutboxIds.has(event.id)) throw new Error(`Duplicate event id: ${event.id}`);
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
        if (dedupeKey) this.#idempotency.set(dedupeKey, events);
        this.#outbox.push(...outboxRecords);
        return events;
      } catch (error) {
        lastError = error;
        if (error instanceof CommandCancelledError) break;
        const retryAllowed = options.retry?.shouldRetry?.(error, attempt) ?? true;
        if (attempt >= maxAttempts || !retryAllowed) break;
      }
    }

    if (options.compensate) options.compensate(command, lastError, maxAttempts);
    throw lastError;
  }

  inboxHas(commandId: string): boolean {
    assertNonBlank(commandId, "command id");
    return this.#inboxCommandIds.has(commandId);
  }

  pendingOutbox(): readonly OutboxRecord[] {
    return Object.freeze(this.#outbox.filter((record) => !record.published));
  }

  acknowledgeOutbox(eventId: string): OutboxRecord {
    assertNonBlank(eventId, "event id");
    const index = this.#outbox.findIndex((record) => record.event.id === eventId);
    if (index < 0) throw new Error(`Unknown outbox event: ${eventId}`);
    const current = this.#outbox[index]!;
    if (current.published) return current;
    const next = Object.freeze({ ...current, published: true });
    this.#outbox[index] = next;
    return next;
  }
}

export interface Transition<S extends string> {
  readonly from: S;
  readonly event: string;
  readonly to: S;
}

export class StateMachine<S extends string> {
  readonly #transitions: readonly Transition<S>[];
  constructor(transitions: readonly Transition<S>[]) {
    const seen = new Map<string, S>();
    const snapshot = transitions.map((transition) => {
      const from = assertNonBlank(transition.from, "transition from") as S;
      const event = assertNonBlank(transition.event, "transition event");
      const to = assertNonBlank(transition.to, "transition to") as S;
      const key = JSON.stringify([from, event]);
      const existing = seen.get(key);
      if (existing !== undefined) {
        if (existing !== to) throw new Error(`Conflicting state transition: ${from} --${event}--> ${existing} or ${to}`);
        throw new Error(`Duplicate state transition: ${from} --${event}--> ${to}`);
      }
      seen.set(key, to);
      return Object.freeze({ from, event, to });
    });
    this.#transitions = Object.freeze(snapshot);
  }
  next(current: S, event: string): S {
    const match = this.#transitions.find((transition) => transition.from === current && transition.event === event);
    if (!match) throw new Error(`Invalid state transition: ${current} --${event}--> ?`);
    return match.to;
  }
}

export interface WorkflowStep<TContext> {
  readonly key: string;
  readonly run: (context: TContext, attempt: number) => void;
  readonly retry?: RetryPolicy;
  readonly compensate?: (context: TContext, cause: unknown) => void;
}

export interface WorkflowDefinition<TContext> {
  readonly id: string;
  readonly correlationId: string;
  readonly steps: readonly WorkflowStep<TContext>[];
}

export interface WorkflowExecutionResult {
  readonly workflowId: string;
  readonly correlationId: string;
  readonly completedSteps: readonly string[];
}

export class WorkflowRuntime {
  execute<TContext>(
    workflow: WorkflowDefinition<TContext>,
    context: TContext,
    cancellation?: CancellationSignal
  ): WorkflowExecutionResult {
    assertNonBlank(workflow.id, "workflow id");
    assertNonBlank(workflow.correlationId, "workflow correlationId");
    if (workflow.steps.length === 0) throw new Error(`Workflow requires at least one step: ${workflow.id}`);

    const seen = new Set<string>();
    for (const step of workflow.steps) {
      assertNonBlank(step.key, "workflow step key");
      if (seen.has(step.key)) throw new Error(`Duplicate workflow step key: ${step.key}`);
      seen.add(step.key);
      assertRetryPolicy(step.retry);
    }

    const completed: WorkflowStep<TContext>[] = [];
    try {
      for (const step of workflow.steps) {
        const maxAttempts = assertRetryPolicy(step.retry);
        let stepCompleted = false;
        let lastError: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            throwIfCancelled(cancellation);
            step.run(context, attempt);
            throwIfCancelled(cancellation);
            stepCompleted = true;
            break;
          } catch (error) {
            lastError = error;
            if (error instanceof CommandCancelledError) break;
            const retryAllowed = step.retry?.shouldRetry?.(error, attempt) ?? true;
            if (attempt >= maxAttempts || !retryAllowed) break;
          }
        }
        if (!stepCompleted) throw lastError;
        completed.push(step);
      }
    } catch (error) {
      for (const step of [...completed].reverse()) step.compensate?.(context, error);
      throw error;
    }

    return Object.freeze({
      workflowId: workflow.id,
      correlationId: workflow.correlationId,
      completedSteps: Object.freeze(completed.map((step) => step.key))
    });
  }
}
