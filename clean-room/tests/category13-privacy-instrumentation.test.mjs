import test from "node:test";
import assert from "node:assert/strict";
import {
  PrivacySafeAnalyticsEmitter,
  captureSafeErrorEvent,
  captureSafePerformanceEvent,
  sanitizeAnalyticsProperties
} from "../dist/analytics/index.js";

const base = {
  schemaVersion: 1,
  eventName: "project_run.completed",
  eventId: "evt-2",
  occurredAt: "2026-10-26T06:20:00Z",
  source: "server",
  sessionId: "session-2",
  journeyId: "journey-2",
  subjectId: "subject-pseudonymous",
  projectId: "project-2",
  runId: "run-2",
  properties: { control_mode: "next_step" }
};

test("P13.2 product analytics requires affirmative telemetry consent", async () => {
  const delivered = [];
  const emitter = new PrivacySafeAnalyticsEmitter((event) => delivered.push(event), (event) => delivered.push(event));
  assert.deepEqual(await emitter.emit(base, "unknown"), { status: "dropped", reason: "consent_not_granted" });
  assert.deepEqual(await emitter.emit(base, "denied"), { status: "dropped", reason: "consent_not_granted" });
  assert.deepEqual(await emitter.emit(base, "granted"), { status: "delivered" });
  assert.equal(delivered.length, 1);
});

test("P13.2 essential reliability telemetry drops durable subject identity", async () => {
  const delivered = [];
  const emitter = new PrivacySafeAnalyticsEmitter((event) => delivered.push(event), (event) => delivered.push(event));
  assert.deepEqual(await emitter.emit(base, "denied", "essential_reliability"), { status: "delivered" });
  assert.equal(delivered[0].subjectId, undefined);
});

test("P13.2 rejects sensitive payload keys and secret-like values", async () => {
  const emitter = new PrivacySafeAnalyticsEmitter(() => {}, () => {});
  const unsafeKey = { ...base, properties: { message: "private text" } };
  const unsafeValue = { ...base, properties: { control_mode: "Bearer abcdefghijklmnopqrstuvwxyz" } };
  assert.deepEqual(await emitter.emit(unsafeKey, "granted"), { status: "dropped", reason: "unsafe_payload" });
  assert.deepEqual(await emitter.emit(unsafeValue, "granted"), { status: "dropped", reason: "unsafe_payload" });
});

test("P13.2 error/performance capture keeps bounded codes and numeric timing, never raw error objects", () => {
  const context = {
    eventName: "project_run.failed",
    eventId: "evt-3",
    occurredAt: "2026-10-26T06:20:00Z",
    source: "server",
    sessionId: "session-3",
    journeyId: "journey-3",
    projectId: "project-3",
    runId: "run-3"
  };
  const errorEvent = captureSafeErrorEvent(context, "provider_unavailable", { failure_stage: "dispatch", message: "raw error" });
  assert.equal(errorEvent.failureCode, "provider_unavailable");
  assert.deepEqual(errorEvent.properties, { failure_stage: "dispatch" });
  const performanceEvent = captureSafePerformanceEvent({ ...context, eventName: "project_run.completed" }, 250, { control_mode: "next_step" });
  assert.equal(performanceEvent.durationMs, 250);
  assert.deepEqual(performanceEvent.properties, { control_mode: "next_step" });
  assert.throws(() => captureSafePerformanceEvent({ ...context, eventName: "project_run.completed" }, -1));
});

test("P13.2 sanitizer enforces the event dictionary allowlist", () => {
  assert.deepEqual(sanitizeAnalyticsProperties("project_run.completed", { control_mode: "next_step", unknown: true }), { control_mode: "next_step" });
});
