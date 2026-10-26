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

export type CommandHandler<T = unknown> = (command: CommandEnvelope<T>) => readonly Omit<EventEnvelope, "sequence">[];

function assertEnvelopeVersion(version: number, label: string): number {
  if (!Number.isSafeInteger(version) || version < 1) throw new Error(`Invalid ${label} version: ${version}`);
  return version;
}

function assertNonBlank(value: string | undefined, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value;
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
  #sequence = 0;

  register(type: string, handler: CommandHandler): void {
    assertNonBlank(type, "Command type");
    if (this.#handlers.has(type)) throw new Error(`Command handler already registered: ${type}`);
    this.#handlers.set(type, handler);
  }

  registeredTypes(): readonly string[] {
    return Object.freeze([...this.#handlers.keys()].sort());
  }

  execute(command: CommandEnvelope): readonly EventEnvelope[] {
    assertCommandEnvelope(command);
    const handler = this.#handlers.get(command.type);
    if (!handler) throw new Error(`No command handler registered for ${command.type}`);
    const dedupeKey = command.idempotencyKey ? `${command.type}:${command.idempotencyKey}` : undefined;
    if (dedupeKey && this.#idempotency.has(dedupeKey)) return this.#idempotency.get(dedupeKey)!;
    const drafts = handler(command);
    const events = drafts.map((event) => {
      assertEventEnvelope(event, command);
      return Object.freeze({ ...event, sequence: ++this.#sequence });
    });
    if (dedupeKey) this.#idempotency.set(dedupeKey, Object.freeze(events));
    return Object.freeze(events);
  }
}

export interface Transition<S extends string> {
  readonly from: S;
  readonly event: string;
  readonly to: S;
}

export class StateMachine<S extends string> {
  readonly #transitions: readonly Transition<S>[];
  constructor(transitions: readonly Transition<S>[]) { this.#transitions = Object.freeze([...transitions]); }
  next(current: S, event: string): S {
    const match = this.#transitions.find((transition) => transition.from === current && transition.event === event);
    if (!match) throw new Error(`Invalid state transition: ${current} --${event}--> ?`);
    return match.to;
  }
}
