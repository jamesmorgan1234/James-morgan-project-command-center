import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SchedulerControlPlane,
  TaskClaimStore,
  ResourceClaimManager,
  readyTasks,
  safeSteal,
  createAgencyContextPacket,
  assertContextFresh,
  assertAgentAutoProjectEligible,
  decideWorkLadder,
  canAct,
  assertAutonomyCannotExpandScope,
  validateDelegation,
  validateIndependentVerification,
  arbitrateIntegration,
  inspectShift,
  requestStop,
  assertLateResponseAllowed,
  assertProtectedPreflight,
  validateReplayLog,
  evaluateCanary,
  recoverExpiredAssignment
} from "../dist/agency/index.js";

const migration = (name) => readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");

test("P7.24 duplicate schedulers and stale worker generations fail closed", () => {
  const sched = new SchedulerControlPlane();
  const lease1 = sched.acquire("leader-a", "2026-10-24T16:00:00Z", "2026-10-24T16:01:00Z");
  assert.throws(() => sched.acquire("leader-b", "2026-10-24T16:00:30Z", "2026-10-24T16:02:00Z"), /already held/);
  const lease2 = sched.acquire("leader-b", "2026-10-24T16:01:01Z", "2026-10-24T16:02:00Z");
  assert.throws(() => sched.assertLeader("leader-a", lease1.fencingToken, "2026-10-24T16:01:10Z"), /mismatch/);
  assert.doesNotThrow(() => sched.assertLeader("leader-b", lease2.fencingToken, "2026-10-24T16:01:10Z"));

  const claims = new TaskClaimStore();
  const first = claims.claim("t1", "w1", "2026-10-24T16:00:00Z", "2026-10-24T16:01:00Z");
  const second = claims.claim("t1", "w2", "2026-10-24T16:01:01Z", "2026-10-24T16:02:00Z");
  assert.throws(() => claims.assertCommitAllowed("t1", "w1", first.fencingToken, "2026-10-24T16:01:10Z"), /Stale worker/);
  assert.doesNotThrow(() => claims.assertCommitAllowed("t1", "w2", second.fencingToken, "2026-10-24T16:01:10Z"));
});

test("P7.24 overlapping resource mutations serialize and nonconflicting work remains parallel", () => {
  const resources = new ResourceClaimManager();
  resources.claim("run-a", [{ resourceKey: "credential:git", mode: "exclusive" }, { resourceKey: "file:a", mode: "shared" }]);
  assert.doesNotThrow(() => resources.claim("run-b", [{ resourceKey: "file:a", mode: "shared" }, { resourceKey: "file:b", mode: "exclusive" }]));
  assert.throws(() => resources.claim("run-c", [{ resourceKey: "credential:git", mode: "shared" }]), /Resource conflict/);
});

test("P7.24 context leakage, sensitivity overflow and stale context fail closed", () => {
  assert.throws(() => createAgencyContextPacket({ id: "ctx", runId: "r", taskId: "t", projectId: "p", builtAt: "2026-10-24T16:00:00Z", staleAfter: "2026-10-24T16:10:00Z", maxSensitivityRank: 2, sourceRefs: [{ id: "secret", version: 1, contentHash: "a".repeat(64), sensitivityRank: 3 }], artifactRefs: [], evidenceRefs: ["e"] }), /sensitivity envelope/);
  const packet = createAgencyContextPacket({ id: "ctx", runId: "r", taskId: "t", projectId: "p", builtAt: "2026-10-24T16:00:00Z", staleAfter: "2026-10-24T16:10:00Z", maxSensitivityRank: 2, sourceRefs: [{ id: "safe", version: 1, contentHash: "b".repeat(64), sensitivityRank: 1 }], artifactRefs: [], evidenceRefs: ["e"] });
  assert.throws(() => assertContextFresh(packet, "2026-10-24T16:10:00Z"), /stale/);
});

test("P7.24 portfolio and Work rules cannot silently broaden project scope or execution environment", () => {
  assert.throws(() => assertAgentAutoProjectEligible({ agentAccessEnabled: true, portfolioAutoEnabled: true, projectTypeKey: "project-type:book-fiction" }), /Books are portfolio-auto excluded/);
  const auth = { projectId: "p", runId: "r", projectAuto: true, workAuthorized: true, maxRung: "sol_medium", protectedActionsAuthorized: false };
  assert.equal(decideWorkLadder("normal_chat", "provider_unavailable", auth, 0).action, "block");
  assert.equal(decideWorkLadder("normal_chat", "capability_insufficient", auth, 0).action, "escalate");
});

test("P7.24 autonomy and delegation never amplify authority", () => {
  assert.equal(canAct("continuous", "protected", false), false);
  assert.throws(() => assertAutonomyCannotExpandScope(["project:read"], ["money:write"]), /cannot amplify authority/);
  assert.throws(() => validateDelegation({ parentTaskId: "p", childTaskId: "c", depth: 1, parentScopes: ["project:read"], childScopes: ["money:write"], capability: "research" }, 3, 0, 3), /authority amplification/);
});

test("P7.24 high-risk executor cannot self-verify and conflicting parallel outputs cannot last-write-win", () => {
  assert.throws(() => validateIndependentVerification({ taskId: "t", executorId: "worker", verifierId: "worker", risk: "high", evidenceRefs: ["e"] }), /independent verifier/);
  const arbitration = arbitrateIntegration([
    { taskId: "t1", artifactKey: "artifact:x", version: 1, contentHash: "a".repeat(64), verificationRefs: ["v1"] },
    { taskId: "t2", artifactKey: "artifact:x", version: 2, contentHash: "b".repeat(64), verificationRefs: ["v2"] }
  ]);
  assert.deepEqual(arbitration.acceptedTaskIds, []);
  assert.deepEqual(arbitration.conflicts, ["artifact:x"]);
});

test("P7.24 kill/stop fences late worker responses and Shift Manager surfaces real incidents", () => {
  const stopped = requestStop({ runId: "r", generation: 7, paused: false, stopped: false }, "agency");
  assert.equal(stopped.generation, 8);
  assert.throws(() => assertLateResponseAllowed(stopped, 7), /Stopped run rejects late worker response/);
  const incidents = inspectShift([{ workerId: "w", projectId: "p", taskId: "t", state: "working", lastHeartbeatAt: "2026-10-24T16:00:00Z" }], "2026-10-24T16:02:00Z", 60000);
  assert.equal(incidents[0].kind, "stalled");
});

test("P7.24 protected preflight rejects stale authorization, unhealthy provider, and credential-scope mismatch", () => {
  const base = { projectId: "p", projectLockProjectId: "p", requestedScopes: ["repo:write"], credential: { id: "cred", provider: "git", allowedScopes: ["repo:write"], projectId: "p" }, toolHealthy: true, authorizationFresh: true, protectedActionAuthorized: true };
  assert.throws(() => assertProtectedPreflight({ ...base, authorizationFresh: false }), /fresh exact authorization/);
  assert.throws(() => assertProtectedPreflight({ ...base, toolHealthy: false }), /health/);
  assert.throws(() => assertProtectedPreflight({ ...base, requestedScopes: ["money:write"] }), /Credential scope denied/);
});

test("P7.24 deterministic replay rejects missing sequence and canary safety rolls back dangerous candidates", () => {
  assert.throws(() => validateReplayLog([
    { sequence: 1, kind: "scheduler", inputHash: "a".repeat(64), outputHash: "b".repeat(64), chosenValue: "t1" },
    { sequence: 3, kind: "retry", inputHash: "c".repeat(64), outputHash: "d".repeat(64), chosenValue: "retry" }
  ]), /Replay sequence gap at 2/);
  assert.equal(evaluateCanary({ stableSuccessRate: 0.99, candidateSuccessRate: 0.99, stableVerificationFailureRate: 0.01, candidateVerificationFailureRate: 0.01, protectedBoundaryViolationCount: 1, duplicateSideEffectCount: 0 }, 0.02).action, "rollback");
});

test("P7.24 expired worker recovery preserves checkpoint/evidence and increments generation/fence", () => {
  const recovered = recoverExpiredAssignment({ taskId: "t", workerId: "old", generation: 4, fencingToken: 9, claimedAt: "2026-10-24T16:00:00Z", expiresAt: "2026-10-24T16:01:00Z", checkpointRef: "cp", evidenceRefs: ["e"] }, "new", "2026-10-24T16:01:01Z");
  assert.equal(recovered.workerId, "new");
  assert.equal(recovered.generation, 5);
  assert.equal(recovered.fencingToken, 10);
  assert.equal(recovered.checkpointRef, "cp");
});

test("P7.24 scale: thousands of independent ready tasks remain deterministically ordered and stealable", () => {
  const tasks = Array.from({ length: 5000 }, (_, i) => ({ id: `t-${String(i).padStart(5,"0")}`, runId: "r", projectId: "p", title: `Task ${i}`, state: "ready", dependencyIds: [], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: `k-${i}`, priority: i % 7, createdSequence: i, affinityKeys: [], antiAffinityKeys: [] }));
  const ready = readyTasks(tasks);
  assert.equal(ready.length, 5000);
  assert.equal(ready[0].priority, 0);
  assert.equal(ready.at(-1).priority, 6);
  assert.equal(safeSteal(ready[0], ["code"], []), true);
});

test("P7.24 durable control plane encodes network/provider/crash/replay/duplicate-effect safety structurally", async () => {
  const names = [
    "20261024152500_category7_run_job_task_state.sql",
    "20261024154000_category7_scheduler_leadership.sql",
    "20261024154500_category7_task_claims.sql",
    "20261024155000_category7_resource_claims.sql",
    "20261024160000_category7_context_packets.sql",
    "20261024162000_category7_work_ladder.sql",
    "20261024165500_category7_pause_stop_kill.sql",
    "20261024170000_category7_protected_preflight.sql",
    "20261024170500_category7_deterministic_replay.sql",
    "20261024171000_category7_canary_rollout.sql",
    "20261024171500_category7_recovery_failover.sql"
  ];
  const text = (await Promise.all(names.map(migration))).join("\n");
  for (const token of ["network_partition","provider_outage","process_crash","fencing_token","idempotency_key","duplicate_side_effect_prevented","protected_side_effects_executed","authorization_expired","kill_agency","rollback_required"]) assert.match(text, new RegExp(token));
  assert.doesNotMatch(text, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_/i);
});
