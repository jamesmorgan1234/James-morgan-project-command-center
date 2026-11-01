import type { AuthSessionStore } from "../security/auth.js";
import type { PolicyEngine } from "../security/policy.js";
import type { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import type { SocialIdentityMapRecord } from "./identity.js";
export interface SocialRecoveryRecord {
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly credentialRef: string;
    readonly providerState: "connected" | "disconnected" | "expired" | "revoked";
    readonly paidActionAuthorized: boolean;
    readonly sourceRefs: readonly string[];
}
export interface SocialDisconnectImpactPreview {
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly platform: string;
    readonly losesPublishing: boolean;
    readonly losesInboxSync: boolean;
    readonly losesAnalyticsRefresh: boolean;
    readonly retainedHistoryRefs: readonly string[];
    readonly destructiveHistoryDeletion: false;
    readonly evidenceRefs: readonly string[];
}
export interface SocialPlatformOutageIsolation {
    readonly platform: string;
    readonly affectedAccountIds: readonly string[];
    readonly unaffectedAccountIds: readonly string[];
    readonly crossPlatformBlocked: false;
}
export declare function assertSocialIsolation(records: readonly SocialRecoveryRecord[]): void;
export declare function assertPaidActionAllowed(_record: SocialRecoveryRecord, _exactAuthorizationRef?: string): void;
export declare function recoveryAction(record: SocialRecoveryRecord): "none" | "reconnect" | "reauthorize";
export declare function buildDisconnectImpactPreview(input: Omit<SocialDisconnectImpactPreview, "destructiveHistoryDeletion">): SocialDisconnectImpactPreview;
export declare function isolatePlatformOutage(platform: string, accounts: readonly Readonly<{
    accountId: string;
    platform: string;
}>[]): SocialPlatformOutageIsolation;
export type SocialRecoveryKind = "connection_loss" | "credential_rotation" | "provider_outage" | "identity_conflict" | "scope_loss";
export type SocialRecoveryStatus = "open" | "needs_owner" | "reconciling" | "recovered" | "blocked";
export type SocialRecoveryAction = "none" | "reconnect" | "reauthorize" | "wait_provider" | "reconcile_identity" | "restore_scope";
export interface SocialAccountIsolationBinding {
    readonly ownerId: string;
    readonly entityId: string;
    readonly companyId?: string;
    readonly brandId: string;
    readonly projectId?: string;
    readonly accountId: string;
    readonly platformIdentityId: string;
    readonly credentialRef?: string;
    readonly evidenceRefs: readonly string[];
}
export interface SocialRecoveryCase {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly kind: SocialRecoveryKind;
    readonly status: SocialRecoveryStatus;
    readonly providerState: "connected" | "disconnected" | "expired" | "revoked" | "unavailable";
    readonly missingScopes: readonly string[];
    readonly observedAt: string;
    readonly evidenceRefs: readonly string[];
    readonly ownerActionRef?: string;
    readonly reconnectRef?: string;
    readonly secretsExposed: false;
    readonly protectedActionAuthorized: false;
}
export interface SocialRecoveryAssessment {
    readonly caseId: string;
    readonly action: SocialRecoveryAction;
    readonly ownerActionRequired: boolean;
    readonly recoverable: boolean;
    readonly secretsExposed: false;
    readonly protectedActionAuthorized: false;
}
export interface PaidSocialActionRequest {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly actionKind: string;
    readonly amount: number;
    readonly currency: string;
    readonly providerState: "connected" | "disconnected" | "expired" | "revoked" | "unavailable";
}
export interface PaidSocialActionAuthorization {
    readonly authorizationRef: string;
    readonly ownerId: string;
    readonly accountId: string;
    readonly actionId: string;
    readonly actionKind: string;
    readonly maxAmount: number;
    readonly currency: string;
    readonly observedAt: string;
    readonly expiresAt: string;
}
export interface PaidSocialActionAssessment {
    readonly actionId: string;
    readonly protectedActionAuthorized: false;
    readonly allowed: boolean;
    readonly reason: "authorized" | "missing_exact_authorization" | "authorization_mismatch" | "authorization_expired" | "provider_not_connected" | "amount_exceeds_authorization";
    readonly authorizationRef?: string;
}
export declare class SocialIsolationRegistry {
    #private;
    bind(binding: SocialAccountIsolationBinding): SocialAccountIsolationBinding;
}
export declare function assessSocialRecovery(recovery: SocialRecoveryCase): SocialRecoveryAssessment;
export interface PaidSocialAuthority {
    readonly sessions: AuthSessionStore;
    readonly policies: PolicyEngine;
    readonly authorizations: ProtectedAuthorizationRegistry;
    readonly sessionId: string;
    readonly identity: SocialIdentityMapRecord;
}
export declare function paidSocialAuthorizationBinding(request: PaidSocialActionRequest, identity: SocialIdentityMapRecord): string;
export declare function assessPaidSocialAction(request: PaidSocialActionRequest, authorization: PaidSocialActionAuthorization | undefined, now: string, authority?: PaidSocialAuthority): PaidSocialActionAssessment;
