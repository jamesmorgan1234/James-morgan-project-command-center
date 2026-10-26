import test from "node:test";
import assert from "node:assert/strict";
import {
  ProjectAgentRegistry,
  TaskClaimStore,
  arbitrateIntegration,
  detectCoordinationFaults,
  coordinationRecoveryDisposition,
  validateLogicalLeadAssignment,
  handoffLogicalLead,
  failoverLogicalLead
} from "../dist/agency/index.js";

const AGENT = {
  id: "project-agent:cc",
  ownerId: "owner:james",
  projectId: "command-center",
  mission: "complete verified work",
  contextVersion: 1,
  policyVersion: 1,
  queueRef: "queue:cc",
  checkpointRef: "checkpoint:cc",
  state: "ready",
  createdAt: "2026-10-26T12:00:00Z",
  updatedAt: "2026-10-26T12:00:00Z"
};

test("CCR-05826 persistent logical Project Agent identity survives worker replacement and rejects stale/unknown assignment", () => {
  const registry = new ProjectAgentRegistry();
  registry.register(AGENT);
  registry.assign({ projectAgentId: AGENT.id, workerId: "worker:a", assignmentId: "assignment:1", assignedAt: "2026-10-26T12:01:00Z", leaseToken: 1 });
  registry.replaceWorker(AGENT.id, { projectAgentId: AGENT.id, workerId: "worker:b", assignmentId: "assignment:2", assignedAt: "2026-10-26T12:02:00Z", leaseToken: 2 });
  assert.equal(registry.get(AGENT.id).mission, AGENT.mission);
  assert.equal(registry.get(AGENT.id).projectId, AGENT.projectId);
  assert.equal(registry.assignment(AGENT.id).workerId, "worker:b");
  assert.throws(() => registry.replaceWorker(AGENT.id, { projectAgentId: AGENT.id, workerId: "worker:c", assignmentId: "assignment:3", assignedAt: "2026-10-26T12:03:00Z", leaseToken: 2 }), /advance lease token/);
  assert.throws(() => registry.assign({ projectAgentId: "missing-agent", workerId: "worker:x", assignmentId: "assignment:x", assignedAt: "2026-10-26T12:03:00Z", leaseToken: 1 }), /Unknown Project Agent/);
});

test("CCR-05828 task-claim fencing rejects stale and expired commits while current owner remains eligible", () => {
  const claims = new TaskClaimStore();
  const first = claims.claim("task:1", "worker:a", "2026-10-26T12:00:00Z", "2026-10-26T12:01:00Z");
  assert.doesNotThrow(() => claims.assertCommitAllowed("task:1", "worker:a", first.fencingToken, "2026-10-26T12:00:30Z"));
  const second = claims.claim("task:1", "worker:b", "2026-10-26T12:01:00Z", "2026-10-26T12:02:00Z");
  assert.equal(second.fencingToken > first.fencingToken, true);
  assert.throws(() => claims.assertCommitAllowed("task:1", "worker:a", first.fencingToken, "2026-10-26T12:01:10Z"), /Stale worker/);
  assert.throws(() => claims.assertCommitAllowed("task:1", "worker:b", second.fencingToken, "2026-10-26T12:02:00Z"), /Expired task claim/);
});

test("CCR-05829 integration arbitration accepts identical verified outputs but fails closed on divergent or unverifiable outputs", () => {
  const identical = arbitrateIntegration([
    { taskId: "a", artifactKey: "file:x", version: 2, contentHash: "same", verificationRefs: ["verification:a"] },
    { taskId: "b", artifactKey: "file:x", version: 2, contentHash: "same", verificationRefs: ["verification:b"] }
  ]);
  assert.deepEqual(identical.acceptedTaskIds, ["a", "b"]);
  assert.deepEqual(identical.conflicts, []);
  const conflict = arbitrateIntegration([
    { taskId: "a", artifactKey: "file:x", version: 2, contentHash: "one", verificationRefs: ["verification:a"] },
    { taskId: "b", artifactKey: "file:x", version: 2, contentHash: "two", verificationRefs: ["verification:b"] }
  ]);
  assert.deepEqual(conflict.acceptedTaskIds, []);
  assert.deepEqual(conflict.conflicts, ["file:x"]);
  assert.throws(() => arbitrateIntegration([{ taskId: "bad", artifactKey: "file:y", version: 1, contentHash: "h", verificationRefs: [] }]), /lacks verification/);
});

test("CCR-05831 coordination fault detection validates observations and keeps ordinary recovery separate from owner escalation", () => {
  const base = { state: "working", priority: 1, waitingOnTaskIds: [], progressToken: "p1", previousProgressToken: "p0", lastProgressAt: "2026-10-26T12:00:00Z", lastHeartbeatAt: "2026-10-26T12:00:00Z", workerId: "w", claimExpiresAt: "2026-10-26T12:20:00Z" };
  const faults = detectCoordinationFaults([{ ...base, taskId: "stuck" }], "2026-10-26T12:10:00Z", 60_000);
  assert.equal(faults.some((fault) => fault.kind === "no_progress"), true);
  assert.equal(coordinationRecoveryDisposition(false), "recover");
  assert.equal(coordinationRecoveryDisposition(true), "escalate_owner");
  assert.throws(() => detectCoordinationFaults([{ ...base, taskId: "dup" }, { ...base, taskId: "dup" }], "2026-10-26T12:10:00Z", 60_000), /unique/);
  assert.throws(() => detectCoordinationFaults([], "2026-10-26T12:10:00Z", 0), /positive/);
});

test("CCR-05835 and CCR-05846 logical leadership handoff/failover preserve authority while rejecting same-holder or evidence-free transitions", () => {
  const assignment = validateLogicalLeadAssignment({
    assignmentId: "lead-assignment:project",
    scopeKind: "project",
    scopeId: "project:cc",
    mission: "complete verified work",
    capabilities: ["build"],
    authorityEnvelope: ["repo:isolated-branch"],
    currentHolder: "lead:a",
    handoffState: "stable",
    evidenceRefs: ["evidence:assignment"],
    decisionRefs: ["decision:owner"],
    dependencyRefs: ["dependency:p15.1"],
    nextAction: "continue exact next verified task",
    version: 1
  });
  const handed = handoffLogicalLead(assignment, "lead:b", "evidence:handoff");
  const failedOver = failoverLogicalLead(handed, "lead:c", "evidence:failover");
  assert.deepEqual(failedOver.authorityEnvelope, assignment.authorityEnvelope);
  assert.equal(failedOver.mission, assignment.mission);
  assert.deepEqual(failedOver.decisionRefs, assignment.decisionRefs);
  assert.deepEqual(failedOver.dependencyRefs, assignment.dependencyRefs);
  assert.equal(failedOver.nextAction, assignment.nextAction);
  assert.throws(() => handoffLogicalLead(assignment, "lead:a", "evidence:same"), /distinct/);
  assert.throws(() => handoffLogicalLead(assignment, "lead:b", ""), /requires evidence/);
});
