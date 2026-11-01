import { parseTimestamp } from "./types.js";
function latestSessionEventMs(session) {
    return Math.max(parseTimestamp(session.createdAt, "createdAt"), parseTimestamp(session.lastValidatedAt, "lastValidatedAt"), session.lastVerifiedAt ? parseTimestamp(session.lastVerifiedAt, "lastVerifiedAt") : Number.NEGATIVE_INFINITY, session.lockedAt ? parseTimestamp(session.lockedAt, "lockedAt") : Number.NEGATIVE_INFINITY, session.revokedAt ? parseTimestamp(session.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY, session.riskDetectedAt ? parseTimestamp(session.riskDetectedAt, "riskDetectedAt") : Number.NEGATIVE_INFINITY);
}
function latestDeviceEventMs(device) {
    return Math.max(parseTimestamp(device.createdAt, "createdAt"), device.lastSeenAt ? parseTimestamp(device.lastSeenAt, "lastSeenAt") : Number.NEGATIVE_INFINITY, device.revokedAt ? parseTimestamp(device.revokedAt, "revokedAt") : Number.NEGATIVE_INFINITY);
}
export class DeviceIncidentResponse {
    sessions;
    devices;
    constructor(sessions, devices) {
        this.sessions = sessions;
        this.devices = devices;
    }
    containStolenDevice(ownerId, deviceId, containedAt) {
        if (!ownerId.trim() || !deviceId.trim())
            throw new Error("ownerId and deviceId are required");
        const atMs = parseTimestamp(containedAt, "containedAt");
        const device = this.devices.get(deviceId);
        if (!device)
            throw new Error(`Unknown device: ${deviceId}`);
        if (device.ownerId !== ownerId)
            throw new Error("Device owner mismatch");
        const revocableSessions = this.sessions.listByOwner(ownerId).filter((session) => session.deviceId === deviceId && (session.state === "active" || session.state === "locked"));
        if (atMs < latestDeviceEventMs(device))
            throw new Error("Stolen-device containment cannot move device time backward");
        for (const session of revocableSessions) {
            if (atMs < latestSessionEventMs(session))
                throw new Error(`Stolen-device containment cannot move session time backward: ${session.id}`);
        }
        if (device.trustState !== "revoked")
            this.devices.revoke(deviceId, containedAt);
        const revokedSessionIds = [];
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
//# sourceMappingURL=device-response.js.map