import { DeviceRegistry } from "./devices.js";
export type SecuritySettingValue = string | number | boolean;
export type SecuritySettingScope = "global" | "device";
export interface SecuritySettingRecord {
    readonly ownerId: string;
    readonly scope: SecuritySettingScope;
    readonly key: string;
    readonly value: SecuritySettingValue;
    readonly updatedAt: string;
    readonly deviceId?: string;
}
export declare class SecuritySettingsRegistry {
    #private;
    private readonly devices;
    constructor(devices: DeviceRegistry);
    setGlobal(ownerId: string, key: string, value: SecuritySettingValue, updatedAt: string): SecuritySettingRecord;
    setDevice(ownerId: string, deviceId: string, key: string, value: SecuritySettingValue, updatedAt: string): SecuritySettingRecord;
    resolve(ownerId: string, key: string, deviceId?: string): SecuritySettingRecord | undefined;
    listByOwner(ownerId: string): readonly SecuritySettingRecord[];
}
