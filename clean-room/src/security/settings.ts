import { DeviceRegistry } from "./devices.js";
import { parseTimestamp } from "./types.js";

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

function settingId(ownerId: string, scope: SecuritySettingScope, key: string, deviceId?: string): string {
  return `${ownerId}\u0000${scope}\u0000${deviceId ?? ""}\u0000${key}`;
}

function assertValue(value: SecuritySettingValue): void {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Security setting numbers must be finite");
  if (typeof value === "string" && !value.trim()) throw new Error("Security setting strings cannot be blank");
}

export class SecuritySettingsRegistry {
  readonly #records = new Map<string, SecuritySettingRecord>();

  constructor(private readonly devices: DeviceRegistry) {}

  setGlobal(ownerId: string, key: string, value: SecuritySettingValue, updatedAt: string): SecuritySettingRecord {
    return this.#set({ ownerId, scope: "global", key, value, updatedAt });
  }

  setDevice(ownerId: string, deviceId: string, key: string, value: SecuritySettingValue, updatedAt: string): SecuritySettingRecord {
    if (!deviceId.trim()) throw new Error("deviceId is required");
    this.devices.assertUsable(deviceId, ownerId);
    return this.#set({ ownerId, scope: "device", deviceId, key, value, updatedAt });
  }

  resolve(ownerId: string, key: string, deviceId?: string): SecuritySettingRecord | undefined {
    if (!ownerId.trim() || !key.trim()) throw new Error("ownerId and setting key are required");
    if (deviceId !== undefined) {
      if (!deviceId.trim()) throw new Error("deviceId cannot be blank");
      this.devices.assertUsable(deviceId, ownerId);
      const local = this.#records.get(settingId(ownerId, "device", key, deviceId));
      if (local) return local;
    }
    return this.#records.get(settingId(ownerId, "global", key));
  }

  listByOwner(ownerId: string): readonly SecuritySettingRecord[] {
    if (!ownerId.trim()) throw new Error("ownerId is required");
    return Object.freeze([...this.#records.values()].filter((record) => record.ownerId === ownerId));
  }

  #set(input: SecuritySettingRecord): SecuritySettingRecord {
    if (!input.ownerId.trim() || !input.key.trim()) throw new Error("ownerId and setting key are required");
    assertValue(input.value);
    const updatedMs = parseTimestamp(input.updatedAt, "updatedAt");
    const id = settingId(input.ownerId, input.scope, input.key, input.deviceId);
    const current = this.#records.get(id);
    if (current && updatedMs < parseTimestamp(current.updatedAt, "current.updatedAt")) throw new Error("Security setting time cannot move backward");
    const stored = Object.freeze({ ...input });
    this.#records.set(id, stored);
    return stored;
  }
}
