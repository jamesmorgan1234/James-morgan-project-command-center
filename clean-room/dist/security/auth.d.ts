import type { EnvironmentName } from "../kernel/config.js";
import { type AssuranceLevel, type SessionState } from "./types.js";
export interface AuthSessionRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly deviceId?: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
    readonly authProviderId?: string;
    readonly providerSessionRef?: string;
    readonly scopes: readonly string[];
    readonly assurance: AssuranceLevel;
    readonly state: SessionState;
    readonly createdAt: string;
    readonly expiresAt: string;
    readonly lastValidatedAt: string;
    readonly lastVerifiedAt?: string;
    readonly policyEpoch?: number;
    readonly lockedAt?: string;
    readonly revokedAt?: string;
    readonly revocationReason?: string;
    readonly riskDetectedAt?: string;
}
export interface AuthProviderSignInRequest {
    readonly sessionId: string;
    readonly ownerId: string;
    readonly now: string;
    readonly expiresAt: string;
    readonly deviceId?: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
}
export interface AuthProviderAssertion {
    readonly ownerId: string;
    readonly assurance: AssuranceLevel;
    readonly scopes: readonly string[];
    readonly providerSessionRef: string;
    readonly authenticatedAt: string;
}
export interface AuthProviderRecoveryRequest {
    readonly ownerId: string;
    readonly now: string;
}
export interface AuthProviderRecoveryAssertion {
    readonly ownerId: string;
    readonly recoveryRef: string;
    readonly recoveredAt: string;
}
export interface AuthRecoveryResult {
    readonly state: "verified_requires_sign_in";
    readonly ownerId: string;
    readonly authProviderId: string;
    readonly recoveryRef: string;
    readonly recoveredAt: string;
    readonly revokedSessionIds: readonly string[];
}
export interface AuthProvider {
    readonly id: string;
    authenticate(request: Readonly<AuthProviderSignInRequest>): AuthProviderAssertion;
    signOut(providerSessionRef: string): void;
    recover?(request: Readonly<AuthProviderRecoveryRequest>): AuthProviderRecoveryAssertion;
}
export declare class AuthSessionStore {
    #private;
    register(session: AuthSessionRecord): void;
    get(id: string): AuthSessionRecord | undefined;
    listByOwner(ownerId: string): readonly AuthSessionRecord[];
    validateLive(id: string, now: string): AuthSessionRecord;
    recordVerification(id: string, assurance: AssuranceLevel, verifiedAt: string): AuthSessionRecord;
    markRisky(id: string, detectedAt: string): AuthSessionRecord;
    clearRisk(id: string, assurance: AssuranceLevel, verifiedAt: string): AuthSessionRecord;
    setPolicyEpoch(id: string, policyEpoch: number, at: string): AuthSessionRecord;
    lock(id: string, lockedAt: string): AuthSessionRecord;
    unlock(id: string, assurance: AssuranceLevel, verifiedAt: string): AuthSessionRecord;
    revoke(id: string, revokedAt: string, reason: string): AuthSessionRecord;
}
export declare class AuthenticationService {
    #private;
    readonly sessions: AuthSessionStore;
    constructor(sessions: AuthSessionStore);
    registerProvider(provider: AuthProvider): void;
    signIn(providerId: string, request: AuthProviderSignInRequest): AuthSessionRecord;
    signOut(sessionId: string, at: string): AuthSessionRecord;
    recover(providerId: string, request: AuthProviderRecoveryRequest): AuthRecoveryResult;
}
