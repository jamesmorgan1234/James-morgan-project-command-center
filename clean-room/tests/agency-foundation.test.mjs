import test from "node:test";
import assert from "node:assert/strict";
import {
  transitionRun,
  ProjectAgentRegistry,
  AgencyExecutorRegistry,
  SchedulerControlPlane,
  TaskClaimStore,
  ResourceClaimManager,
  readyTasks,
  safeSteal,
  createAgencyContextPacket,
  assertContextFresh,
  activateProjectAuto,
  assertAgentAutoProjectEligible,
  decideWorkLadder,
  LeadRegistry,
  canAct,
  assertAutonomyCannotExpandScope,
  validateDelegation,
  validateIndependentVerification,
  arbitrateIntegration,
  inspectShift,
  requestPause,
  requestStop,
  assertLateResponseAllowed,
  assertProtectedPreflight,
  validateReplayLog,
  replayChoices,
  evaluateCanary,
  reapOrphan,
  validateLeadFailover
} from "../dist/agency/index.js";

const T0 = "2026-10-23T18:00:00Z";
const T1 = "2026-10-23T18:01:00Z";
const T2 = "2026-10-23T18:02:00Z";

function run(overrides = {}) {
  return { id: "run1", ownerId: "owner-1", projectId: "edge-finder", controlMode: "project_auto", objective: "Continue Edge Finder", state: "queued", authorizationRef: "owner-project-auto", generation: 1, createdAt: T0, updatedAt: T0, stopRequested: false, pauseRequested: false, ...overrides };
}

function executor(overrides = {}) {
  return { key: "executor:normal-chat", version: 1, enabled: true, environments: ["normal_chat"], capabilities: ["code"], projectTypeKeys: ["project-type:software"], permissionScopes: ["repo:branch-write"], costClass: "free", health: "available", verificationStrategy: "independent", maxRisk: "high", ...overrides };
}

test("Agency run states are explicit and stop/pause gates cannot be faked", () => {
  assert.equal(transitionRun(run(), "working", T1).state, "working");
  assert.throws(() => transitionRun(run({ stopRequested: true }), "working", T1));
  assert.throws(() => transitionRun(run({ pauseRequested: true }), "working", T1));
});

test("persistent Project Agent survives worker replacement", () => {
  const registry = new ProjectAgentRegistry();
  registry.register({ id: "pa-edge", ownerId: "owner-1", projectId: "edge-finder", mission: "Complete verified project", contextVersion: 1, policyVersion: 1, queueRef: "queue-edge", checkpointRef: "cp1", state: "working", createdAt: T0, updatedAt: T0 });
  registry.assign({ projectAgentId: "pa-edge", workerId: "worker-a", assignmentId: "as1", assignedAt: T0, leaseToken: 1 });
  registry.replaceWorker("pa-edge", { projectAgentId: "pa-edge", workerId: "worker-b", assignmentId: "as2", assignedAt: T1, leaseToken: 2 });
  assert.equal(registry.get("pa-edge").mission, "Complete verified project");
  assert.equal(registry.assignment("pa-edge").workerId, "worker-b");
});

test("executor registry is extensible and obeys capability/project/risk/free-first", () => {
  const registry = new AgencyExecutorRegistry();
  registry.register(executor());
  registry.register(executor({ key: "executor:paid-work", environments: ["work"], costClass: "paid" }));
  assert.deepEqual(registry.eligible({ capability: "code", projectTypeKey: "project-type:software", environment: "normal_chat", risk: "medium", allowPaid: false }).map((item) => item.key), ["executor:normal-chat"]);
  registry.remove("executor:normal-chat", 1);
});

test("scheduler leadership uses monotonic fencing and prevents two live leaders", () => {
  const control = new SchedulerControlPlane();
  const first = control.acquire("leader-a", T0, T2);
  assert.equal(first.fencingToken, 1);
  assert.throws(() => control.acquire("leader-b", T1, "2026-10-23T18:03:00Z"));
  const second = control.acquire("leader-b", "2026-10-23T18:03:00Z", "2026-10-23T18:05:00Z");
  assert.equal(second.fencingToken, 2);
  assert.throws(() => control.assertLeader("leader-a", 1, "2026-10-23T18:03:10Z"));
});

test("task claim fencing technically rejects stale worker commit", () => {
  const claims = new TaskClaimStore();
  const one = claims.claim("task1", "worker-a", T0, T1);
  const two = claims.claim("task1", "worker-b", T2, "2026-10-23T18:04:00Z");
  assert.equal(two.fencingToken, one.fencingToken + 1);
  assert.throws(() => claims.assertCommitAllowed("task1", "worker-a", one.fencingToken, "2026-10-23T18:02:30Z"));
  assert.doesNotThrow(() => claims.assertCommitAllowed("task1", "worker-b", two.fencingToken, "2026-10-23T18:02:30Z"));
});

test("resource claims serialize conflicting writes and use deterministic ordering", () => {
  const resources = new ResourceClaimManager();
  resources.claim("job-a", [{ resourceKey: "repo:file-a", mode: "exclusive" }, { resourceKey: "db:table-b", mode: "shared" }]);
  assert.throws(() => resources.claim("job-b", [{ resourceKey: "repo:file-a", mode: "shared" }]));
  resources.releaseOwner("job-a");
  assert.doesNotThrow(() => resources.claim("job-b", [{ resourceKey: "repo:file-a", mode: "shared" }]));
});

test("dependency scheduler exposes only ready work and safe stealing respects capability/anti-affinity", () => {
  const tasks = [
    { id: "a", runId: "r", projectId: "p", title: "A", state: "verified", dependencyIds: [], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: "a", priority: 1, createdSequence: 1, affinityKeys: [], antiAffinityKeys: [] },
    { id: "b", runId: "r", projectId: "p", title: "B", state: "pending", dependencyIds: ["a"], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: [], idempotencyKey: "b", priority: 2, createdSequence: 2, affinityKeys: [], antiAffinityKeys: ["repo:x"] }
  ];
  assert.deepEqual(readyTasks(tasks).map((task) => task.id), ["b"]);
  assert.equal(safeSteal(tasks[1], ["code"], []), true);
  assert.equal(safeSteal(tasks[1], ["code"], ["repo:x"]), false);
});

test("Agency context packets are immutable/scoped and stale packets must revalidate", () => {
  const packet = createAgencyContextPacket({ id: "ctx1", runId: "r1", taskId: "t1", projectId: "edge-finder", builtAt: T0, staleAfter: T2, maxSensitivityRank: 2, sourceRefs: [{ id: "cp", version: 1, contentHash: "h", sensitivityRank: 2 }], artifactRefs: ["zip"], evidenceRefs: ["e1"] });
  assert.doesNotThrow(() => assertContextFresh(packet, T1));
  assert.throws(() => assertContextFresh(packet, T2));
});

test("Project Auto activation becomes real Working or a specific blocker, never indefinite queued fiction", () => {
  const e = executor();
  assert.deepEqual(activateProjectAuto({ run: run(), projectAutoEnabled: true, selectedProjectId: "edge-finder", projectAgentAccessEnabled: true, executorCandidates: [e], firstTaskId: "task1" }), { state: "working", runId: "run1", projectId: "edge-finder", taskId: "task1", executorKey: "executor:normal-chat" });
  assert.deepEqual(activateProjectAuto({ run: run(), projectAutoEnabled: true, selectedProjectId: "edge-finder", projectAgentAccessEnabled: true, executorCandidates: [], firstTaskId: "task1" }), { state: "blocked", runId: "run1", projectId: "edge-finder", blocker: "no_eligible_executor" });
  assert.equal(activateProjectAuto({ run: run(), projectAutoEnabled: true, selectedProjectId: "edge-finder", projectAgentAccessEnabled: true, executorCandidates: [e] }).state, "blocked");
});

test("Agent Auto excludes portfolio-disabled and book projects", () => {
  assert.throws(() => assertAgentAutoProjectEligible({ agentAccessEnabled: true, portfolioAutoEnabled: false, projectTypeKey: "project-type:software" }));
  assert.throws(() => assertAgentAutoProjectEligible({ agentAccessEnabled: true, portfolioAutoEnabled: true, projectTypeKey: "project-type:book-series" }));
  assert.doesNotThrow(() => assertAgentAutoProjectEligible({ agentAccessEnabled: true, portfolioAutoEnabled: true, projectTypeKey: "project-type:software" }));
});

test("Work ladder escalates only on capability/complexity and never on quota/provider/user/protected blockers", () => {
  const authorization = { projectId: "edge-finder", runId: "run1", projectAuto: true, workAuthorized: true, maxRung: "sol_medium", protectedActionsAuthorized: false };
  assert.deepEqual(decideWorkLadder("normal_chat", "execution_complexity", authorization, 0), { action: "escalate", rung: "luna_high", reason: "execution_complexity" });
  assert.deepEqual(decideWorkLadder("luna_high", "capability_insufficient", authorization, 0), { action: "escalate", rung: "sol_light", reason: "capability_insufficient" });
  assert.deepEqual(decideWorkLadder("sol_light", "execution_complexity", authorization, 0), { action: "escalate", rung: "sol_medium", reason: "execution_complexity" });
  assert.equal(decideWorkLadder("luna_high", "quota_unavailable", authorization, 0).action, "block");
  assert.equal(decideWorkLadder("luna_high", "transient_network", authorization, 0).action, "retry_once");
  assert.equal(decideWorkLadder("luna_high", "transient_network", authorization, 1).action, "block");
});

test("dynamic lead assembly uses capability/authority/workload rather than hard-coded org chart", () => {
  const leads = new LeadRegistry();
  leads.register({ key: "lead:build-a", capabilities: ["build"], projectTypeKeys: ["project-type:software"], authorityScopes: ["repo:write"], maxConcurrentAssignments: 2, healthy: true });
  leads.register({ key: "lead:build-b", capabilities: ["build"], projectTypeKeys: ["project-type:software"], authorityScopes: ["repo:write"], maxConcurrentAssignments: 2, healthy: true });
  assert.equal(leads.assemble({ capability: "build", projectTypeKey: "project-type:software", requiredAuthorityScopes: ["repo:write"], workloadByLead: { "lead:build-a": 1, "lead:build-b": 0 } }).key, "lead:build-b");
});

test("autonomy and delegation cannot amplify protected authority", () => {
  assert.equal(canAct("continuous", "protected", false), false);
  assert.equal(canAct("continuous", "protected", true), true);
  assert.throws(() => assertAutonomyCannotExpandScope(["repo:read"], ["repo:write"]));
  assert.throws(() => validateDelegation({ parentTaskId: "p", childTaskId: "c", depth: 2, parentScopes: ["repo:read"], childScopes: ["repo:write"], capability: "research" }, 3, 0, 4));
  assert.doesNotThrow(() => validateDelegation({ parentTaskId: "p", childTaskId: "c", depth: 2, parentScopes: ["repo:read"], childScopes: ["repo:read"], capability: "research" }, 3, 0, 4));
});

test("high-risk executor cannot self-certify", () => {
  assert.throws(() => validateIndependentVerification({ taskId: "t", executorId: "worker-a", verifierId: "worker-a", risk: "high", evidenceRefs: ["e"] }));
  assert.doesNotThrow(() => validateIndependentVerification({ taskId: "t", executorId: "worker-a", verifierId: "verifier-b", risk: "high", evidenceRefs: ["e"] }));
});

test("integration arbitration rejects overlapping divergent outputs instead of last-write-wins", () => {
  const decision = arbitrateIntegration([{ taskId: "a", artifactKey: "file:x", version: 1, contentHash: "h1", verificationRefs: ["v1"] }, { taskId: "b", artifactKey: "file:x", version: 1, contentHash: "h2", verificationRefs: ["v2"] }]);
  assert.deepEqual(decision.conflicts, ["file:x"]);
  assert.deepEqual(decision.acceptedTaskIds, []);
});

test("Shift Manager detects stale worker without falsely calling it active", () => {
  const incidents = inspectShift([{ workerId: "w1", projectId: "edge-finder", taskId: "t1", state: "working", lastHeartbeatAt: T0 }], "2026-10-23T18:10:00Z", 120_000);
  assert.equal(incidents[0].kind, "stalled");
  assert.equal(incidents[0].ownerAttentionRequired, false);
});

test("atomic stop increments generation and prevents stale late response resurrection", () => {
  let control = { runId: "r1", generation: 4, paused: false, stopped: false };
  control = requestPause(control);
  assert.equal(control.paused, true);
  control = requestStop(control);
  assert.equal(control.generation, 5);
  assert.throws(() => assertLateResponseAllowed(control, 4));
});

test("protected preflight enforces project lock, health, fresh authorization, and credential scope", () => {
  const good = { projectId: "cc", projectLockProjectId: "cc", requestedScopes: ["deploy:read"], credential: { id: "cred", provider: "test", allowedScopes: ["deploy:read"], projectId: "cc" }, toolHealthy: true, authorizationFresh: true, protectedActionAuthorized: true };
  assert.doesNotThrow(() => assertProtectedPreflight(good));
  assert.throws(() => assertProtectedPreflight({ ...good, requestedScopes: ["deploy:write"] }));
  assert.throws(() => assertProtectedPreflight({ ...good, protectedActionAuthorized: false }));
});

test("deterministic replay validates sequence and reproduces recorded choices", () => {
  const log = [{ sequence: 1, kind: "scheduler", inputHash: "i1", outputHash: "o1", chosenValue: "worker-a" }, { sequence: 2, kind: "retry", inputHash: "i2", outputHash: "o2", chosenValue: "block" }];
  assert.doesNotThrow(() => validateReplayLog(log));
  assert.deepEqual(replayChoices(log), ["worker-a", "block"]);
  assert.throws(() => validateReplayLog([{ ...log[1], sequence: 2 }]));
});

test("canary rollout contains regressions before broad promotion", () => {
  const stable = { successRate: 0.98, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 };
  assert.equal(evaluateCanary(stable, { ...stable, successRate: 0.99 }).promote, true);
  assert.equal(evaluateCanary(stable, { ...stable, protectedBoundaryViolationCount: 1 }).promote, false);
  assert.equal(evaluateCanary(stable, { ...stable, successRate: 0.90 }).promote, false);
});

test("orphan recovery and lead failover preserve checkpoint/mission/queue", () => {
  assert.deepEqual(reapOrphan({ taskId: "t1", workerId: "w1", leaseExpiresAt: T1, checkpointRef: "cp1", evidenceRefs: ["e1"] }, T2), { taskId: "t1", reclaim: true, resumeFrom: "cp1" });
  assert.doesNotThrow(() => validateLeadFailover({ projectAgentId: "pa1", priorLeadId: "l1", replacementLeadId: "l2", missionRef: "mission", queueRef: "queue", checkpointRef: "cp", authorityScopes: ["repo:write"] }));
});
