import { type AnalyticsEventEnvelope, type AnalyticsEventName, type AnalyticsSource, type AnalyticsValue, type CoreJourney } from "./measurement-schema.js";
import { PrivacySafeAnalyticsEmitter, type TelemetryConsent, type TelemetryDeliveryResult } from "./privacy-instrumentation.js";
export interface JourneyEventContext {
    eventId: string;
    occurredAt: string;
    source: AnalyticsSource;
    sessionId: string;
    journeyId: string;
    subjectId?: string;
    projectId?: string;
    integrationId?: string;
    runId?: string;
    expertId?: string;
    dotId?: string;
    supportCaseId?: string;
}
export declare class CoreJourneyInstrumentation {
    private readonly emitter;
    private readonly consent;
    constructor(emitter: PrivacySafeAnalyticsEmitter, consent: TelemetryConsent);
    start(journey: CoreJourney, context: JourneyEventContext, properties?: Readonly<Record<string, AnalyticsValue>>): Promise<TelemetryDeliveryResult>;
    succeed(journey: CoreJourney, context: JourneyEventContext, options?: {
        eventName?: AnalyticsEventName;
        properties?: Readonly<Record<string, AnalyticsValue>>;
        durationMs?: number;
    }): Promise<TelemetryDeliveryResult>;
    fail(journey: CoreJourney, context: JourneyEventContext, failureCode: string, options?: {
        properties?: Readonly<Record<string, AnalyticsValue>>;
        durationMs?: number;
    }): Promise<TelemetryDeliveryResult>;
}
export interface DashboardInput {
    events: readonly AnalyticsEventEnvelope[];
    actionOpens?: number;
    actionConfirmations?: number;
}
export interface OperatingDashboardSnapshot {
    onboarding: {
        started: number;
        completed: number;
        failed: number;
        completionRate: number | null;
    };
    projectRun: {
        started: number;
        completed: number;
        failed: number;
        successRate: number | null;
        p95LatencyMs: number | null;
    };
    connectedAppFailures: number;
    importFailures: number;
    dotActivity: {
        started: number;
        completed: number;
        failed: number;
    };
    supportVolume: {
        started: number;
        resolved: number;
        escalated: number;
        failed: number;
    };
    confirmationFrequency: number | null;
}
export declare const buildOperatingDashboard: (input: DashboardInput) => OperatingDashboardSnapshot;
export type RolloutStageKey = "local_verification" | "internal_dogfood" | "limited_invited" | "opt_in_beta" | "controlled_percentage" | "broader_launch";
export interface RolloutStage {
    key: RolloutStageKey;
    owner: "engineering" | "release" | "support";
    promotionGates: readonly string[];
    rollbackThresholds: readonly string[];
    requiresExplicitProductionAuthorization: boolean;
}
export declare const ROLLOUT_LADDER: readonly RolloutStage[];
export type KillSwitchKey = "global_automation" | "connectors" | "dots" | "experts";
export interface KillSwitchState {
    key: KillSwitchKey;
    enabled: boolean;
    reason?: string;
}
export interface ContainmentDecision {
    allowed: boolean;
    blockedBy: readonly KillSwitchKey[];
}
export declare const evaluateContainment: (required: readonly KillSwitchKey[], states: readonly KillSwitchState[]) => ContainmentDecision;
export interface RollbackPlaybook {
    trigger: string;
    actions: readonly string[];
    verification: readonly string[];
}
export declare const ROLLBACK_PLAYBOOKS: readonly RollbackPlaybook[];
export type RehearsalKey = "auth_outage" | "connector_outage" | "import_outage" | "elevated_run_failure" | "high_confirmation_friction" | "broken_template_share_path" | "privacy_report_incident" | "support_spike";
export interface LaunchRehearsal {
    key: RehearsalKey;
    expectedContainment: readonly string[];
    expectedEscalation: readonly string[];
    passCriteria: readonly string[];
}
export declare const LAUNCH_REHEARSALS: readonly LaunchRehearsal[];
export interface RehearsalResult {
    key: RehearsalKey;
    containmentObserved: readonly string[];
    escalationObserved: readonly string[];
    criteriaObserved: readonly string[];
}
export declare const rehearsalPasses: (result: RehearsalResult) => boolean;
export declare const assertOperatingReadinessDefinitions: () => void;
