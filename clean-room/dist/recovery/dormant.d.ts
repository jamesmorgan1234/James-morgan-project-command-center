export type CapabilityLifecycleState = "configure" | "connect" | "authorize" | "enable" | "disabled" | "dormant";
export interface DormantCapability {
    readonly key: string;
    readonly state: CapabilityLifecycleState;
    readonly contractVersion: number;
    readonly dataVersion: number;
    readonly requiredProviderCapabilities: readonly string[];
}
export declare function reactivationPath(capability: DormantCapability, providerCapabilities: readonly string[]): readonly CapabilityLifecycleState[];
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export interface DormantRecoveryContract {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly kind: 'capability' | 'specialist' | 'procedure' | 'promotion';
    readonly canonicalOwnerRef: string;
    readonly state: 'dormant' | 'disabled' | 'archived' | 'revoked';
    readonly contractVersion: number;
    readonly dataVersion: number;
    readonly priorPolicyEpoch: number;
    readonly priorRevocationEpoch: number;
    readonly requiredProviderCapabilities: readonly string[];
    readonly evidenceIds: readonly string[];
}
export interface DormantCurrentState {
    readonly scope: RecoveryScope;
    readonly canonicalOwnerRef: string;
    readonly currentContractVersion: number;
    readonly compatibleDataVersions: readonly number[];
    readonly providerCapabilities: readonly string[];
    readonly providerAvailable: boolean;
    readonly cost: 'free' | 'paid' | 'unknown';
    readonly policyEpoch: number;
    readonly revocationEpoch: number;
    readonly policyAllowed: boolean;
    readonly privacyAllowed: boolean;
    readonly revoked: boolean;
    readonly obsolete: boolean;
    readonly revalidatedAt: string;
    readonly expiresAt: string;
    readonly completedStages: readonly ('configure' | 'connect' | 'authorize' | 'enable')[];
}
export declare function prepareDormantReactivation(a: RecoveryAccess, d: DormantRecoveryContract, c: DormantCurrentState): {
    id: string;
    canonicalOwnerRef: string;
    path: readonly CapabilityLifecycleState[];
    nextStage: CapabilityLifecycleState | null;
    readyForCanonicalActivation: boolean;
    automaticallyEnabled: false;
    authorizationGranted: false;
    currentPolicyEpoch: number;
    currentRevocationEpoch: number;
};
