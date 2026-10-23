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

export class CommandRuntime {
  readonly #handlers = new Map<string, CommandHandler>();
  readonly #idempotency = new Map<string, readonly EventEnvelope[]>();
  #sequence = 0;

  register(type: string, handler: CommandHandler): void {
    if (!type.trim()) throw new Error("Command type is required");
    if (this.#handlers.has(type)) throw new Error(`Command handler already registered: ${type}`);
    this.#handlers.set(type, handler);
  }

  execute(command: CommandEnvelope): readonly EventEnvelope[] {
    if (command.version < 1) throw new Error(`Invalid command version for ${command.type}`);
    const handler = this.#handlers.get(command.type);
    if (!handler) throw new Error(`No command handler registered for ${command.type}`);
    const dedupeKey = command.idempotencyKey ? `${command.type}:${command.idempotencyKey}` : undefined;
    if (dedupeKey && this.#idempotency.has(dedupeKey)) return this.#idempotency.get(dedupeKey)!;
    const events = handler(command).map((event) => Object.freeze({ ...event, sequence: ++this.#sequence }));
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
