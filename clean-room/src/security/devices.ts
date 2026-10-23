import { parseTimestamp, type DeviceTrustState } from "./types.js";

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

export class DeviceRegistry {
  readonly #devices = new Map<string, DeviceRecord>();

  register(record: DeviceRecord): void {
    if (!record.id.trim() || !record.ownerId.trim() || !record.label.trim() || !record.platform.trim()) throw new Error("Device identity fields are required");
    parseTimestamp(record.createdAt, "createdAt");
    if (record.trustState === "revoked") throw new Error("New device cannot start revoked");
    if (this.#devices.has(record.id)) throw new Error(`Device already exists: ${record.id}`);
    this.#devices.set(record.id, Object.freeze({ ...record }));
  }

  get(id: string): DeviceRecord | undefined { return this.#devices.get(id); }
  listByOwner(ownerId: string): readonly DeviceRecord[] { return Object.freeze([...this.#devices.values()].filter((d) => d.ownerId === ownerId)); }

  markSeen(id: string, seenAt: string): DeviceRecord {
    const current = this.#required(id);
    if (current.trustState === "revoked") throw new Error(`Device revoked: ${id}`);
    parseTimestamp(seenAt, "seenAt");
    const updated = Object.freeze({ ...current, lastSeenAt: seenAt });
    this.#devices.set(id, updated);
    return updated;
  }

  setTrusted(id: string): DeviceRecord {
    const current = this.#required(id);
    if (current.trustState === "revoked") throw new Error(`Device revoked: ${id}`);
    const updated = Object.freeze({ ...current, trustState: "trusted" as const });
    this.#devices.set(id, updated);
    return updated;
  }

  revoke(id: string, revokedAt: string): DeviceRecord {
    const current = this.#required(id);
    parseTimestamp(revokedAt, "revokedAt");
    const updated = Object.freeze({ ...current, trustState: "revoked" as const, revokedAt });
    this.#devices.set(id, updated);
    return updated;
  }

  #required(id: string): DeviceRecord {
    const device = this.#devices.get(id);
    if (!device) throw new Error(`Unknown device: ${id}`);
    return device;
  }
}
