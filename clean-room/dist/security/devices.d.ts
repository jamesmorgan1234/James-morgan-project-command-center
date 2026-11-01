import { type DeviceTrustState } from "./types.js";
export interface DeviceRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly label: string;
    readonly platform: string;
    readonly trustState: DeviceTrustState;
    readonly createdAt: string;
    readonly lastSeenAt?: string;
    readonly revokedAt?: string;
}
export declare class DeviceRegistry {
    #private;
    register(record: DeviceRecord): void;
    get(id: string): DeviceRecord | undefined;
    listByOwner(ownerId: string): readonly DeviceRecord[];
    assertUsable(id: string, ownerId: string): DeviceRecord;
    markSeen(id: string, seenAt: string): DeviceRecord;
    setTrusted(id: string): DeviceRecord;
    revoke(id: string, revokedAt: string): DeviceRecord;
}
