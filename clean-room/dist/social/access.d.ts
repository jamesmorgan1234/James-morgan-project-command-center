import type { AuthSessionStore } from "../security/auth.js";
import type { PolicyEngine } from "../security/policy.js";
import type { SocialIdentityMapRecord } from "./identity.js";
export interface SocialAccountCapability {
    readonly ownerId: string;
    readonly sessionId: string;
    readonly accountId: string;
    readonly brandId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly dataClasses: readonly string[];
    readonly canWrite: boolean;
    readonly verifiedAt: string;
    readonly expiresAt: string;
    readonly revoked: boolean;
    readonly contained: boolean;
}
export interface SocialAccountPermissionView {
    readonly ownerId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly platform: string;
    readonly platformIdentityId: string;
    readonly readableDataClasses: readonly string[];
    readonly canWrite: boolean;
    readonly revoked: boolean;
    readonly contained: boolean;
    readonly verifiedAt: string;
    readonly expiresAt: string;
    readonly secretsExposed: false;
}
export interface SocialAccountMetadataExport {
    readonly ownerId: string;
    readonly entityId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly platform: string;
    readonly platformIdentityId: string;
    readonly displayName: string;
    readonly aliases: readonly string[];
    readonly version: number;
    readonly secretsExposed: false;
}
export declare class SocialAccessBoundary {
    readonly sessions: AuthSessionStore;
    readonly policies: PolicyEngine;
    readonly identityLookup: (accountId: string) => SocialIdentityMapRecord | undefined;
    readonly capabilityLookup: (sessionId: string, accountId: string) => SocialAccountCapability | undefined;
    readonly clock: () => string;
    constructor(sessions: AuthSessionStore, policies: PolicyEngine, identityLookup: (accountId: string) => SocialIdentityMapRecord | undefined, capabilityLookup: (sessionId: string, accountId: string) => SocialAccountCapability | undefined, clock?: () => string);
    authorize(sessionId: string, accountId: string, requested: readonly string[], now: string, write?: boolean): Readonly<{
        identity: Readonly<{
            ownerId: string;
            entityId: string;
            companyId: string | undefined;
            brandId: string;
            projectId: string | undefined;
            accountIdentityId: string;
            platform: import("./identity.js").SocialPlatform;
            platformIdentityId: string;
            version: number;
        }>;
        dataClasses: readonly string[];
        protectedActionAuthorized: false;
    }>;
    permissionView(sessionId: string, accountId: string, now: string): SocialAccountPermissionView;
}
export declare function exportSocialAccountMetadata(identity: SocialIdentityMapRecord): SocialAccountMetadataExport;
export interface SocialRecoverySnapshot {
    readonly schemaVersion: 1;
    readonly ownerId: string;
    readonly accountId: string;
    readonly platformIdentityId: string;
    readonly records: readonly Readonly<{
        id: string;
        kind: "draft" | "asset_reference" | "metric_observation" | "untrusted_message";
        value: unknown;
    }>[];
    readonly evidenceRefs: readonly string[];
}
export declare function socialRecoverySnapshotHash(snapshot: SocialRecoverySnapshot): Promise<string>;
export declare function planSocialDataRestore(boundary: SocialAccessBoundary, sessionId: string, now: string, snapshot: SocialRecoverySnapshot, knownGoodHash: string): Promise<Readonly<{
    recordIds: readonly string[];
    stagingOnly: true;
    replayAllowed: false;
    restoreAuthority: false;
    currentRevocationsRevalidated: true;
}>>;
export declare function queueSocialInboxFollowUp(queue: import("../personal/needs-me.js").NeedsMeQueue, boundary: SocialAccessBoundary, sessionId: string, message: import("./inbox.js").EvidenceBackedExternalMessage, dueAt: string, ownerRequestRef: string, now: string): Readonly<{
    needId: string;
    sendAuthorized: false;
    externalInstructionAuthority: "none";
}>;
