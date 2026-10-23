export interface TraceEvent {
  readonly traceId: string;
  readonly correlationId: string;
  readonly component: string;
  readonly action: string;
  readonly at: string;
  readonly evidenceRefs: readonly string[];
  readonly fields: Readonly<Record<string, string>>;
}

const SECRET_KEYS = new Set(["token", "password", "secret", "api_key", "authorization"]);

export function redactFields(fields: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) output[key] = SECRET_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  return Object.freeze(output);
}

export class TraceLedger {
  readonly #events: TraceEvent[] = [];
  append(event: TraceEvent): TraceEvent {
    if (!event.traceId.trim() || !event.correlationId.trim() || !event.component.trim() || !event.action.trim() || !event.at.includes("T")) throw new Error("trace identity required");
    const frozen = Object.freeze({ ...event, evidenceRefs: Object.freeze([...event.evidenceRefs]), fields: redactFields(event.fields) });
    this.#events.push(frozen);
    return frozen;
  }
  trace(traceId: string): readonly TraceEvent[] {
    return Object.freeze(this.#events.filter((event) => event.traceId === traceId));
  }
}
