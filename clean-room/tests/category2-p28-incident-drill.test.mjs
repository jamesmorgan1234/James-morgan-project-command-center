import test from "node:test";
import assert from "node:assert/strict";
import { IncidentRegistry, SecurityAlertCenter, SecurityEventLedger } from "../dist/security/index.js";

function suspiciousEvent() {
  return {
    id: "sev_suspicious",
    ownerId: "owner-1",
    kind: "session.suspicious_activity",
    riskClass: "critical",
    occurredAt: "2026-10-23T18:00:00Z",
    sourceRef: "security-monitor",
    details: { sessionId: "ses_compromised", rawEvidenceRef: "evidence:suspicious-session-1" }
  };
}

test("P2.8 incident drill yields append-only suspicious, containment, recovery, and resolution evidence", () => {
  const events = new SecurityEventLedger();
  const suspicious = suspiciousEvent();
  events.append(suspicious);
  const alerts = new SecurityAlertCenter();
  const alert = alerts.raiseFromEvent("alert_suspicious", suspicious);
  const incidents = new IncidentRegistry(events);
  incidents.open({ id: "inc_suspicious", ownerId: "owner-1", title: "Suspicious session", riskClass: "critical", state: "open", openedAt: "2026-10-23T18:01:00Z", updatedAt: "2026-10-23T18:01:00Z" }, "sev_opened", "incident-response");
  incidents.transition("inc_suspicious", "contained", "2026-10-23T18:02:00Z", "sev_contained", "incident-response");
  incidents.transition("inc_suspicious", "recovering", "2026-10-23T18:03:00Z", "sev_recovering", "incident-response");
  incidents.transition("inc_suspicious", "resolved", "2026-10-23T18:04:00Z", "sev_resolved", "incident-response");
  alerts.acknowledge(alert.id, "2026-10-23T18:02:30Z");
  alerts.resolve(alert.id, "2026-10-23T18:04:30Z");

  assert.deepEqual(events.list("owner-1").map((event) => event.kind), [
    "session.suspicious_activity",
    "incident.opened",
    "incident.contained",
    "incident.recovering",
    "incident.resolved"
  ]);
  assert.equal(incidents.get("inc_suspicious").state, "resolved");
  assert.equal(alerts.get("alert_suspicious").state, "resolved");
});

test("P2.8 notification is privacy-safe and does not copy raw suspicious-event details", () => {
  const alerts = new SecurityAlertCenter();
  const event = suspiciousEvent();
  const alert = alerts.raiseFromEvent("alert_privacy", event);
  assert.equal(alert.notificationMessage.includes("ses_compromised"), false);
  assert.equal(alert.notificationMessage.includes("evidence:suspicious-session-1"), false);
  assert.equal(alert.title.includes("Suspicious session"), false);
  assert.match(alert.notificationMessage, /Open Command Center Security for details/);
});

test("P2.8 incident and alert lifecycle timestamps cannot move backward", () => {
  const events = new SecurityEventLedger();
  const incidents = new IncidentRegistry(events);
  incidents.open({ id: "inc_time", ownerId: "owner-1", title: "Timing", riskClass: "high", state: "open", openedAt: "2026-10-23T18:01:00Z", updatedAt: "2026-10-23T18:01:00Z" }, "sev_time_open", "incident-response");
  assert.throws(() => incidents.transition("inc_time", "contained", "2026-10-23T18:00:59Z", "sev_time_bad", "incident-response"), /cannot move backward/);
  assert.equal(events.get("sev_time_bad"), undefined);

  const suspicious = suspiciousEvent();
  const alerts = new SecurityAlertCenter();
  alerts.raiseFromEvent("alert_time", suspicious);
  alerts.acknowledge("alert_time", "2026-10-23T18:02:00Z");
  assert.throws(() => alerts.resolve("alert_time", "2026-10-23T18:01:59Z"), /cannot move backward/);
  assert.equal(alerts.get("alert_time").state, "acknowledged");
});
