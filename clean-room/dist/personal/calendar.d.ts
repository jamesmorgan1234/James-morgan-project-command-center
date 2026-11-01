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
export type CalendarLocalTimeDisambiguation = "reject" | "earlier" | "later";
export interface CalendarLocalTimeRequest {
    readonly localDateTime: string;
    readonly timeZone: string;
    readonly disambiguation: CalendarLocalTimeDisambiguation;
}
export interface CalendarLocalTimeResolution {
    readonly instant: string;
    readonly timeZone: string;
    readonly localDateTime: string;
    readonly candidateInstants: readonly string[];
    readonly ambiguity: "unique" | "repeated";
}
export type CalendarReconciliationStatus = "unchanged" | "remote_applied" | "stale_remote_ignored" | "conflict";
export interface CalendarReconciliationResult {
    readonly status: CalendarReconciliationStatus;
    readonly selected?: CalendarEventRecord;
    readonly localVersion: number;
    readonly remoteVersion: number;
    readonly evidenceRefs: readonly string[];
}
export declare function assertCalendarEvent(event: CalendarEventRecord): void;
export declare function assertCalendarChangeIntent(intent: CalendarChangeIntent): void;
export declare function calendarLocalTimeCandidates(localDateTime: string, timeZone: string): readonly string[];
export declare function resolveCalendarLocalTime(request: CalendarLocalTimeRequest): CalendarLocalTimeResolution;
export declare function reconcileCalendarEvent(local: CalendarEventRecord, remote: CalendarEventRecord): CalendarReconciliationResult;
export declare class CalendarProviderRegistry {
    #private;
    register(provider: CalendarProviderAdapter): void;
    available(capability: CalendarProviderAdapter["capabilities"][number]): readonly CalendarProviderAdapter[];
}
