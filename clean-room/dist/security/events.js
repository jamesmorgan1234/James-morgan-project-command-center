import { parseTimestamp } from "./types.js";
export class SecurityEventLedger {
    #events = [];
    #ids = new Set();
    append(event) {
        if (this.#ids.has(event.id))
            throw new Error(`Security event already exists: ${event.id}`);
        if (!event.id.trim() || !event.ownerId.trim() || !event.kind.trim() || !event.sourceRef.trim())
            throw new Error("Security event identity fields are required");
        parseTimestamp(event.occurredAt, "occurredAt");
        this.#ids.add(event.id);
        this.#events.push(Object.freeze({ ...event, details: Object.freeze({ ...event.details }) }));
    }
    get(id) { return this.#events.find((event) => event.id === id); }
    list(ownerId) { return Object.freeze(this.#events.filter((event) => event.ownerId === ownerId)); }
}
const NEXT = {
    open: ["acknowledged", "contained"],
    acknowledged: ["contained"],
    contained: ["recovering"],
    recovering: ["contained", "resolved"],
    resolved: []
};
export class IncidentRegistry {
    events;
    #incidents = new Map();
    constructor(events) {
        this.events = events;
    }
    open(incident, eventId, sourceRef) {
        if (incident.state !== "open")
            throw new Error("New incidents must start open");
        if (this.#incidents.has(incident.id))
            throw new Error(`Incident already exists: ${incident.id}`);
        const opened = parseTimestamp(incident.openedAt, "openedAt");
        const updated = parseTimestamp(incident.updatedAt, "updatedAt");
        if (updated < opened)
            throw new Error("Incident updatedAt cannot precede openedAt");
        this.#incidents.set(incident.id, Object.freeze({ ...incident }));
        this.events.append({ id: eventId, ownerId: incident.ownerId, kind: "incident.opened", riskClass: incident.riskClass, occurredAt: incident.openedAt, sourceRef, incidentId: incident.id, details: { title: incident.title } });
    }
    transition(id, to, at, eventId, sourceRef) {
        const current = this.#incidents.get(id);
        if (!current)
            throw new Error(`Unknown incident: ${id}`);
        if (!NEXT[current.state].includes(to))
            throw new Error(`Invalid incident transition: ${current.state} -> ${to}`);
        const atMs = parseTimestamp(at, "at");
        if (atMs < parseTimestamp(current.updatedAt, "current.updatedAt"))
            throw new Error("Incident transition time cannot move backward");
        const updated = Object.freeze({ ...current, state: to, updatedAt: at });
        this.#incidents.set(id, updated);
        this.events.append({ id: eventId, ownerId: current.ownerId, kind: `incident.${to}`, riskClass: current.riskClass, occurredAt: at, sourceRef, incidentId: id, details: {} });
        return updated;
    }
    get(id) { return this.#incidents.get(id); }
}
//# sourceMappingURL=events.js.map