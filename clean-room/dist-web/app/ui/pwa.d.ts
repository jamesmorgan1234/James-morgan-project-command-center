export type UpdateState = "idle" | "checking" | "available" | "downloading" | "verified" | "activating" | "active" | "rolled_back" | "failed";
export interface ReleaseIdentity {
    readonly releaseId: string;
    readonly buildHash: string;
    readonly assetManifestHash: string;
    readonly schemaCompatibility: string;
}
export interface PwaShellContract {
    readonly manifestPath: "/manifest.webmanifest";
    readonly serviceWorkerPath: "/sw.js";
    readonly serviceWorkerScope: "/";
    readonly offlineFallbackRoute: "/offline";
    readonly staticShellCached: true;
    readonly approvedIconRequired: true;
    readonly updateStateExplicit: true;
    readonly staleWorkerRecoverable: true;
    readonly versionVisible: true;
    readonly cachedShellNeverImpliesFreshBusinessData: true;
    readonly incompatibleSchemaActivationBlocked: true;
}
export declare const COMMAND_CENTER_PWA_SHELL: PwaShellContract;
export declare class PwaUpdateCoordinator {
    #private;
    get state(): UpdateState;
    get candidate(): ReleaseIdentity | undefined;
    get knownGood(): ReleaseIdentity | undefined;
    transition(to: UpdateState): void;
    setCandidate(candidate: ReleaseIdentity): void;
    candidateIsSchemaCompatible(currentSchemaCompatibility: string): boolean;
    markActive(): void;
    rollback(): ReleaseIdentity;
}
export interface OfflinePolicy {
    readonly shellAvailableOffline: boolean;
    readonly queueWritesWhileOffline: false;
    readonly showStaleness: true;
    readonly protectedActionsOffline: false;
}
export declare const COMMAND_CENTER_OFFLINE_POLICY: OfflinePolicy;
