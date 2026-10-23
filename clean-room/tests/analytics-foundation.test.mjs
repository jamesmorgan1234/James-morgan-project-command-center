import test from "node:test";
import assert from "node:assert/strict";
import {
  MetricRegistry,
  validateMetricValue,
  TraceLedger,
  identifyReliabilityBottleneck,
  projectAnalytics,
  summarizeAgency,
  validateRecommendation,
  validateBuildLesson,
  validateSecuritySignal,
  signalGrantsAuthorization,
  selfAudit,
  normalizeAnalyticsEvents,
  recalculate
} from "../dist/analytics/index.js";

test("metric registry gives every number explicit semantics, source, freshness and missing behavior", () => {
  const registry = new MetricRegistry();
  registry.register({ key: "banked", domain: "aro", owner: "specialist:revenue_operation", sourceKind: "payment", formulaRef: null, freshnessMs: 60000, truth: "verified", format: "currency", zeroMeaning: "verified zero banked", missingMeaning: "unknown" });
  assert.equal(validateMetricValue(registry, { metricKey: "banked", value: 0, observedAt: "2026-10-23T19:00:00Z", sourceRefs: ["bank"], truth: "verified" }, Date.parse("2026-10-23T19:00:30Z")).value, 0);
  assert.throws(() => validateMetricValue(registry, { metricKey: "banked", value: 100, observedAt: "2026-10-23T19:00:00Z", sourceRefs: ["guess"], truth: "estimated" }, Date.parse("2026-10-23T19:00:30Z")));
});

test("cross-system traces retain correlation/evidence while redacting secrets", () => {
  const ledger = new TraceLedger();
  ledger.append({ traceId: "t1", correlationId: "c1", component: "agency", action: "dispatch", at: "2026-10-23T19:00:00Z", evidenceRefs: ["job"], fields: { project: "aro", token: "secret-value" } });
  assert.equal(ledger.trace("t1")[0].fields.token, "[REDACTED]");
});

test("reliability signals identify actual bottleneck domain instead of generic red state", () => {
  const result = identifyReliabilityBottleneck([{ domain: "provider:x", kind: "provider_health", severity: "critical", value: 0, sourceRefs: ["health"] }, { domain: "provider:x", kind: "retry_rate", severity: "warning", value: 8, sourceRefs: ["queue"] }, { domain: "db", kind: "latency", severity: "warning", value: 200, sourceRefs: ["trace"] }]);
  assert.equal(result.domain, "provider:x");
  assert.equal(result.severity, "critical");
});

test("portfolio analytics separates project progress from Agency progress and preserves unknown denominator", () => {
  const result = projectAnalytics({ projectId: "p", verifiedCompleted: 4, verifiedTotal: 8, agencyCompleted: 2, agencyTotal: null, cycleTimeMs: 1000, blockedTimeMs: 100, ownerWaitTimeMs: 50, evidenceRefs: ["checkpoint"] });
  assert.equal(result.projectPercent, 50);
  assert.equal(result.agencyPercent, null);
});

test("Agency analytics measures routing/queue behavior without sensitive task payloads", () => {
  const summary = summarizeAgency([{ projectId: "p", workerId: "w1", claimLatencyMs: 20, leaseLosses: 1, staleWriteBlocks: 2, conflicts: 0, verifierRejects: 1, steals: 0, queueDepth: 3, resourceUnits: 4, sensitiveTaskContentIncluded: false }]);
  assert.equal(summary.staleWriteBlocks, 2);
  assert.throws(() => summarizeAgency([{ projectId: "p", workerId: "w1", claimLatencyMs: 20, leaseLosses: 0, staleWriteBlocks: 0, conflicts: 0, verifierRejects: 0, steals: 0, queueDepth: 0, resourceUnits: 1, sensitiveTaskContentIncluded: true }]));
});

test("recommendations record outcomes and cannot self-install", () => {
  assert.throws(() => validateRecommendation({ id: "r1", projectId: "p", evidenceRefs: ["analysis"], confidence: 0.8, expectedBenefit: "faster", successCriteria: ["latency lower"], status: "implemented", implementationAuthorized: false, actualOutcomeRefs: [] }));
  assert.doesNotThrow(() => validateRecommendation({ id: "r2", projectId: "p", evidenceRefs: ["analysis"], confidence: 0.8, expectedBenefit: "faster", successCriteria: ["latency lower"], status: "measured", implementationAuthorized: true, actualOutcomeRefs: ["metric-after"] }));
});

test("build-history lessons become evidence-backed proposals, never silent mutation", () => {
  assert.doesNotThrow(() => validateBuildLesson({ id: "l1", kind: "patch_stacking", evidenceRefs: ["history"], sourceVersion: "old-build", statement: "Patch stacks caused architecture drift", improvementProposalRef: "proposal:no-band-aids", autoApplied: false }));
});

test("security analytics is evidence-backed, payload-minimized, and never an authorization path", () => {
  const signal = validateSecuritySignal({ kind: "cross_boundary_attempt", severity: "critical", subjectRef: "project-a->project-b", observedAt: "2026-10-23T19:00:00Z", evidenceRefs: ["audit"], payloadIncluded: false });
  assert.equal(signalGrantsAuthorization(signal), false);
  assert.throws(() => validateSecuritySignal({ ...signal, payloadIncluded: true }));
});

test("self-audit surfaces implemented-unverified, missing, broken and evidence-free claims truthfully", () => {
  const findings = selfAudit([{ id: "req-1", expected: true, implementationState: "verified", evidenceRefs: ["test"], owner: "kernel" }, { id: "req-2", expected: true, implementationState: "implemented_unverified", evidenceRefs: [], owner: "ui" }, { id: "req-3", expected: true, implementationState: "broken", evidenceRefs: ["failure"], owner: "agency" }]);
  assert.deepEqual(findings.map((finding) => finding.targetId), ["req-2", "req-3"]);
  assert.equal(findings[1].severity, "critical");
});

test("analytics deduplication/recalculation is reproducible and privacy-safe", () => {
  const events = [{ id: "e2", metricKey: "x", value: 2, occurredAt: "2026-10-23T19:00:02Z", sourceRef: "s", retentionClass: "standard", containsSensitivePayload: false }, { id: "e1", metricKey: "x", value: 1, occurredAt: "2026-10-23T19:00:01Z", sourceRef: "s", retentionClass: "standard", containsSensitivePayload: false }, { id: "e1", metricKey: "x", value: 1, occurredAt: "2026-10-23T19:00:01Z", sourceRef: "s", retentionClass: "standard", containsSensitivePayload: false }];
  assert.deepEqual(normalizeAnalyticsEvents(events).map((event) => event.id), ["e1", "e2"]);
  assert.equal(recalculate(events, "x"), 3);
});
