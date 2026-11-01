import type { SocialIdentityMapRecord, SocialPlatform } from "./identity.js";
export type ConnectionState = "connected" | "disconnected" | "expired" | "revoked";
export type ProviderHealth = "available" | "degraded" | "unavailable";
export type CredentialState = "healthy" | "degraded" | "expired" | "revoked" | "unknown";
export interface SocialConnection {
    readonly accountId: string;
    readonly platform?: SocialPlatform;
    readonly state: ConnectionState;
    readonly credentialRef: string;
    readonly credentialState?: CredentialState;
    readonly grantedScopes: readonly string[];
    readonly providerHealth: ProviderHealth;
    readonly verifiedAt: string;
    readonly tokenPresent: boolean;
    readonly tokenExpiresAt?: string;
}
export declare function connectionIsLive(connection: SocialConnection, requiredScopes: readonly string[], now?: string, maxAgeMs?: number): boolean;
export declare function requiredOwnerConnectionAction(connection: SocialConnection, requiredScopes?: readonly string[], now?: string): string | null;
export interface SocialConnectionEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly canonicalAccountId: string;
    readonly platformIdentityId: string;
    readonly platform?: SocialPlatform;
    readonly state: ConnectionState;
    readonly credentialRef?: string;
    readonly credentialState?: CredentialState;
    readonly grantedScopes: readonly string[];
    readonly providerHealth: ProviderHealth;
    readonly tokenPresent: boolean;
    readonly tokenExpiresAt?: string;
    readonly verifiedAt: string;
    readonly observedAt: string;
    readonly requiredOwnerActionRef?: string;
    readonly reconnectRef?: string;
    readonly evidenceRefs: readonly string[];
}
export interface SocialConnectionAssessment {
    readonly connectionId: string;
    readonly canonicalAccountId: string;
    readonly state: ConnectionState;
    readonly providerHealth: ProviderHealth;
    readonly live: boolean;
    readonly tokenFresh: boolean;
    readonly missingScopes: readonly string[];
    readonly ownerActionRequired: boolean;
    readonly ownerActionRef?: string;
    readonly reconnectRef?: string;
    readonly credentialRef?: string;
    readonly credentialState?: CredentialState;
    readonly secretsExposed: false;
    readonly protectedActionAuthorized: false;
}
export declare function assessSocialConnection(connection: SocialConnectionEvidence, requiredScopes: readonly string[], now: string, maxVerificationAgeMs: number): SocialConnectionAssessment;
export declare function assessSocialConnectionForIdentity(connection: SocialConnectionEvidence, identity: SocialIdentityMapRecord, requiredScopes: readonly string[], now: string, maxAgeMs: number): SocialConnectionAssessment;
export interface SocialDisconnectImpact {
    readonly accountId: string;
    readonly connectionWillBeLost: true;
    readonly publishingWillBeBlocked: true;
    readonly inboxWillBeBlocked: true;
    readonly retainedHistory: readonly ("drafts" | "published_content" | "failed_content" | "analytics" | "messages")[];
    readonly secretsDeleted: false;
}
export declare function previewSocialDisconnect(accountId: string): SocialDisconnectImpact;
