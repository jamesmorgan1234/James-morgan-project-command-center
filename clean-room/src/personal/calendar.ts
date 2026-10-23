import { parseTimestamp } from "../security/types.js";

export interface CalendarEventRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly providerKey: string;
  readonly externalId: string;
  readonly title: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly timeZone: string;
  readonly version: number;
  readonly sourceRef: string;
}

export interface CalendarProviderAdapter {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly capabilities: readonly ("read" | "create" | "update" | "delete")[];
  readonly health: "available" | "degraded" | "unavailable";
}

export interface CalendarChangeIntent {
  readonly eventId: string;
  readonly action: "create" | "update" | "delete";
  readonly ownerAuthorizationRef: string;
  readonly expectedVersion?: number;
}

export function assertCalendarEvent(event: CalendarEventRecord): void {
  if (!event.id.trim() || !event.ownerId.trim() || !event.providerKey.trim() || !event.externalId.trim() || !event.title.trim()) throw new Error("Calendar event identity/provider/title are required");
  const start = parseTimestamp(event.startsAt, "startsAt");
  const end = parseTimestamp(event.endsAt, "endsAt");
  if (end <= start) throw new Error("Calendar event endsAt must follow startsAt");
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(event.startsAt) || !/(Z|[+-]\d{2}:\d{2})$/.test(event.endsAt)) throw new Error("Calendar event timestamps must include an explicit offset");
  try { new Intl.DateTimeFormat("en-US", { timeZone: event.timeZone }).format(new Date(start)); } catch { throw new Error(`Invalid IANA time zone: ${event.timeZone}`); }
}

export function assertCalendarChangeIntent(intent: CalendarChangeIntent): void {
  if (!intent.eventId.trim() || !intent.ownerAuthorizationRef.trim()) throw new Error("Calendar change requires event identity and owner authorization");
  if (intent.action !== "create" && intent.expectedVersion === undefined) throw new Error("Update/delete requires expectedVersion for reconciliation");
}

export class CalendarProviderRegistry {
  readonly #providers = new Map<string, CalendarProviderAdapter>();
  register(provider: CalendarProviderAdapter): void {
    if (!provider.key.startsWith("calendar:")) throw new Error("Calendar provider key must start with calendar:");
    if (this.#providers.has(provider.key)) throw new Error(`Calendar provider already exists: ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]) }));
  }
  available(capability: CalendarProviderAdapter["capabilities"][number]): readonly CalendarProviderAdapter[] {
    return Object.freeze([...this.#providers.values()].filter((provider) => provider.enabled && provider.health !== "unavailable" && provider.capabilities.includes(capability)));
  }
}
