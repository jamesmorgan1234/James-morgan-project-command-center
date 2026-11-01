export interface OwnerSessionDescriptor {
    readonly sessionId: string;
    readonly deviceId?: string;
    readonly deviceLabel: string;
    readonly platform?: string;
    readonly trustState: string;
    readonly assurance: string;
    readonly sessionCreatedAt: string;
    readonly lastSeenAt: string;
    readonly notAfter?: string;
    readonly revokedAt?: string;
    readonly revokedReason?: string;
    readonly isCurrent: boolean;
}
export interface OwnerSessionSettingsActions {
    listOwnerSessions(): Promise<readonly OwnerSessionDescriptor[]>;
    revokeOwnerSession(sessionId: string): Promise<void>;
    revokeOwnerDevice(deviceId: string): Promise<void>;
}
export declare function installOwnerSessionSettings(actions: OwnerSessionSettingsActions): void;
