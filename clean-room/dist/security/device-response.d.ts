import { AuthSessionStore } from "./auth.js";
import { DeviceRegistry } from "./devices.js";
export interface StolenDeviceResponse {
    readonly ownerId: string;
    readonly deviceId: string;
    readonly containedAt: string;
    readonly revokedSessionIds: readonly string[];
}
export declare class DeviceIncidentResponse {
    private readonly sessions;
    private readonly devices;
    constructor(sessions: AuthSessionStore, devices: DeviceRegistry);
    containStolenDevice(ownerId: string, deviceId: string, containedAt: string): StolenDeviceResponse;
}
