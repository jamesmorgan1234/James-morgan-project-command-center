import { AuthSessionStore, type AuthSessionRecord } from "./auth.js";
import { DeviceRegistry, type DeviceRecord } from "./devices.js";
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

function sessionItem(session: AuthSessionRecord): OwnerSessionInventoryItem {
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

function deviceItem(device: DeviceRecord): OwnerDeviceInventoryItem {
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
  constructor(
    private readonly sessions: AuthSessionStore,
    private readonly devices: DeviceRegistry
  ) {}

  snapshot(ownerId: string): OwnerSecurityInventorySnapshot {
    if (!ownerId.trim()) throw new Error("Inventory ownerId is required");
    return Object.freeze({
      ownerId,
      sessions: Object.freeze(this.sessions.listByOwner(ownerId).map(sessionItem)),
      devices: Object.freeze(this.devices.listByOwner(ownerId).map(deviceItem))
    });
  }
}
