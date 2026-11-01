import { assertSecretChannelSafe } from "./secret-channels.js";
import { parseTimestamp } from "./types.js";
function genericNotification(event) {
    const title = event.riskClass === "critical" ? "Critical security activity needs review" : "Security activity needs review";
    const message = `A ${event.riskClass} security event was recorded. Open Command Center Security for details.`;
    assertSecretChannelSafe("note", { title, message });
    return { title, message };
}
export class SecurityAlertCenter {
    #alerts = new Map();
    #sourceEventIds = new Set();
    raiseFromEvent(id, event) {
        if (!id.trim())
            throw new Error("Security alert id is required");
        if (this.#alerts.has(id))
            throw new Error(`Security alert already exists: ${id}`);
        if (this.#sourceEventIds.has(event.id))
            throw new Error(`Security alert already exists for event: ${event.id}`);
        const { title, message } = genericNotification(event);
        const alert = Object.freeze({
            id,
            ownerId: event.ownerId,
            sourceEventId: event.id,
            riskClass: event.riskClass,
            state: "open",
            title,
            notificationMessage: message,
            createdAt: event.occurredAt,
            updatedAt: event.occurredAt
        });
        this.#alerts.set(id, alert);
        this.#sourceEventIds.add(event.id);
        return alert;
    }
    acknowledge(id, at) {
        const current = this.#required(id);
        if (current.state === "resolved")
            throw new Error(`Cannot acknowledge resolved alert: ${id}`);
        const atMs = parseTimestamp(at, "at");
        if (atMs < parseTimestamp(current.updatedAt, "current.updatedAt"))
            throw new Error("Security alert time cannot move backward");
        if (current.state === "acknowledged")
            return current;
        const updated = Object.freeze({ ...current, state: "acknowledged", acknowledgedAt: at, updatedAt: at });
        this.#alerts.set(id, updated);
        return updated;
    }
    resolve(id, at) {
        const current = this.#required(id);
        if (current.state === "resolved")
            return current;
        const atMs = parseTimestamp(at, "at");
        if (atMs < parseTimestamp(current.updatedAt, "current.updatedAt"))
            throw new Error("Security alert time cannot move backward");
        const updated = Object.freeze({
            ...current,
            state: "resolved",
            ...(current.acknowledgedAt ? {} : { acknowledgedAt: at }),
            resolvedAt: at,
            updatedAt: at
        });
        this.#alerts.set(id, updated);
        return updated;
    }
    get(id) { return this.#alerts.get(id); }
    list(ownerId) { return Object.freeze([...this.#alerts.values()].filter((alert) => alert.ownerId === ownerId)); }
    #required(id) {
        const alert = this.#alerts.get(id);
        if (!alert)
            throw new Error(`Unknown security alert: ${id}`);
        return alert;
    }
}
//# sourceMappingURL=alerts.js.map