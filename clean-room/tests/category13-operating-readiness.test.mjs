import test from "node:test";
import assert from "node:assert/strict";
import {
  CORE_JOURNEYS,
  CoreJourneyInstrumentation,
  PrivacySafeAnalyticsEmitter,
  buildOperatingDashboard,
  ROLLOUT_LADDER,
  evaluateContainment,
  ROLLBACK_PLAYBOOKS,
  LAUNCH_REHEARSALS,
  rehearsalPasses,
  assertOperatingReadinessDefinitions
} from "../dist/analytics/index.js";

const contextFor = (journey, n) => ({
  eventId: `evt-${n}`,
  occurredAt: "2026-10-26T06:30:00Z",
  source: "server",
  sessionId: `session-${n}`,
  journeyId: `journey-${n}`,
  ...(journey === "connected_app_setup" ? { integrationId: `integration-${n}` } : {}),
  ...(["source_attachment","project_run","expert_attachment","dot_creation","dot_activity"].includes(journey) ? { projectId: `project-${n}` } : {}),
  ...(journey === "project_run" ? { runId: `run-${n}` } : {}),
  ...(journey === "expert_attachment" ? { expertId: `expert-${n}` } : {}),
  ...(journey === "dot_activity" ? { dotId: `dot-${n}` } : {}),
  ...(journey === "support_path" ? { supportCaseId: `support-${n}` } : {})
});

test("P13.3 core journey instrumentation emits measurable starts and outcomes for every required journey", async () => {
  const delivered = [];
  const emitter = new PrivacySafeAnalyticsEmitter((event) => delivered.push(event), (event) => delivered.push(event));
  const tracker = new CoreJourneyInstrumentation(emitter, "granted");
  let n = 0;
  for (const journey of CORE_JOURNEYS) {
    n += 1;
    assert.equal((await tracker.start(journey, contextFor(journey, n))).status, "delivered");
    const successOptions = journey === "support_path" ? { eventName: "support.path_resolved" } : {};
    const successContext = {
      ...contextFor(journey, n),
      eventId: `evt-${n}-done`,
      ...(journey === "project_creation" ? { projectId: `project-${n}` } : {}),
      ...(journey === "dot_creation" ? { dotId: `dot-${n}` } : {})
    };
    assert.equal((await tracker.succeed(journey, successContext, successOptions)).status, "delivered");
  }
  assert.equal(delivered.length, CORE_JOURNEYS.length * 2);
});

test("P13.4 operating dashboard exposes the required release/support failure modes", () => {
  const events = [
    { schemaVersion:1,eventName:"onboarding.started",eventId:"1",occurredAt:"2026-10-26T06:00:00Z",source:"server",sessionId:"s",journeyId:"j" },
    { schemaVersion:1,eventName:"onboarding.completed",eventId:"2",occurredAt:"2026-10-26T06:00:01Z",source:"server",sessionId:"s",journeyId:"j" },
    { schemaVersion:1,eventName:"project_run.started",eventId:"3",occurredAt:"2026-10-26T06:00:02Z",source:"server",sessionId:"s",journeyId:"r",projectId:"p",runId:"r1" },
    { schemaVersion:1,eventName:"project_run.completed",eventId:"4",occurredAt:"2026-10-26T06:00:03Z",source:"server",sessionId:"s",journeyId:"r",projectId:"p",runId:"r1",durationMs:250 },
    { schemaVersion:1,eventName:"connected_app.setup_failed",eventId:"5",occurredAt:"2026-10-26T06:00:04Z",source:"server",sessionId:"s",journeyId:"c",integrationId:"i" },
    { schemaVersion:1,eventName:"import.setup_failed",eventId:"6",occurredAt:"2026-10-26T06:00:05Z",source:"server",sessionId:"s",journeyId:"i" }
  ];
  const dashboard = buildOperatingDashboard({ events, actionOpens: 10, actionConfirmations: 4 });
  assert.equal(dashboard.onboarding.completionRate, 1);
  assert.equal(dashboard.projectRun.successRate, 1);
  assert.equal(dashboard.projectRun.p95LatencyMs, 250);
  assert.equal(dashboard.connectedAppFailures, 1);
  assert.equal(dashboard.importFailures, 1);
  assert.equal(dashboard.confirmationFrequency, 0.4);
});

test("P13.5 rollout ladder has six ordered stages and production stages require explicit authorization", () => {
  assert.deepEqual(ROLLOUT_LADDER.map((stage) => stage.key), ["local_verification","internal_dogfood","limited_invited","opt_in_beta","controlled_percentage","broader_launch"]);
  assert.equal(ROLLOUT_LADDER[0].requiresExplicitProductionAuthorization, false);
  assert.equal(ROLLOUT_LADDER.slice(2).every((stage) => stage.requiresExplicitProductionAuthorization), true);
});

test("P13.6 kill switches fail closed for required capabilities and rollback playbooks are defined", () => {
  assert.deepEqual(evaluateContainment(["connectors","dots"], [{ key:"connectors",enabled:false },{ key:"dots",enabled:true }]), { allowed:false, blockedBy:["connectors"] });
  assert.ok(ROLLBACK_PLAYBOOKS.some((playbook) => playbook.trigger === "data_integrity_incident"));
});

test("P13.7 launch rehearsal catalog covers all eight required incidents and validates evidence", () => {
  assert.equal(LAUNCH_REHEARSALS.length, 8);
  const auth = LAUNCH_REHEARSALS.find((item) => item.key === "auth_outage");
  assert.equal(rehearsalPasses({ key:"auth_outage", containmentObserved:auth.expectedContainment, escalationObserved:auth.expectedEscalation, criteriaObserved:auth.passCriteria }), true);
  assert.equal(rehearsalPasses({ key:"auth_outage", containmentObserved:[], escalationObserved:[], criteriaObserved:[] }), false);
  assert.doesNotThrow(() => assertOperatingReadinessDefinitions());
});
