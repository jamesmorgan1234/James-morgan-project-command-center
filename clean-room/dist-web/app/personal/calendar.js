import { parseTimestamp } from "../security/types.js";
function assertTimeZone(timeZone, instant = Date.now()) {
    if (!timeZone.trim())
        throw new Error("Calendar IANA time zone is required");
    try {
        new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(instant));
    }
    catch {
        throw new Error(`Invalid IANA time zone: ${timeZone}`);
    }
}
export function assertCalendarEvent(event) {
    if (!event.id.trim() || !event.ownerId.trim() || !event.providerKey.trim() || !event.externalId.trim() || !event.title.trim() || !event.sourceRef.trim())
        throw new Error("Calendar event identity/provider/title/provenance are required");
    if (!Number.isSafeInteger(event.version) || event.version < 1)
        throw new Error("Calendar event version must be a positive integer");
    const start = parseTimestamp(event.startsAt, "startsAt");
    const end = parseTimestamp(event.endsAt, "endsAt");
    if (end <= start)
        throw new Error("Calendar event endsAt must follow startsAt");
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(event.startsAt) || !/(Z|[+-]\d{2}:\d{2})$/.test(event.endsAt))
        throw new Error("Calendar event timestamps must include an explicit offset");
    assertTimeZone(event.timeZone, start);
}
export function assertCalendarChangeIntent(intent) {
    if (!intent.eventId.trim() || !intent.ownerAuthorizationRef.trim())
        throw new Error("Calendar change requires event identity and owner authorization");
    if (intent.action !== "create" && intent.expectedVersion === undefined)
        throw new Error("Update/delete requires expectedVersion for reconciliation");
    if (intent.expectedVersion !== undefined && (!Number.isSafeInteger(intent.expectedVersion) || intent.expectedVersion < 1))
        throw new Error("Calendar expectedVersion must be a positive integer");
}
function parseLocalDateTime(localDateTime) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(localDateTime);
    if (!match)
        throw new Error("Calendar localDateTime must be YYYY-MM-DDTHH:mm[:ss] without an offset");
    const parts = match.slice(1).map((value, index) => Number(value ?? (index === 5 ? "0" : value)));
    const [year, month, day, hour, minute, second] = parts;
    const normalized = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day || normalized.getUTCHours() !== hour || normalized.getUTCMinutes() !== minute || normalized.getUTCSeconds() !== second)
        throw new Error("Calendar localDateTime is not a real civil date/time");
    return [year, month, day, hour, minute, second];
}
function localPartsAt(instantMs, timeZone) {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const values = Object.fromEntries(formatter.formatToParts(new Date(instantMs)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    return [values.year, values.month, values.day, values.hour, values.minute, values.second];
}
export function calendarLocalTimeCandidates(localDateTime, timeZone) {
    assertTimeZone(timeZone);
    const target = parseLocalDateTime(localDateTime);
    const wallClockAsUtc = Date.UTC(target[0], target[1] - 1, target[2], target[3], target[4], target[5]);
    const candidates = [];
    for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 15) {
        const instant = wallClockAsUtc - offsetMinutes * 60_000;
        const local = localPartsAt(instant, timeZone);
        if (local.every((value, index) => value === target[index]))
            candidates.push(instant);
    }
    return Object.freeze([...new Set(candidates)].sort((a, b) => a - b).map((instant) => new Date(instant).toISOString()));
}
export function resolveCalendarLocalTime(request) {
    const candidates = calendarLocalTimeCandidates(request.localDateTime, request.timeZone);
    if (candidates.length === 0)
        throw new Error("Calendar local time does not exist in this time zone (DST skipped time)");
    if (candidates.length > 1 && request.disambiguation === "reject")
        throw new Error("Calendar local time is ambiguous in this time zone (DST repeated time)");
    const selected = request.disambiguation === "later" ? candidates.at(-1) : candidates[0];
    if (!selected)
        throw new Error("Calendar local time resolution failed");
    return Object.freeze({ instant: selected, timeZone: request.timeZone, localDateTime: request.localDateTime, candidateInstants: candidates, ambiguity: candidates.length > 1 ? "repeated" : "unique" });
}
function eventFingerprint(event) {
    return JSON.stringify([event.ownerId, event.providerKey, event.externalId, event.title, event.startsAt, event.endsAt, event.timeZone]);
}
export function reconcileCalendarEvent(local, remote) {
    assertCalendarEvent(local);
    assertCalendarEvent(remote);
    if (local.ownerId !== remote.ownerId || local.providerKey !== remote.providerKey || local.externalId !== remote.externalId || local.id !== remote.id)
        throw new Error("Calendar reconciliation identity boundary mismatch");
    const evidenceRefs = Object.freeze([...new Set([local.sourceRef, remote.sourceRef])].sort());
    if (remote.version < local.version)
        return Object.freeze({ status: "stale_remote_ignored", selected: local, localVersion: local.version, remoteVersion: remote.version, evidenceRefs });
    if (remote.version > local.version)
        return Object.freeze({ status: "remote_applied", selected: remote, localVersion: local.version, remoteVersion: remote.version, evidenceRefs });
    if (eventFingerprint(local) === eventFingerprint(remote))
        return Object.freeze({ status: "unchanged", selected: local, localVersion: local.version, remoteVersion: remote.version, evidenceRefs });
    return Object.freeze({ status: "conflict", localVersion: local.version, remoteVersion: remote.version, evidenceRefs });
}
export class CalendarProviderRegistry {
    #providers = new Map();
    register(provider) {
        if (!provider.key.startsWith("calendar:") || !Number.isSafeInteger(provider.version) || provider.version < 1)
            throw new Error("Calendar provider key/version are invalid");
        if (this.#providers.has(provider.key))
            throw new Error(`Calendar provider already exists: ${provider.key}`);
        this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...new Set(provider.capabilities)]) }));
    }
    available(capability) {
        return Object.freeze([...this.#providers.values()].filter((provider) => provider.enabled && provider.health !== "unavailable" && provider.capabilities.includes(capability)));
    }
}
//# sourceMappingURL=calendar.js.map