function sessionItem(session) {
    return Object.freeze({
        id: session.id,
        state: session.state,
        assurance: session.assurance,
        lastActivityAt: session.lastValidatedAt,
        scopes: Object.freeze([...session.scopes]),
        ...(session.deviceId !== undefined ? { deviceId: session.deviceId } : {}),
        ...(session.projectId !== undefined ? { projectId: session.projectId } : {}),
        ...(session.companyId !== undefined ? { companyId: session.companyId } : {}),
        ...(session.accountId !== undefined ? { accountId: session.accountId } : {}),
        ...(session.environment !== undefined ? { environment: session.environment } : {}),
        ...(session.authProviderId !== undefined ? { authProviderId: session.authProviderId } : {})
    });
}
function deviceItem(device) {
    return Object.freeze({
        id: device.id,
        label: device.label,
        platform: device.platform,
        trustState: device.trustState,
        createdAt: device.createdAt,
        ...(device.lastSeenAt !== undefined ? { lastActivityAt: device.lastSeenAt } : {}),
        ...(device.revokedAt !== undefined ? { revokedAt: device.revokedAt } : {})
    });
}
export class SecurityInventory {
    sessions;
    devices;
    constructor(sessions, devices) {
        this.sessions = sessions;
        this.devices = devices;
    }
    snapshot(ownerId) {
        if (!ownerId.trim())
            throw new Error("Inventory ownerId is required");
        return Object.freeze({
            ownerId,
            sessions: Object.freeze(this.sessions.listByOwner(ownerId).map(sessionItem)),
            devices: Object.freeze(this.devices.listByOwner(ownerId).map(deviceItem))
        });
    }
}
//# sourceMappingURL=inventory.js.map