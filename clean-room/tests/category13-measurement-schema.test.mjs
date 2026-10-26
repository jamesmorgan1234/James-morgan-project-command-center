import test from "node:test";
import assert from "node:assert/strict";
import {
  ANALYTICS_SCHEMA_VERSION,
  CORE_JOURNEYS,
  EVENT_DICTIONARY,
  IDENTIFIER_TAXONOMY,
  INSTRUMENTATION_TARGETS,
  SUCCESS_METRICS,
  CONVERSION_DEFINITIONS,
  RETENTION_DEFINITIONS,
  assertMeasurementSchemaComplete,
  validateAnalyticsEventEnvelope
} from "../dist/analytics/index.js";

test("P13.1 defines a complete event and KPI dictionary for every mandatory core journey", () => {
  assert.doesNotThrow(() => assertMeasurementSchemaComplete());
  assert.equal(CORE_JOURNEYS.length, 10);
  for (const journey of CORE_JOURNEYS) {
    const target = INSTRUMENTATION_TARGETS[journey];
    assert.equal(EVENT_DICTIONARY[target.startEvent].journey, journey);
    assert.ok(target.successEvents.length > 0);
    assert.ok(target.failureEvents.length > 0);
    assert.ok(SUCCESS_METRICS.some((metric) => metric.key === `${journey}.completion_rate`));
    assert.ok(CONVERSION_DEFINITIONS.some((definition) => definition.journey === journey));
  }
});

test("P13.1 identifier taxonomy explicitly requires pseudonymous/internal references", () => {
  assert.equal(IDENTIFIER_TAXONOMY.subject_id.requiredPrivacy, "pseudonymous_only");
  assert.equal(IDENTIFIER_TAXONOMY.project_id.requiredPrivacy, "internal_reference_only");
  assert.equal(IDENTIFIER_TAXONOMY.integration_id.requiredPrivacy, "internal_reference_only");
});

test("P13.1 analytics envelope accepts registered allowlisted payloads and rejects schema drift", () => {
  const valid = {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    eventName: "project_run.completed",
    eventId: "evt-1",
    occurredAt: "2026-10-26T06:00:00Z",
    source: "server",
    sessionId: "session-1",
    journeyId: "journey-1",
    projectId: "project-1",
    runId: "run-1",
    durationMs: 1200,
    properties: { control_mode: "next_step" }
  };
  assert.deepEqual(validateAnalyticsEventEnvelope(valid), []);
  assert.deepEqual(validateAnalyticsEventEnvelope({ ...valid, properties: { task_text: "private payload" } }), ["property_not_allowed:task_text"]);
  assert.ok(validateAnalyticsEventEnvelope({ ...valid, runId: "" }).includes("run_id_required"));
});

test("P13.1 retention definitions are explicit D1/D7/D30 windows tied to pseudonymous subjects", () => {
  assert.deepEqual(RETENTION_DEFINITIONS.map((definition) => definition.key), ["d1", "d7", "d30"]);
  for (const definition of RETENTION_DEFINITIONS) {
    assert.equal(definition.subjectIdentifier, "subject_id");
    assert.equal(definition.cohortEvent, "onboarding.completed");
    assert.ok(definition.returnEvents.length > 0);
    assert.ok(definition.windowEndHours > definition.windowStartHours);
  }
});
