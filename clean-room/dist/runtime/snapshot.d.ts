import { type TruthValue } from "../data/canonical.js";
export type RuntimeConnectionState = "connected" | "disconnected" | "degraded" | "stale";
export type SurfaceAvailability = "available" | "unavailable" | "disconnected" | "stale";
export interface RuntimeEvidenceRef {
    readonly source: string;
    readonly observedAt?: string;
    readonly reference?: string;
}
export interface RuntimeLiveExecution {
    readonly runId: string;
    readonly taskId: string;
    readonly status: "working";
    readonly executorClaimed: true;
    readonly lastHeartbeatAt: string;
    readonly currentTaskTitle?: string;
    readonly blocker?: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeNextWorkReadiness {
    readonly workUnitId: string;
    readonly ready: true;
    readonly title: string;
    readonly priorityRank: number;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeProjectDetailSection {
    readonly key: string;
    readonly title: string;
    readonly sortOrder: number;
    readonly required: boolean;
    readonly capabilityKey?: string;
    readonly content: TruthValue<string>;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeProjectSnapshot {
    readonly id: string;
    readonly name: string;
    readonly mission: TruthValue<string>;
    readonly lifecycle: TruthValue<string>;
    readonly verification: TruthValue<string>;
    readonly priority: TruthValue<string>;
    readonly stage: TruthValue<string>;
    readonly status: TruthValue<string>;
    readonly progressPercent: TruthValue<number>;
    readonly currentCheckpoint: TruthValue<string>;
    readonly nextAction: TruthValue<string>;
    readonly blockers: TruthValue<readonly string[]>;
    readonly needsMeCount: TruthValue<number>;
    readonly agencyState: TruthValue<string>;
    readonly recentActivity: TruthValue<readonly string[]>;
    readonly evidence: readonly RuntimeEvidenceRef[];
    readonly liveExecution?: TruthValue<RuntimeLiveExecution>;
    readonly nextWorkReadiness?: TruthValue<RuntimeNextWorkReadiness>;
    readonly typeKey?: TruthValue<string>;
    readonly companyId?: TruthValue<string>;
    readonly detailSections?: readonly RuntimeProjectDetailSection[];
    readonly specialistKey?: string;
}
export interface RuntimeAgencyRunSnapshot {
    readonly runId: string;
    readonly projectId: string;
    readonly objective: string;
    readonly controlMode: string;
    readonly state: string;
    readonly generation: number;
    readonly priority: number;
    readonly stopRequested: boolean;
    readonly pauseRequested: boolean;
    readonly blocker?: string;
    readonly checkpointId?: string;
    readonly updatedAt: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeAgencyJobSnapshot {
    readonly jobId: string;
    readonly runId: string;
    readonly projectId: string;
    readonly objective: string;
    readonly state: string;
    readonly risk: string;
    readonly costClass: string;
    readonly preferredEnvironment: string;
    readonly capability: string;
    readonly retryCount: number;
    readonly blocker?: string;
    readonly checkpointRef?: string;
    readonly updatedAt: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeAgencyTaskSnapshot {
    readonly taskId: string;
    readonly jobId: string;
    readonly runId: string;
    readonly projectId: string;
    readonly title: string;
    readonly state: string;
    readonly capability: string;
    readonly risk: string;
    readonly costClass: string;
    readonly preferredEnvironment: string;
    readonly retryCount: number;
    readonly blocker?: string;
    readonly checkpointRef?: string;
    readonly verificationRefs: readonly string[];
    readonly updatedAt: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeAgencySnapshot {
    readonly availability: SurfaceAvailability;
    readonly runs: readonly RuntimeAgencyRunSnapshot[];
    readonly jobs: readonly RuntimeAgencyJobSnapshot[];
    readonly tasks: readonly RuntimeAgencyTaskSnapshot[];
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeBrainConversationTurn {
    readonly id: string;
    readonly conversationId: string;
    readonly projectId?: string;
    readonly role: "owner" | "brain" | "system";
    readonly intent?: string;
    readonly protectedActionPossible: boolean;
    readonly redactionState: "safe_text" | "redacted" | "reference_only";
    readonly content: TruthValue<string>;
    readonly contentRef: string;
    readonly createdAt: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeBrainConversation {
    readonly id: string;
    readonly projectId?: string;
    readonly title: string;
    readonly state: "active" | "closed";
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly turns: readonly RuntimeBrainConversationTurn[];
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeBrainProjectWorkspace {
    readonly projectId: string;
    readonly version: number;
    readonly specVersion: number;
    readonly conversationId: TruthValue<string>;
    readonly turnIds: readonly string[];
    readonly decisionRefs: readonly string[];
    readonly executionRunId: TruthValue<string>;
    readonly blockerRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly verifiedResultRefs: readonly string[];
    readonly updatedAt: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeBrainImprovementProposal {
    readonly id: string;
    readonly projectId?: string;
    readonly area: "roadmap_gap" | "manual_work" | "fragility" | "provider" | "cost" | "security" | "historical_lesson" | "quality";
    readonly title: string;
    readonly detailRef: string;
    readonly detailHash: string;
    readonly confidence: number;
    readonly evidenceRefs: readonly string[];
    readonly state: "proposed" | "accepted" | "rejected" | "converted_to_scope";
    readonly installsAutomatically: false;
    readonly createdAt: string;
    readonly decidedAt?: string;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeBrainSnapshot {
    readonly availability: SurfaceAvailability;
    readonly conversations: readonly RuntimeBrainConversation[];
    readonly workspaces: readonly RuntimeBrainProjectWorkspace[];
    readonly improvements: readonly RuntimeBrainImprovementProposal[];
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface RuntimeSurfaceSnapshot {
    readonly key: string;
    readonly label: string;
    readonly availability: SurfaceAvailability;
    readonly summary: TruthValue<string>;
    readonly evidence: readonly RuntimeEvidenceRef[];
}
export interface CommandCenterRuntimeSnapshot {
    readonly schemaVersion: "cc-runtime-snapshot-v1";
    readonly generatedAt: string;
    readonly connection: Readonly<{
        state: RuntimeConnectionState;
        providerId: string;
        message: string;
        lastSuccessfulSyncAt: TruthValue<string>;
    }>;
    readonly owner: Readonly<{
        displayName: TruthValue<string>;
    }>;
    readonly projects: readonly RuntimeProjectSnapshot[];
    readonly surfaces: readonly RuntimeSurfaceSnapshot[];
    readonly agency?: RuntimeAgencySnapshot;
    readonly brain?: RuntimeBrainSnapshot;
    readonly release: Readonly<{
        releaseId: TruthValue<string>;
        knownGoodReleaseId: TruthValue<string>;
    }>;
}
export declare function createDisconnectedRuntimeSnapshot(providerId?: string, generatedAt?: string): CommandCenterRuntimeSnapshot;
export declare function createFixtureRuntimeSnapshot(overrides?: Partial<CommandCenterRuntimeSnapshot>): CommandCenterRuntimeSnapshot;
