export type ChaosFault = "db" | "network" | "provider" | "cache" | "worker" | "scheduler" | "lead" | "partition" | "stale_lease" | "duplicate_delivery" | "disk_exhaustion" | "resource_exhaustion";
export interface ChaosScenario {
    readonly fault: ChaosFault;
    readonly fencingEnabled: boolean;
    readonly durableCheckpointRef: string;
    readonly staleMutationAccepted: boolean;
    readonly resumedFromCheckpoint: boolean;
}
export declare function verifyChaosOutcome(scenario: ChaosScenario): void;
import { type RecoveryProjection } from './restore.js';
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export declare const RECOVERY_CHAOS_FAULTS: readonly ChaosFault[];
export interface ShadowRecoveryManifest {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly classification: 'synthetic' | 'copied';
    readonly sourceDigest: string;
    readonly versionRefs: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly maximumEvents: number;
    readonly maximumCheckpointBytes: number;
    readonly copiedDataPrivacyApproved: boolean;
}
export interface ShadowRecoveryEvent {
    readonly id: string;
    readonly recordId: string;
    readonly value: number;
}
/** Closed local fault interpreter: no network, provider, filesystem or protected-effect callback exists. */
export declare function runIsolatedRecoveryChaos(a: RecoveryAccess, m: ShadowRecoveryManifest, source: readonly RecoveryProjection[], events: readonly ShadowRecoveryEvent[], fault: ChaosFault): Promise<{
    id: string;
    fault: ChaosFault;
    classification: "synthetic" | "copied";
    versionRefs: readonly string[];
    sourceDigest: string;
    checkpointRef: string;
    checkpointDigest: string;
    resultDigest: string;
    baselineDigest: string;
    decisions: string[];
    failureObserved: true;
    staleWorkerRejected: boolean;
    staleLeaderRejected: boolean;
    generation: number;
    resumed: boolean;
    productionSideEffects: boolean;
    authorizationGranted: boolean;
    benchmarkClass: "simulation";
    rootCauseConfidence: number;
    rootCauseBasis: string;
    affectedLearningRequiresRevalidation: boolean;
}>;
