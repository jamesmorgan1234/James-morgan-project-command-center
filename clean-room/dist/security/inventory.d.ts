import { AuthSessionStore } from "./auth.js";
import { DeviceRegistry } from "./devices.js";
import type { AssuranceLevel, DeviceTrustState, SessionState } from "./types.js";
import type { EnvironmentName } from "../kernel/config.js";
export interface OwnerSessionInventoryItem {
    readonly id: string;
    readonly state: SessionState;
    readonly assurance: AssuranceLevel;
    readonly lastActivityAt: string;
    readonly scopes: readonly string[];
    readonly deviceId?: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
    readonly authProviderId?: string;
}
export interface OwnerDeviceInventoryItem {
    readonly id: string;
    readonly label: string;
    readonly platform: string;
    readonly trustState: DeviceTrustState;
    readonly createdAt: string;
    readonly lastActivityAt?: string;
    readonly revokedAt?: string;
}
export interface OwnerSecurityInventorySnapshot {
    readonly ownerId: string;
    readonly sessions: readonly OwnerSessionInventoryItem[];
    readonly devices: readonly OwnerDeviceInventoryItem[];
}
export declare class SecurityInventory {
    private readonly sessions;
    private readonly devices;
    constructor(sessions: AuthSessionStore, devices: DeviceRegistry);
    snapshot(ownerId: string): OwnerSecurityInventorySnapshot;
}
