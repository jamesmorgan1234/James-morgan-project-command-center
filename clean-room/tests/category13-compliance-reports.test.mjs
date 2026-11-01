import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPLIANCE_DOMAINS,
  selfAuditDue,
  auditScope,
  assertAuditReadOnly,
  auditResultsToProposals,
  complianceReport
} from "../dist/analytics/index.js";

const NOW = "2026-10-31T12:00:00.000Z";

function target(id, state = "missing") {
  return { id, expected: true, implementationState: state, evidenceRefs: state === "verified" ? ["evd:x"] : [], owner: "owner" };
}

function finding(targetId, severity = "warning") {
  return { targetId, severity, reason: "missing", owner: "owner" };
}

test("P13.10 self-audit cadence is a schedule seam that reports the next due time", () => {
  assert.deepEqual(selfAuditDue({ intervalMs: 86400000 }, NOW), { due: true, nextDueAt: NOW });
  const fresh = selfAuditDue({ intervalMs: 86400000, lastRunAt: "2026-10-31T00:00:00.000Z" }, NOW);
  assert.equal(fresh.due, false);
  assert.equal(fresh.nextDueAt, "2026-11-01T00:00:00.000Z");
  const stale = selfAuditDue({ intervalMs: 3600000, lastRunAt: "2026-10-31T00:00:00.000Z" }, NOW);
  assert.equal(stale.due, true);
  assert.throws(() => selfAuditDue({ intervalMs: 0 }, NOW), /positive duration/);
});

test("P13.10 self-audit scope controls bound domains and target count", () => {
  const targets = [
    { domain: "projects", target: target("p1") },
    { domain: "security", target: target("s1") },
    { domain: "projects", target: target("p2") },
    { domain: "projects", target: target("p3") }
  ];
  const scoped = auditScope(targets, { domains: ["projects"], maxTargets: 2 });
  assert.deepEqual(scoped.selected.map((entry) => entry.id), ["p1", "p2"]);
  assert.deepEqual(scoped.excludedIds, ["s1", "p3"]);
  assert.throws(() => auditScope(targets, { domains: [], maxTargets: 1 }), /at least one domain/);
  assert.throws(() => auditScope(targets, { domains: ["unknown"], maxTargets: 1 }), /Unknown compliance domain/);
  assert.throws(() => auditScope(targets, { domains: ["projects"], maxTargets: 0 }), /positive integer/);
});

test("P13.10 self-audit is read-only and cannot auto-modify production", () => {
  assert.doesNotThrow(() => assertAuditReadOnly(false));
  assert.throws(() => assertAuditReadOnly(true), /cannot auto-modify production/);
});

test("P13.10 self-audit results become proposals and findings rather than mutations", () => {
  const proposals = auditResultsToProposals([finding("a", "critical"), finding("b", "info")]);
  assert.equal(proposals.length, 2);
  assert.equal(proposals[0].kind, "recommendation");
  assert.equal(proposals[1].kind, "finding");
  assert.ok(proposals.every((entry) => entry.autoApply === false && entry.executable === false));
});

test("P13.10 roadmap compliance report summarizes project findings", () => {
  const report = complianceReport("projects", [finding("roadmap:1")], NOW);
  assert.equal(report.domain, "projects");
  assert.equal(report.status, "attention");
  assert.equal(report.readOnly, true);
});

test("P13.10 architecture compliance report summarizes architecture findings", () => {
  assert.equal(complianceReport("architecture", [finding("arch:1", "critical")], NOW).status, "blocked");
  assert.equal(complianceReport("architecture", [], NOW).status, "compliant");
});

test("P13.10 visual compliance report summarizes visual findings", () => {
  const report = complianceReport("visual", [finding("visual:1")], NOW);
  assert.deepEqual([...COMPLIANCE_DOMAINS].includes("visual"), true);
  assert.equal(report.findings[0].targetId, "visual:1");
});

test("P13.10 agent compliance report summarizes agent findings", () => {
  assert.equal(complianceReport("agent", [finding("agent:1", "high")], NOW).status, "attention");
});

test("P13.10 data truth compliance report summarizes truth findings", () => {
  assert.equal(complianceReport("data_truth", [finding("truth:1", "critical")], NOW).status, "blocked");
});

test("P13.10 security compliance report summarizes security findings", () => {
  assert.throws(() => complianceReport("billing", [], NOW), /Unknown compliance domain/);
  assert.throws(() => complianceReport("security", [], "not-a-date"), /valid generatedAt/);
  assert.equal(complianceReport("security", [finding("sec:1")], NOW).status, "attention");
});
