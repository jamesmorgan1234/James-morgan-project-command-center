import { parseTimestamp, type RiskClass } from "./types.js";

export interface SecurityEvent {
  readonly id: string;
  readonly ownerId: string;
  readonly kind: string;
  readonly riskClass: RiskClass;
  readonly occurredAt: string;
  readonly sourceRef: string;
  readonly incidentId?: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export type IncidentState = "open" | "acknowledged" | "contained" | "recovering" | "resolved";

export interface SecurityIncident {
  readonly id: string;
  readonly ownerId: string;
  readonly title: string;
  readonly riskClass: RiskClass;
  readonly state: IncidentState;
  readonly openedAt: string;
  readonly updatedAt: string;
}

export class SecurityEventLedger {
  readonly #events: SecurityEvent[] = [];
  readonly #ids = new Set<string>();

  append(event: SecurityEvent): void {
    if (this.#ids.has(event.id)) throw new Error(`Security event already exists: ${event.id}`);
    if (!event.id.trim() || !event.ownerId.trim() || !event.kind.trim() || !event.sourceRef.trim()) throw new Error("Security event identity fields are required");
    parseTimestamp(event.occurredAt, "occurredAt");
    this.#ids.add(event.id);
    this.#events.push(Object.freeze({ ...event, details: Object.freeze({ ...event.details }) }));
  }

  list(ownerId: string): readonly SecurityEvent[] { return Object.freeze(this.#events.filter((event) => event.ownerId === ownerId)); }
}

const NEXT = {
  open: ["acknowledged", "contained"],
  acknowledged: ["contained"],
  contained: ["recovering"],
  recovering: ["contained", "resolved"],
  resolved: []
} as const satisfies Readonly<Record<IncidentState, readonly IncidentState[]>>;

export class IncidentRegistry {
  readonly #incidents = new Map<string, SecurityIncident>();
  constructor(private readonly events: SecurityEventLedger) {}

  open(incident: SecurityIncident, eventId: string, sourceRef: string): void {
    if (incident.state !== "open") throw new Error("New incidents must start open");
    if (this.#incidents.has(incident.id)) throw new Error(`Incident already exists: ${incident.id}`);
    parseTimestamp(incident.openedAt, "openedAt");
    this.#incidents.set(incident.id, Object.freeze({ ...incident }));
    this.events.append({ id: eventId, ownerId: incident.ownerId, kind: "incident.opened", riskClass: incident.riskClass, occurredAt: incident.openedAt, sourceRef, incidentId: incident.id, details: { title: incident.title } });
  }

  transition(id: string, to: IncidentState, at: string, eventId: string, sourceRef: string): SecurityIncident {
    const current = this.#incidents.get(id);
    if (!current) throw new Error(`Unknown incident: ${id}`);
    if (!(NEXT[current.state] as readonly IncidentState[]).includes(to)) throw new Error(`Invalid incident transition: ${current.state} -> ${to}`);
    parseTimestamp(at, "at");
    const updated = Object.freeze({ ...current, state: to, updatedAt: at });
    this.#incidents.set(id, updated);
    this.events.append({ id: eventId, ownerId: current.ownerId, kind: `incident.${to}`, riskClass: current.riskClass, occurredAt: at, sourceRef, incidentId: id, details: {} });
    return updated;
  }

  get(id: string): SecurityIncident | undefined { return this.#incidents.get(id); }
}
