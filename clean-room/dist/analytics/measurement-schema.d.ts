export declare const ANALYTICS_SCHEMA_VERSION: 1;
export declare const CORE_JOURNEYS: readonly ["onboarding", "import_setup", "connected_app_setup", "project_creation", "source_attachment", "project_run", "expert_attachment", "dot_creation", "dot_activity", "support_path"];
export type CoreJourney = (typeof CORE_JOURNEYS)[number];
export type AnalyticsOutcome = "started" | "succeeded" | "failed" | "resolved" | "escalated";
export type AnalyticsSource = "client" | "server";
export type AnalyticsValue = string | number | boolean | null;
export declare const ANALYTICS_EVENT_NAMES: readonly ["onboarding.started", "onboarding.completed", "onboarding.failed", "import.setup_started", "import.setup_completed", "import.setup_failed", "connected_app.setup_started", "connected_app.setup_completed", "connected_app.setup_failed", "project.creation_started", "project.creation_completed", "project.creation_failed", "source.attachment_started", "source.attachment_completed", "source.attachment_failed", "project_run.started", "project_run.completed", "project_run.failed", "expert.attachment_started", "expert.attachment_completed", "expert.attachment_failed", "dot.creation_started", "dot.creation_completed", "dot.creation_failed", "dot.activity_started", "dot.activity_completed", "dot.activity_failed", "support.path_started", "support.path_resolved", "support.path_escalated", "support.path_failed"];
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type AnalyticsIdentifierKind = "event_id" | "session_id" | "journey_id" | "subject_id" | "project_id" | "integration_id" | "run_id" | "expert_id" | "dot_id" | "support_case_id";
export interface IdentifierDefinition {
    kind: AnalyticsIdentifierKind;
    stability: "event" | "session" | "journey" | "durable_internal";
    requiredPrivacy: "non_sensitive" | "pseudonymous_only" | "internal_reference_only";
    purpose: string;
}
export declare const IDENTIFIER_TAXONOMY: Readonly<Record<AnalyticsIdentifierKind, IdentifierDefinition>>;
export interface AnalyticsEventEnvelope {
    schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
    eventName: AnalyticsEventName;
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
    durationMs?: number;
    failureCode?: string;
    properties?: Readonly<Record<string, AnalyticsValue>>;
}
export interface EventDefinition {
    name: AnalyticsEventName;
    journey: CoreJourney;
    outcome: AnalyticsOutcome;
    requiredIdentifiers: readonly AnalyticsIdentifierKind[];
    allowedProperties: readonly string[];
}
export declare const EVENT_DICTIONARY: Readonly<Record<AnalyticsEventName, EventDefinition>>;
export interface JourneyInstrumentationTarget {
    journey: CoreJourney;
    startEvent: AnalyticsEventName;
    successEvents: readonly AnalyticsEventName[];
    failureEvents: readonly AnalyticsEventName[];
    latencyFrom: AnalyticsEventName;
    latencyTo: readonly AnalyticsEventName[];
}
export declare const INSTRUMENTATION_TARGETS: Readonly<Record<CoreJourney, JourneyInstrumentationTarget>>;
export type MetricAggregation = "rate" | "count" | "p95_ms";
export interface SuccessMetricDefinition {
    key: string;
    aggregation: MetricAggregation;
    numeratorEvents?: readonly AnalyticsEventName[];
    denominatorEvents?: readonly AnalyticsEventName[];
    eventNames?: readonly AnalyticsEventName[];
    meaning: string;
}
export declare const SUCCESS_METRICS: readonly SuccessMetricDefinition[];
export interface ConversionDefinition {
    key: string;
    journey: CoreJourney;
    entryEvent: AnalyticsEventName;
    conversionEvents: readonly AnalyticsEventName[];
    exclusionEvents: readonly AnalyticsEventName[];
}
export declare const CONVERSION_DEFINITIONS: readonly ConversionDefinition[];
export interface RetentionDefinition {
    key: "d1" | "d7" | "d30";
    cohortEvent: AnalyticsEventName;
    returnEvents: readonly AnalyticsEventName[];
    windowStartHours: number;
    windowEndHours: number;
    subjectIdentifier: "subject_id";
    meaning: string;
}
export declare const RETENTION_DEFINITIONS: readonly RetentionDefinition[];
export declare const validateAnalyticsEventEnvelope: (value: AnalyticsEventEnvelope) => readonly string[];
export declare const assertMeasurementSchemaComplete: () => void;
