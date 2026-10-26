import test from "node:test";
import assert from "node:assert/strict";
import { computeHealthSnapshot, validateExplainabilityChain, classifyDriftPressure, assessIndependentConsensus, validateGovernanceProposal, detectFormulaDrift, auditEventStream } from "../dist/analytics/index.js";

test("P13.1 cognitive/ecosystem health keeps missing data unknown and provenance/uncertainty explicit", () => {
  const snapshot = computeHealthSnapshot([{ key: "calibration_drift", value: 0.2, sourceRefs: ["eval"], observedAt: "2026-10-26T06:00:00Z", uncertainty: 0.1, truth: "calculated" }]);
  assert.equal(snapshot.values.calibration_drift, 0.2);
  assert.equal(snapshot.values.routing_regret, null);
  assert.ok(snapshot.missing.includes("routing_regret"));
});

test("P13.2 explainability covers intent through learning without secret leakage", () => {
  const stages = ["intent", "context", "policy", "method", "evidence", "verifier", "outcome", "learning"];
  assert.equal(validateExplainabilityChain(stages.map((stage, index) => ({ stage, summary: `s${index}`, evidenceRefs: [`e${index}`], containsSecret: false }))).length, 8);
  assert.throws(() => validateExplainabilityChain(stages.map((stage, index) => ({ stage, summary: `s${index}`, evidenceRefs: [`e${index}`], containsSecret: stage === "context" }))));
});

test("P13.3 drift pressure distinguishes actual failure domains and revalidation", () => {
  const result = classifyDriftPressure([
    { domain: "provider", subjectRef: "p", severity: "critical", sourceRefs: ["health"], revalidationDue: false },
    { domain: "model", subjectRef: "m", severity: "warning", sourceRefs: ["bench"], revalidationDue: true }
  ]);
  assert.equal(result.primaryDomain, "provider");
  assert.equal(result.revalidationPressure, 1);
});

test("P13.8 correlated observations are not counted as independent consensus", () => {
  const result = assessIndependentConsensus([
    { id: "1", claimRef: "c", decision: "support", sourceRef: "same", providerRef: "p", modelRef: "m", benchmarkRef: "b", sourceRefs: ["e1"] },
    { id: "2", claimRef: "c", decision: "support", sourceRef: "same", providerRef: "p", modelRef: "m", benchmarkRef: "b", sourceRefs: ["e2"] }
  ]);
  assert.equal(result.independentGroups, 1);
  assert.equal(result.consensus, "insufficient");
  assert.equal(result.correlatedGroups.length, 1);
});

test("P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply", () => {
  assert.throws(() => validateGovernanceProposal({ id: "g", kind: "architecture_critic", requirementRefs: ["r"], impactRefs: ["i"], evidenceRefs: ["e"], dependencyRefs: ["d"], proposal: "fix", autoApply: true }));
  assert.doesNotThrow(() => validateGovernanceProposal({ id: "g2", kind: "ecosystem_optimizer", requirementRefs: ["r"], impactRefs: ["i"], evidenceRefs: ["e"], dependencyRefs: ["d"], proposal: "evaluate option", autoApply: false }));
});

test("P13.10 formula drift, duplicates, delays, privacy, and bounded high-volume behavior are measurable", () => {
  assert.deepEqual(detectFormulaDrift([
    { metricKey: "x", version: 1, formulaHash: "a", effectiveAt: "2026-10-26T00:00:00Z" },
    { metricKey: "x", version: 2, formulaHash: "b", effectiveAt: "2026-10-26T01:00:00Z" }
  ]), ["x@1->2"]);
  const events = Array.from({ length: 10000 }, (_, index) => ({ id: `e${index}`, occurredAt: "2026-10-26T00:00:00Z", receivedAt: index === 0 ? "2026-10-26T00:02:00Z" : "2026-10-26T00:00:01Z", containsSensitivePayload: false }));
  events.push({ ...events[0] });
  const audit = auditEventStream(events);
  assert.equal(audit.unique, 10000);
  assert.equal(audit.duplicates, 1);
  assert.equal(audit.delayed, 1);
  assert.equal(audit.highVolumeSafe, true);
  assert.throws(() => auditEventStream([{ id: "x", occurredAt: "2026-10-26T00:00:00Z", receivedAt: "2026-10-26T00:00:01Z", containsSensitivePayload: true }]));
});
