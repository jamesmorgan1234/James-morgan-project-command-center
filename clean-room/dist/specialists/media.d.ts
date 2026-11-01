export type MediaWorkflowStage = "research" | "production" | "publishing" | "analytics" | "revenue";
export type MediaWorkerMode = "manual" | "project_auto" | "portfolio_auto";
export interface MediaSourceEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly sourceRef: string;
    readonly contentRef: string;
    readonly rightsRefs: readonly string[];
    readonly provenanceRefs: readonly string[];
    readonly observedAt: string;
}
export interface MediaWorkflowRoute {
    readonly stage: MediaWorkflowStage;
    readonly capabilityKey: string;
    readonly providerAdapterKey?: string;
    readonly protectedAction: boolean;
}
export interface MediaSpecialistProfile {
    readonly key: "media";
    readonly truthOwner: "specialist:media";
    readonly projectRef: string;
    readonly routes: readonly MediaWorkflowRoute[];
    readonly autonomousWorkerModes: readonly MediaWorkerMode[];
    readonly sourceRefs: readonly string[];
}
export declare const MEDIA_SPECIALIST_PROFILE: MediaSpecialistProfile;
export declare function validateMediaSourceEvidence(evidence: MediaSourceEvidence): MediaSourceEvidence;
export declare function requireMediaRoute(profile: MediaSpecialistProfile, stage: MediaWorkflowStage): MediaWorkflowRoute;
export declare function assertMediaWorkerModeAllowed(profile: MediaSpecialistProfile, mode: MediaWorkerMode): void;
export declare function assertMediaPublishReady(source: MediaSourceEvidence, authorizationRef?: string): void;
