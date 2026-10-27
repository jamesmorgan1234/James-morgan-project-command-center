import { assertSecretChannelSafe } from "./secret-channels.js";
import type { SecurityEvent } from "./events.js";
import { parseTimestamp, type RiskClass } from "./types.js";

export type SecurityAlertState = "open" | "acknowledged" | "resolved";

export interface SecurityAlert {
  readonly id: string;
  readonly ownerId: string;
  readonly sourceEventId: string;
  readonly riskClass: RiskClass;
  readonly state: SecurityAlertState;
  readonly title: string;
  readonly notificationMessage: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly acknowledgedAt?: string;
  readonly resolvedAt?: string;
}

function genericNotification(event: SecurityEvent): { title: string; message: string } {
  const title = event.riskClass === "critical" ? "Critical security activity needs review" : "Security activity needs review";
  const message = `A ${event.riskClass} security event was recorded. Open Command Center Security for details.`;
  assertSecretChannelSafe("note", { title, message });
  return { title, message };
}

export class SecurityAlertCenter {
  readonly #alerts = new Map<string, SecurityAlert>();
  readonly #sourceEventIds = new Set<string>();

  raiseFromEvent(id: string, event: SecurityEvent): SecurityAlert {
    if (!id.trim()) throw new Error("Security alert id is required");
    if (this.#alerts.has(id)) throw new Error(`Security alert already exists: ${id}`);
    if (this.#sourceEventIds.has(event.id)) throw new Error(`Security alert already exists for event: ${event.id}`);
    const { title, message } = genericNotification(event);
    const alert = Object.freeze({
      id,
      ownerId: event.ownerId,
      sourceEventId: event.id,
      riskClass: event.riskClass,
      state: "open" as const,
      title,
      notificationMessage: message,
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt
    });
    this.#alerts.set(id, alert);
    this.#sourceEventIds.add(event.id);
    return alert;
  }

  acknowledge(id: string, at: string): SecurityAlert {
    const current = this.#required(id);
    if (current.state === "resolved") throw new Error(`Cannot acknowledge resolved alert: ${id}`);
    const atMs = parseTimestamp(at, "at");
    if (atMs < parseTimestamp(current.updatedAt, "current.updatedAt")) throw new Error("Security alert time cannot move backward");
    if (current.state === "acknowledged") return current;
    const updated = Object.freeze({ ...current, state: "acknowledged" as const, acknowledgedAt: at, updatedAt: at });
    this.#alerts.set(id, updated);
    return updated;
  }

  resolve(id: string, at: string): SecurityAlert {
    const current = this.#required(id);
    if (current.state === "resolved") return current;
    const atMs = parseTimestamp(at, "at");
    if (atMs < parseTimestamp(current.updatedAt, "current.updatedAt")) throw new Error("Security alert time cannot move backward");
    const updated = Object.freeze({
      ...current,
      state: "resolved" as const,
      ...(current.acknowledgedAt ? {} : { acknowledgedAt: at }),
      resolvedAt: at,
      updatedAt: at
    });
    this.#alerts.set(id, updated);
    return updated;
  }

  get(id: string): SecurityAlert | undefined { return this.#alerts.get(id); }
  list(ownerId: string): readonly SecurityAlert[] { return Object.freeze([...this.#alerts.values()].filter((alert) => alert.ownerId === ownerId)); }

  #required(id: string): SecurityAlert {
    const alert = this.#alerts.get(id);
    if (!alert) throw new Error(`Unknown security alert: ${id}`);
    return alert;
  }
}
