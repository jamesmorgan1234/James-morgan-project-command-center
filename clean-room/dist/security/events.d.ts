import { type RiskClass } from "./types.js";
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
export declare class SecurityEventLedger {
    #private;
    append(event: SecurityEvent): void;
    get(id: string): SecurityEvent | undefined;
    list(ownerId: string): readonly SecurityEvent[];
}
export declare class IncidentRegistry {
    #private;
    private readonly events;
    constructor(events: SecurityEventLedger);
    open(incident: SecurityIncident, eventId: string, sourceRef: string): void;
    transition(id: string, to: IncidentState, at: string, eventId: string, sourceRef: string): SecurityIncident;
    get(id: string): SecurityIncident | undefined;
}
