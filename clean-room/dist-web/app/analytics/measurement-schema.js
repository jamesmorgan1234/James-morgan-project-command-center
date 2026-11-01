export const ANALYTICS_SCHEMA_VERSION = 1;
export const CORE_JOURNEYS = [
    "onboarding",
    "import_setup",
    "connected_app_setup",
    "project_creation",
    "source_attachment",
    "project_run",
    "expert_attachment",
    "dot_creation",
    "dot_activity",
    "support_path"
];
export const ANALYTICS_EVENT_NAMES = [
    "onboarding.started",
    "onboarding.completed",
    "onboarding.failed",
    "import.setup_started",
    "import.setup_completed",
    "import.setup_failed",
    "connected_app.setup_started",
    "connected_app.setup_completed",
    "connected_app.setup_failed",
    "project.creation_started",
    "project.creation_completed",
    "project.creation_failed",
    "source.attachment_started",
    "source.attachment_completed",
    "source.attachment_failed",
    "project_run.started",
    "project_run.completed",
    "project_run.failed",
    "expert.attachment_started",
    "expert.attachment_completed",
    "expert.attachment_failed",
    "dot.creation_started",
    "dot.creation_completed",
    "dot.creation_failed",
    "dot.activity_started",
    "dot.activity_completed",
    "dot.activity_failed",
    "support.path_started",
    "support.path_resolved",
    "support.path_escalated",
    "support.path_failed"
];
export const IDENTIFIER_TAXONOMY = {
    event_id: { kind: "event_id", stability: "event", requiredPrivacy: "non_sensitive", purpose: "Deduplicate one emitted analytics event." },
    session_id: { kind: "session_id", stability: "session", requiredPrivacy: "pseudonymous_only", purpose: "Correlate events within one application session without storing raw owner identity." },
    journey_id: { kind: "journey_id", stability: "journey", requiredPrivacy: "pseudonymous_only", purpose: "Correlate start/outcome events for one measured journey attempt." },
    subject_id: { kind: "subject_id", stability: "durable_internal", requiredPrivacy: "pseudonymous_only", purpose: "Measure retention with a pseudonymous subject key; raw auth IDs are not analytics identifiers." },
    project_id: { kind: "project_id", stability: "durable_internal", requiredPrivacy: "internal_reference_only", purpose: "Attribute project-scoped behavior without provider account identifiers." },
    integration_id: { kind: "integration_id", stability: "durable_internal", requiredPrivacy: "internal_reference_only", purpose: "Measure connected-app setup and failures by internal connection reference." },
    run_id: { kind: "run_id", stability: "durable_internal", requiredPrivacy: "internal_reference_only", purpose: "Measure one project run without task payload content." },
    expert_id: { kind: "expert_id", stability: "durable_internal", requiredPrivacy: "internal_reference_only", purpose: "Measure expert attachment by internal expert reference." },
    dot_id: { kind: "dot_id", stability: "durable_internal", requiredPrivacy: "internal_reference_only", purpose: "Measure dot creation/activity by internal dot reference." },
    support_case_id: { kind: "support_case_id", stability: "durable_internal", requiredPrivacy: "internal_reference_only", purpose: "Correlate support-path outcomes without support-message content." }
};
const BASE_IDENTIFIERS = ["event_id", "session_id", "journey_id"];
const event = (name, journey, outcome, requiredIdentifiers = BASE_IDENTIFIERS, allowedProperties = []) => ({ name, journey, outcome, requiredIdentifiers, allowedProperties });
export const EVENT_DICTIONARY = {
    "onboarding.started": event("onboarding.started", "onboarding", "started"),
    "onboarding.completed": event("onboarding.completed", "onboarding", "succeeded", BASE_IDENTIFIERS, ["step_count"]),
    "onboarding.failed": event("onboarding.failed", "onboarding", "failed", BASE_IDENTIFIERS, ["failure_stage"]),
    "import.setup_started": event("import.setup_started", "import_setup", "started"),
    "import.setup_completed": event("import.setup_completed", "import_setup", "succeeded", BASE_IDENTIFIERS, ["source_kind"]),
    "import.setup_failed": event("import.setup_failed", "import_setup", "failed", BASE_IDENTIFIERS, ["failure_stage"]),
    "connected_app.setup_started": event("connected_app.setup_started", "connected_app_setup", "started", [...BASE_IDENTIFIERS, "integration_id"]),
    "connected_app.setup_completed": event("connected_app.setup_completed", "connected_app_setup", "succeeded", [...BASE_IDENTIFIERS, "integration_id"], ["provider_kind"]),
    "connected_app.setup_failed": event("connected_app.setup_failed", "connected_app_setup", "failed", [...BASE_IDENTIFIERS, "integration_id"], ["provider_kind", "failure_stage"]),
    "project.creation_started": event("project.creation_started", "project_creation", "started"),
    "project.creation_completed": event("project.creation_completed", "project_creation", "succeeded", [...BASE_IDENTIFIERS, "project_id"]),
    "project.creation_failed": event("project.creation_failed", "project_creation", "failed", BASE_IDENTIFIERS, ["failure_stage"]),
    "source.attachment_started": event("source.attachment_started", "source_attachment", "started", [...BASE_IDENTIFIERS, "project_id"]),
    "source.attachment_completed": event("source.attachment_completed", "source_attachment", "succeeded", [...BASE_IDENTIFIERS, "project_id"], ["source_kind"]),
    "source.attachment_failed": event("source.attachment_failed", "source_attachment", "failed", [...BASE_IDENTIFIERS, "project_id"], ["source_kind", "failure_stage"]),
    "project_run.started": event("project_run.started", "project_run", "started", [...BASE_IDENTIFIERS, "project_id", "run_id"]),
    "project_run.completed": event("project_run.completed", "project_run", "succeeded", [...BASE_IDENTIFIERS, "project_id", "run_id"], ["control_mode"]),
    "project_run.failed": event("project_run.failed", "project_run", "failed", [...BASE_IDENTIFIERS, "project_id", "run_id"], ["control_mode", "failure_stage"]),
    "expert.attachment_started": event("expert.attachment_started", "expert_attachment", "started", [...BASE_IDENTIFIERS, "project_id", "expert_id"]),
    "expert.attachment_completed": event("expert.attachment_completed", "expert_attachment", "succeeded", [...BASE_IDENTIFIERS, "project_id", "expert_id"]),
    "expert.attachment_failed": event("expert.attachment_failed", "expert_attachment", "failed", [...BASE_IDENTIFIERS, "project_id", "expert_id"], ["failure_stage"]),
    "dot.creation_started": event("dot.creation_started", "dot_creation", "started", [...BASE_IDENTIFIERS, "project_id"]),
    "dot.creation_completed": event("dot.creation_completed", "dot_creation", "succeeded", [...BASE_IDENTIFIERS, "project_id", "dot_id"]),
    "dot.creation_failed": event("dot.creation_failed", "dot_creation", "failed", [...BASE_IDENTIFIERS, "project_id"], ["failure_stage"]),
    "dot.activity_started": event("dot.activity_started", "dot_activity", "started", [...BASE_IDENTIFIERS, "project_id", "dot_id"]),
    "dot.activity_completed": event("dot.activity_completed", "dot_activity", "succeeded", [...BASE_IDENTIFIERS, "project_id", "dot_id"], ["activity_kind"]),
    "dot.activity_failed": event("dot.activity_failed", "dot_activity", "failed", [...BASE_IDENTIFIERS, "project_id", "dot_id"], ["activity_kind", "failure_stage"]),
    "support.path_started": event("support.path_started", "support_path", "started", [...BASE_IDENTIFIERS, "support_case_id"], ["entry_surface"]),
    "support.path_resolved": event("support.path_resolved", "support_path", "resolved", [...BASE_IDENTIFIERS, "support_case_id"], ["resolution_kind"]),
    "support.path_escalated": event("support.path_escalated", "support_path", "escalated", [...BASE_IDENTIFIERS, "support_case_id"], ["escalation_kind"]),
    "support.path_failed": event("support.path_failed", "support_path", "failed", [...BASE_IDENTIFIERS, "support_case_id"], ["failure_stage"])
};
export const INSTRUMENTATION_TARGETS = {
    onboarding: { journey: "onboarding", startEvent: "onboarding.started", successEvents: ["onboarding.completed"], failureEvents: ["onboarding.failed"], latencyFrom: "onboarding.started", latencyTo: ["onboarding.completed", "onboarding.failed"] },
    import_setup: { journey: "import_setup", startEvent: "import.setup_started", successEvents: ["import.setup_completed"], failureEvents: ["import.setup_failed"], latencyFrom: "import.setup_started", latencyTo: ["import.setup_completed", "import.setup_failed"] },
    connected_app_setup: { journey: "connected_app_setup", startEvent: "connected_app.setup_started", successEvents: ["connected_app.setup_completed"], failureEvents: ["connected_app.setup_failed"], latencyFrom: "connected_app.setup_started", latencyTo: ["connected_app.setup_completed", "connected_app.setup_failed"] },
    project_creation: { journey: "project_creation", startEvent: "project.creation_started", successEvents: ["project.creation_completed"], failureEvents: ["project.creation_failed"], latencyFrom: "project.creation_started", latencyTo: ["project.creation_completed", "project.creation_failed"] },
    source_attachment: { journey: "source_attachment", startEvent: "source.attachment_started", successEvents: ["source.attachment_completed"], failureEvents: ["source.attachment_failed"], latencyFrom: "source.attachment_started", latencyTo: ["source.attachment_completed", "source.attachment_failed"] },
    project_run: { journey: "project_run", startEvent: "project_run.started", successEvents: ["project_run.completed"], failureEvents: ["project_run.failed"], latencyFrom: "project_run.started", latencyTo: ["project_run.completed", "project_run.failed"] },
    expert_attachment: { journey: "expert_attachment", startEvent: "expert.attachment_started", successEvents: ["expert.attachment_completed"], failureEvents: ["expert.attachment_failed"], latencyFrom: "expert.attachment_started", latencyTo: ["expert.attachment_completed", "expert.attachment_failed"] },
    dot_creation: { journey: "dot_creation", startEvent: "dot.creation_started", successEvents: ["dot.creation_completed"], failureEvents: ["dot.creation_failed"], latencyFrom: "dot.creation_started", latencyTo: ["dot.creation_completed", "dot.creation_failed"] },
    dot_activity: { journey: "dot_activity", startEvent: "dot.activity_started", successEvents: ["dot.activity_completed"], failureEvents: ["dot.activity_failed"], latencyFrom: "dot.activity_started", latencyTo: ["dot.activity_completed", "dot.activity_failed"] },
    support_path: { journey: "support_path", startEvent: "support.path_started", successEvents: ["support.path_resolved", "support.path_escalated"], failureEvents: ["support.path_failed"], latencyFrom: "support.path_started", latencyTo: ["support.path_resolved", "support.path_escalated", "support.path_failed"] }
};
const completionMetric = (journey) => {
    const target = INSTRUMENTATION_TARGETS[journey];
    return {
        key: `${journey}.completion_rate`,
        aggregation: "rate",
        numeratorEvents: target.successEvents,
        denominatorEvents: [target.startEvent],
        meaning: `Successful ${journey} outcomes divided by started attempts.`
    };
};
export const SUCCESS_METRICS = [
    ...CORE_JOURNEYS.map(completionMetric),
    {
        key: "core_journeys.failure_rate",
        aggregation: "rate",
        numeratorEvents: CORE_JOURNEYS.flatMap((journey) => INSTRUMENTATION_TARGETS[journey].failureEvents),
        denominatorEvents: CORE_JOURNEYS.map((journey) => INSTRUMENTATION_TARGETS[journey].startEvent),
        meaning: "Failed core-journey outcomes divided by started core-journey attempts."
    },
    {
        key: "core_journeys.p95_latency_ms",
        aggregation: "p95_ms",
        eventNames: CORE_JOURNEYS.flatMap((journey) => [INSTRUMENTATION_TARGETS[journey].latencyFrom, ...INSTRUMENTATION_TARGETS[journey].latencyTo]),
        meaning: "95th percentile elapsed time from journey start to terminal measured outcome."
    }
];
export const CONVERSION_DEFINITIONS = CORE_JOURNEYS.map((journey) => ({
    key: `${journey}.conversion`,
    journey,
    entryEvent: INSTRUMENTATION_TARGETS[journey].startEvent,
    conversionEvents: INSTRUMENTATION_TARGETS[journey].successEvents,
    exclusionEvents: INSTRUMENTATION_TARGETS[journey].failureEvents
}));
const RETENTION_ACTIVITY_EVENTS = [
    "project_run.completed",
    "source.attachment_completed",
    "expert.attachment_completed",
    "dot.activity_completed",
    "connected_app.setup_completed"
];
export const RETENTION_DEFINITIONS = [
    { key: "d1", cohortEvent: "onboarding.completed", returnEvents: RETENTION_ACTIVITY_EVENTS, windowStartHours: 24, windowEndHours: 48, subjectIdentifier: "subject_id", meaning: "Activated subjects with qualifying return activity during the D1 window." },
    { key: "d7", cohortEvent: "onboarding.completed", returnEvents: RETENTION_ACTIVITY_EVENTS, windowStartHours: 144, windowEndHours: 192, subjectIdentifier: "subject_id", meaning: "Activated subjects with qualifying return activity during the D7 window." },
    { key: "d30", cohortEvent: "onboarding.completed", returnEvents: RETENTION_ACTIVITY_EVENTS, windowStartHours: 696, windowEndHours: 744, subjectIdentifier: "subject_id", meaning: "Activated subjects with qualifying return activity during the D30 window." }
];
const isNonBlank = (value) => value.trim().length > 0;
export const validateAnalyticsEventEnvelope = (value) => {
    const errors = [];
    if (value.schemaVersion !== ANALYTICS_SCHEMA_VERSION)
        errors.push("unsupported_schema_version");
    if (!ANALYTICS_EVENT_NAMES.includes(value.eventName))
        errors.push("unknown_event_name");
    if (!isNonBlank(value.eventId))
        errors.push("event_id_required");
    if (!isNonBlank(value.sessionId))
        errors.push("session_id_required");
    if (!isNonBlank(value.journeyId))
        errors.push("journey_id_required");
    if (!Number.isFinite(Date.parse(value.occurredAt)))
        errors.push("occurred_at_invalid");
    if (value.durationMs !== undefined && (!Number.isFinite(value.durationMs) || value.durationMs < 0))
        errors.push("duration_ms_invalid");
    if (value.failureCode !== undefined && !isNonBlank(value.failureCode))
        errors.push("failure_code_invalid");
    const definition = EVENT_DICTIONARY[value.eventName];
    const identifiers = {
        event_id: value.eventId,
        session_id: value.sessionId,
        journey_id: value.journeyId,
        subject_id: value.subjectId,
        project_id: value.projectId,
        integration_id: value.integrationId,
        run_id: value.runId,
        expert_id: value.expertId,
        dot_id: value.dotId,
        support_case_id: value.supportCaseId
    };
    for (const identifier of definition.requiredIdentifiers) {
        const candidate = identifiers[identifier];
        if (candidate === undefined || !isNonBlank(candidate))
            errors.push(`${identifier}_required`);
    }
    if (value.properties !== undefined) {
        for (const key of Object.keys(value.properties)) {
            if (!definition.allowedProperties.includes(key))
                errors.push(`property_not_allowed:${key}`);
        }
    }
    return errors;
};
export const assertMeasurementSchemaComplete = () => {
    const eventNames = new Set(ANALYTICS_EVENT_NAMES);
    for (const journey of CORE_JOURNEYS) {
        const target = INSTRUMENTATION_TARGETS[journey];
        if (target.journey !== journey)
            throw new Error(`journey_target_mismatch:${journey}`);
        const requiredEvents = [target.startEvent, ...target.successEvents, ...target.failureEvents, target.latencyFrom, ...target.latencyTo];
        for (const eventName of requiredEvents) {
            if (!eventNames.has(eventName))
                throw new Error(`unregistered_event:${journey}:${eventName}`);
            if (EVENT_DICTIONARY[eventName].journey !== journey)
                throw new Error(`event_journey_mismatch:${journey}:${eventName}`);
        }
        if (target.successEvents.length === 0)
            throw new Error(`success_event_missing:${journey}`);
        if (target.failureEvents.length === 0)
            throw new Error(`failure_event_missing:${journey}`);
    }
    const conversionJourneys = new Set(CONVERSION_DEFINITIONS.map((definition) => definition.journey));
    for (const journey of CORE_JOURNEYS) {
        if (!conversionJourneys.has(journey))
            throw new Error(`conversion_missing:${journey}`);
    }
    if (RETENTION_DEFINITIONS.length !== 3)
        throw new Error("retention_windows_incomplete");
};
assertMeasurementSchemaComplete();
//# sourceMappingURL=measurement-schema.js.map