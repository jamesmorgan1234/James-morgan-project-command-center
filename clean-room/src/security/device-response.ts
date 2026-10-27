import { AuthSessionStore, type AuthSessionRecord } from "./auth.js";
import { DeviceRegistry, type DeviceRecord } from "./devices.js";
import { parseTimestamp } from "./types.js";

export interface StolenDeviceResponse {
  readonly ownerId: string;
  readonly deviceId: string;
  readonly containedAt: string;
  readonly revokedSessionIds: readonly string[];
}

function latestSessionEventMs(session: AuthSessionRecord): number {
  return Math.max(
    parseTimestamp(session.createdAt, "createdAt"),
    parseTimestamp(session.lastValidatedAt, "lastValidatedAt"),
    session.lastVerifiedAt ? parseTimestamp(session.lastVerifiedAt, "lastVerifiedAt") : Number.NEGATIVE_INFINITY,
    session.lockedAt ? parseTimestamp(session.lockedAt, "lockedAt") : Number.NEGATIVE_INFINITY,
    session.revokedAt ? parseTimestamp(session.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY,
    session.riskDetectedAt ? parseTimestamp(session.riskDetectedAt, "riskDetectedAt") : Number.NEGATIVE_INFINITY
  );
}

function latestDeviceEventMs(device: DeviceRecord): number {
  return Math.max(
    parseTimestamp(device.createdAt, "createdAt"),
    device.lastSeenAt ? parseTimestamp(device.lastSeenAt, "lastSeenAt") : Number.NEGATIVE_INFINITY,
    device.revokedAt ? parseTimestamp(device.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY
  );
}

export class DeviceIncidentResponse {
  constructor(
    private readonly sessions: AuthSessionStore,
    private readonly devices: DeviceRegistry
  ) {}

  containStolenDevice(ownerId: string, deviceId: string, containedAt: string): StolenDeviceResponse {
    if (!ownerId.trim() || !deviceId.trim()) throw new Error("ownerId and deviceId are required");
    const atMs = parseTimestamp(containedAt, "containedAt");
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Unknown device: ${deviceId}`);
    if (device.ownerId !== ownerId) throw new Error("Device owner mismatch");

    const revocableSessions = this.sessions.listByOwner(ownerId).filter(
      (session) => session.deviceId === deviceId && (session.state === "active" || session.state === "locked")
    );

    if (atMs < latestDeviceEventMs(device)) throw new Error("Stolen-device containment cannot move device time backward");
    for (const session of revocableSessions) {
      if (atMs < latestSessionEventMs(session)) throw new Error(`Stolen-device containment cannot move session time backward: ${session.id}`);
    }

    if (device.trustState !== "revoked") this.devices.revoke(deviceId, containedAt);
    const revokedSessionIds: string[] = [];
    for (const session of revocableSessions) {
      this.sessions.revoke(session.id, containedAt, "stolen_device");
      revokedSessionIds.push(session.id);
    }

    return Object.freeze({
      ownerId,
      deviceId,
      containedAt,
      revokedSessionIds: Object.freeze(revokedSessionIds)
    });
  }
}
