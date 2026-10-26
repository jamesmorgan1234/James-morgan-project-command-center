import {
  ANALYTICS_SCHEMA_VERSION,
  CORE_JOURNEYS,
  INSTRUMENTATION_TARGETS,
  type AnalyticsEventEnvelope,
  type AnalyticsEventName,
  type AnalyticsSource,
  type AnalyticsValue,
  type CoreJourney
} from "./measurement-schema.js";
import {
  PrivacySafeAnalyticsEmitter,
  type TelemetryConsent,
  type TelemetryDeliveryResult
} from "./privacy-instrumentation.js";

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

const envelope = (
  eventName: AnalyticsEventName,
  context: JourneyEventContext,
  properties?: Readonly<Record<string, AnalyticsValue>>,
  durationMs?: number,
  failureCode?: string
): AnalyticsEventEnvelope => ({
  schemaVersion: ANALYTICS_SCHEMA_VERSION,
  eventName,
  ...context,
  ...(properties !== undefined ? { properties } : {}),
  ...(durationMs !== undefined ? { durationMs } : {}),
  ...(failureCode !== undefined ? { failureCode } : {})
});

export class CoreJourneyInstrumentation {
  constructor(private readonly emitter: PrivacySafeAnalyticsEmitter, private readonly consent: TelemetryConsent) {}

  start(journey: CoreJourney, context: JourneyEventContext, properties?: Readonly<Record<string, AnalyticsValue>>): Promise<TelemetryDeliveryResult> {
    return this.emitter.emit(envelope(INSTRUMENTATION_TARGETS[journey].startEvent, context, properties), this.consent);
  }

  succeed(
    journey: CoreJourney,
    context: JourneyEventContext,
    options: { eventName?: AnalyticsEventName; properties?: Readonly<Record<string, AnalyticsValue>>; durationMs?: number } = {}
  ): Promise<TelemetryDeliveryResult> {
    const target = INSTRUMENTATION_TARGETS[journey];
    const eventName = options.eventName ?? target.successEvents[0];
    if (eventName === undefined || !target.successEvents.includes(eventName)) throw new Error(`invalid_success_event:${journey}`);
    return this.emitter.emit(envelope(eventName, context, options.properties, options.durationMs), this.consent);
  }

  fail(
    journey: CoreJourney,
    context: JourneyEventContext,
    failureCode: string,
    options: { properties?: Readonly<Record<string, AnalyticsValue>>; durationMs?: number } = {}
  ): Promise<TelemetryDeliveryResult> {
    const eventName = INSTRUMENTATION_TARGETS[journey].failureEvents[0];
    if (eventName === undefined) throw new Error(`failure_event_missing:${journey}`);
    return this.emitter.emit(envelope(eventName, context, options.properties, options.durationMs, failureCode), this.consent);
  }
}

export interface DashboardInput {
  events: readonly AnalyticsEventEnvelope[];
  actionOpens?: number;
  actionConfirmations?: number;
}

export interface OperatingDashboardSnapshot {
  onboarding: { started: number; completed: number; failed: number; completionRate: number | null };
  projectRun: { started: number; completed: number; failed: number; successRate: number | null; p95LatencyMs: number | null };
  connectedAppFailures: number;
  importFailures: number;
  dotActivity: { started: number; completed: number; failed: number };
  supportVolume: { started: number; resolved: number; escalated: number; failed: number };
  confirmationFrequency: number | null;
}

const count = (events: readonly AnalyticsEventEnvelope[], eventName: AnalyticsEventName): number => events.filter((event) => event.eventName === eventName).length;
const rate = (numerator: number, denominator: number): number | null => denominator === 0 ? null : numerator / denominator;
const p95 = (values: readonly number[]): number | null => {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(ordered.length * 0.95) - 1);
  return ordered[index] ?? null;
};

export const buildOperatingDashboard = (input: DashboardInput): OperatingDashboardSnapshot => {
  const onboardingStarted = count(input.events, "onboarding.started");
  const onboardingCompleted = count(input.events, "onboarding.completed");
  const runStarted = count(input.events, "project_run.started");
  const runCompleted = count(input.events, "project_run.completed");
  const runDurations = input.events.filter((event) => event.eventName === "project_run.completed" && event.durationMs !== undefined).map((event) => event.durationMs as number);
  return {
    onboarding: {
      started: onboardingStarted,
      completed: onboardingCompleted,
      failed: count(input.events, "onboarding.failed"),
      completionRate: rate(onboardingCompleted, onboardingStarted)
    },
    projectRun: {
      started: runStarted,
      completed: runCompleted,
      failed: count(input.events, "project_run.failed"),
      successRate: rate(runCompleted, runStarted),
      p95LatencyMs: p95(runDurations)
    },
    connectedAppFailures: count(input.events, "connected_app.setup_failed"),
    importFailures: count(input.events, "import.setup_failed"),
    dotActivity: {
      started: count(input.events, "dot.activity_started"),
      completed: count(input.events, "dot.activity_completed"),
      failed: count(input.events, "dot.activity_failed")
    },
    supportVolume: {
      started: count(input.events, "support.path_started"),
      resolved: count(input.events, "support.path_resolved"),
      escalated: count(input.events, "support.path_escalated"),
      failed: count(input.events, "support.path_failed")
    },
    confirmationFrequency: input.actionOpens === undefined || input.actionConfirmations === undefined ? null : rate(input.actionConfirmations, input.actionOpens)
  };
};

export type RolloutStageKey = "local_verification" | "internal_dogfood" | "limited_invited" | "opt_in_beta" | "controlled_percentage" | "broader_launch";
export interface RolloutStage {
  key: RolloutStageKey;
  owner: "engineering" | "release" | "support";
  promotionGates: readonly string[];
  rollbackThresholds: readonly string[];
  requiresExplicitProductionAuthorization: boolean;
}

export const ROLLOUT_LADDER: readonly RolloutStage[] = [
  { key: "local_verification", owner: "engineering", promotionGates: ["typecheck_green", "focused_tests_green", "repository_gates_green"], rollbackThresholds: ["any_critical_regression"], requiresExplicitProductionAuthorization: false },
  { key: "internal_dogfood", owner: "release", promotionGates: ["local_verification_passed", "core_journeys_measurable"], rollbackThresholds: ["critical_journey_failure", "privacy_violation"], requiresExplicitProductionAuthorization: false },
  { key: "limited_invited", owner: "release", promotionGates: ["dogfood_exit_met", "support_path_ready"], rollbackThresholds: ["critical_incident", "rollback_threshold_breached"], requiresExplicitProductionAuthorization: true },
  { key: "opt_in_beta", owner: "release", promotionGates: ["limited_invited_exit_met", "beta_success_criteria_defined"], rollbackThresholds: ["critical_incident", "beta_blocker"], requiresExplicitProductionAuthorization: true },
  { key: "controlled_percentage", owner: "release", promotionGates: ["beta_exit_met", "rollback_controls_verified"], rollbackThresholds: ["error_rate_threshold", "latency_threshold", "support_spike_threshold"], requiresExplicitProductionAuthorization: true },
  { key: "broader_launch", owner: "release", promotionGates: ["controlled_rollout_exit_met", "launch_review_approved"], rollbackThresholds: ["critical_incident", "data_integrity_risk", "privacy_or_security_incident"], requiresExplicitProductionAuthorization: true }
];

export type KillSwitchKey = "global_automation" | "connectors" | "dots" | "experts";
export interface KillSwitchState { key: KillSwitchKey; enabled: boolean; reason?: string; }
export interface ContainmentDecision { allowed: boolean; blockedBy: readonly KillSwitchKey[]; }

export const evaluateContainment = (required: readonly KillSwitchKey[], states: readonly KillSwitchState[]): ContainmentDecision => {
  const disabled = new Set(states.filter((state) => !state.enabled).map((state) => state.key));
  const blockedBy = required.filter((key) => disabled.has(key));
  return { allowed: blockedBy.length === 0, blockedBy };
};

export interface RollbackPlaybook {
  trigger: string;
  actions: readonly string[];
  verification: readonly string[];
}

export const ROLLBACK_PLAYBOOKS: readonly RollbackPlaybook[] = [
  { trigger: "feature_regression", actions: ["disable_affected_feature", "preserve_evidence", "restore_last_verified_candidate"], verification: ["regression_absent", "data_integrity_preserved"] },
  { trigger: "connector_incident", actions: ["disable_connectors", "stop_new_side_effects", "reconcile_inflight_operations"], verification: ["no_new_connector_side_effects", "inflight_state_reconciled"] },
  { trigger: "automation_or_dot_incident", actions: ["disable_global_automation", "disable_dots", "preserve_completed_work"], verification: ["no_new_autonomous_work", "verified_work_preserved"] },
  { trigger: "expert_incident", actions: ["disable_experts", "isolate_affected_expert", "preserve_project_boundaries"], verification: ["expert_execution_stopped", "unrelated_projects_unaffected"] },
  { trigger: "data_integrity_incident", actions: ["stop_writes", "capture_integrity_evidence", "restore_only_from_verified_source"], verification: ["authoritative_state_reconciled", "no_unverified_reconstruction"] }
];

export type RehearsalKey = "auth_outage" | "connector_outage" | "import_outage" | "elevated_run_failure" | "high_confirmation_friction" | "broken_template_share_path" | "privacy_report_incident" | "support_spike";
export interface LaunchRehearsal {
  key: RehearsalKey;
  expectedContainment: readonly string[];
  expectedEscalation: readonly string[];
  passCriteria: readonly string[];
}

export const LAUNCH_REHEARSALS: readonly LaunchRehearsal[] = [
  { key: "auth_outage", expectedContainment: ["block_protected_actions"], expectedEscalation: ["release_owner"], passCriteria: ["no_unauthorized_fallback", "owner_message_truthful"] },
  { key: "connector_outage", expectedContainment: ["connector_kill_switch", "reconcile_inflight_operations"], expectedEscalation: ["release_owner", "support"], passCriteria: ["no_duplicate_side_effects", "unrelated_features_available"] },
  { key: "import_outage", expectedContainment: ["fail_import_closed"], expectedEscalation: ["support"], passCriteria: ["existing_project_state_preserved", "retry_path_bounded"] },
  { key: "elevated_run_failure", expectedContainment: ["pause_rollout", "disable_affected_execution_path"], expectedEscalation: ["release_owner"], passCriteria: ["failure_locatable", "rollback_ready"] },
  { key: "high_confirmation_friction", expectedContainment: ["pause_promotion"], expectedEscalation: ["product_owner"], passCriteria: ["confirmation_frequency_measurable", "protected_boundary_unchanged"] },
  { key: "broken_template_share_path", expectedContainment: ["disable_broken_share_path"], expectedEscalation: ["support"], passCriteria: ["private_data_not_exposed", "local_work_preserved"] },
  { key: "privacy_report_incident", expectedContainment: ["disable_affected_telemetry", "preserve_incident_evidence"], expectedEscalation: ["security_owner", "release_owner"], passCriteria: ["sensitive_payload_collection_stopped", "scope_identified"] },
  { key: "support_spike", expectedContainment: ["pause_rollout_promotion"], expectedEscalation: ["support", "release_owner"], passCriteria: ["support_volume_visible", "triage_owner_assigned"] }
];

export interface RehearsalResult { key: RehearsalKey; containmentObserved: readonly string[]; escalationObserved: readonly string[]; criteriaObserved: readonly string[]; }
export const rehearsalPasses = (result: RehearsalResult): boolean => {
  const definition = LAUNCH_REHEARSALS.find((candidate) => candidate.key === result.key);
  if (definition === undefined) return false;
  return definition.expectedContainment.every((item) => result.containmentObserved.includes(item)) &&
    definition.expectedEscalation.every((item) => result.escalationObserved.includes(item)) &&
    definition.passCriteria.every((item) => result.criteriaObserved.includes(item));
};

export const assertOperatingReadinessDefinitions = (): void => {
  if (CORE_JOURNEYS.some((journey) => INSTRUMENTATION_TARGETS[journey] === undefined)) throw new Error("core_journey_uninstrumented");
  if (ROLLOUT_LADDER.length !== 6) throw new Error("rollout_ladder_incomplete");
  if (LAUNCH_REHEARSALS.length !== 8) throw new Error("launch_rehearsals_incomplete");
  if (ROLLBACK_PLAYBOOKS.length < 5) throw new Error("rollback_playbooks_incomplete");
};

assertOperatingReadinessDefinitions();
