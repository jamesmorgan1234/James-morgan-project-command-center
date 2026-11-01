import type { SecurityEvent } from "./events.js";
import { type RiskClass } from "./types.js";
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
export declare class SecurityAlertCenter {
    #private;
    raiseFromEvent(id: string, event: SecurityEvent): SecurityAlert;
    acknowledge(id: string, at: string): SecurityAlert;
    resolve(id: string, at: string): SecurityAlert;
    get(id: string): SecurityAlert | undefined;
    list(ownerId: string): readonly SecurityAlert[];
}
