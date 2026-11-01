import { parseTimestamp } from "./types.js";
function settingId(ownerId, scope, key, deviceId) {
    return `${ownerId}\u0000${scope}\u0000${deviceId ?? ""}\u0000${key}`;
}
function assertValue(value) {
    if (typeof value === "number" && !Number.isFinite(value))
        throw new Error("Security setting numbers must be finite");
    if (typeof value === "string" && !value.trim())
        throw new Error("Security setting strings cannot be blank");
}
export class SecuritySettingsRegistry {
    devices;
    #records = new Map();
    constructor(devices) {
        this.devices = devices;
    }
    setGlobal(ownerId, key, value, updatedAt) {
        return this.#set({ ownerId, scope: "global", key, value, updatedAt });
    }
    setDevice(ownerId, deviceId, key, value, updatedAt) {
        if (!deviceId.trim())
            throw new Error("deviceId is required");
        this.devices.assertUsable(deviceId, ownerId);
        return this.#set({ ownerId, scope: "device", deviceId, key, value, updatedAt });
    }
    resolve(ownerId, key, deviceId) {
        if (!ownerId.trim() || !key.trim())
            throw new Error("ownerId and setting key are required");
        if (deviceId !== undefined) {
            if (!deviceId.trim())
                throw new Error("deviceId cannot be blank");
            this.devices.assertUsable(deviceId, ownerId);
            const local = this.#records.get(settingId(ownerId, "device", key, deviceId));
            if (local)
                return local;
        }
        return this.#records.get(settingId(ownerId, "global", key));
    }
    listByOwner(ownerId) {
        if (!ownerId.trim())
            throw new Error("ownerId is required");
        return Object.freeze([...this.#records.values()].filter((record) => record.ownerId === ownerId));
    }
    #set(input) {
        if (!input.ownerId.trim() || !input.key.trim())
            throw new Error("ownerId and setting key are required");
        assertValue(input.value);
        const updatedMs = parseTimestamp(input.updatedAt, "updatedAt");
        const id = settingId(input.ownerId, input.scope, input.key, input.deviceId);
        const current = this.#records.get(id);
        if (current && updatedMs < parseTimestamp(current.updatedAt, "current.updatedAt"))
            throw new Error("Security setting time cannot move backward");
        const stored = Object.freeze({ ...input });
        this.#records.set(id, stored);
        return stored;
    }
}
//# sourceMappingURL=settings.js.map