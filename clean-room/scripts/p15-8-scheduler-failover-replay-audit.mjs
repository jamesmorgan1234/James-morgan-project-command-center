/**
 * P15.8 — Agency scheduler, worker, lead failover and replay acceptance.
 *
 * Authority (roadmap P15.8): scheduler leadership failover, worker crash/
 * replacement, Project Agent persistence, Shift Manager incident handling, lead
 * failover, deterministic replay, workload replay and canary rollback. Exit gate:
 * mission/queue/evidence/authority survive failures and replay explains
 * coordination decisions.
 *
 * Exercised against the real compiled Agency implementation (dist/agency).
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  ProjectAgentRegistry,
  ProjectAgentStore,
  SchedulerControlPlane,
  evaluateCanary,
  inspectShift,
  inspectShiftManager,
  reapOrphan,
  recoverExpiredAssignment,
  replayChoices,
  validateLeadFailover,
  validateReplayLog
} from "../dist/agency/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const T0 = "2026-11-01T00:00:00.000Z";
const T1 = "2026-11-01T00:01:00.000Z";
const T2 = "2026-11-01T00:02:00.000Z";
const T3 = "2026-11-01T00:03:00.000Z";

const results = [];
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const expectThrow = (run, pattern, message) => {
  try { run(); } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected error "${error.message}"`);
    return;
  }
  throw new Error(`${message}: expected a rejection but the operation succeeded`);
};
const suite = (id, description, body) => {
  const checks = [];
  const check = (name, run) => {
    try { run(); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  body(check);
  const failed = checks.filter((entry) => !entry.passed);
  results.push({ id, description, passed: failed.length === 0, checks });
};

const agent = (overrides = {}) => ({
  id: "pa-edge",
  ownerId: "owner-1",
  projectId: "edge-finder",
  mission: "Complete verified project",
  contextVersion: 2,
  policyVersion: 1,
  queueRef: "queue-edge",
  checkpointRef: "cp-1",
  state: "working",
  createdAt: T0,
  updatedAt: T0,
  ...overrides
});

suite("scheduler-leadership-and-fencing", "Scheduler leadership is single-owner and fenced across failover", (check) => {
  check("a second scheduler cannot lead while the first lease is live", () => {
    const control = new SchedulerControlPlane();
    const first = control.acquire("leader-a", T0, T2);
    expect(first.fencingToken === 1 && first.term === 1, "first leadership must open term/fence at 1");
    expectThrow(() => control.acquire("leader-b", T1, T3), /already held/i, "live leadership cannot be stolen");
    control.assertLeader("leader-a", first.fencingToken, T1);
  });
  check("expired leadership fails over with a higher fence and rejects the stale leader", () => {
    const control = new SchedulerControlPlane();
    const first = control.acquire("leader-a", T0, T1);
    const second = control.acquire("leader-b", T2, T3);
    expect(second.fencingToken === first.fencingToken + 1 && second.term === first.term + 1, "failover must advance term and fence");
    expectThrow(() => control.assertLeader("leader-a", first.fencingToken, T2), /mismatch/i, "stale leader must be rejected");
    control.assertLeader("leader-b", second.fencingToken, T2);
    expectThrow(() => control.assertLeader("leader-b", second.fencingToken, T3), /expired/i, "expired leadership must be rejected");
  });
  check("leadership acquisition validates the lease window", () => {
    const control = new SchedulerControlPlane();
    expectThrow(() => control.acquire("leader-a", T1, T1), /expire after/i, "zero-length leadership must be rejected");
  });
});

suite("worker-crash-and-project-agent-persistence", "Mission, queue and checkpoint survive worker replacement", (check) => {
  check("Project Agent identity survives worker churn with a monotonic lease", () => {
    const registry = new ProjectAgentRegistry();
    registry.register(agent());
    registry.assign({ projectAgentId: "pa-edge", workerId: "worker-a", assignmentId: "as-1", assignedAt: T0, leaseToken: 1 });
    registry.replaceWorker("pa-edge", { projectAgentId: "pa-edge", workerId: "worker-b", assignmentId: "as-2", assignedAt: T1, leaseToken: 2 });
    const record = registry.get("pa-edge");
    expect(record.mission === "Complete verified project" && record.queueRef === "queue-edge" && record.checkpointRef === "cp-1", "mission/queue/checkpoint must survive replacement");
    expect(record.contextVersion === 2 && record.policyVersion === 1, "context and policy versions must survive replacement");
    expect(registry.assignment("pa-edge").workerId === "worker-b", "assignment must move to the replacement worker");
    expectThrow(() => registry.replaceWorker("pa-edge", { projectAgentId: "pa-edge", workerId: "worker-c", assignmentId: "as-3", assignedAt: T2, leaseToken: 2 }), /advance lease token/i, "replacement must advance the lease");
    expectThrow(() => registry.replaceWorker("pa-missing", { projectAgentId: "pa-missing", workerId: "worker-x", assignmentId: "as-x", assignedAt: T2, leaseToken: 9 }), /unknown project agent/i, "unknown agents cannot be replaced");
  });
  check("Project Agent store claims and releases workers without losing state", () => {
    const store = new ProjectAgentStore();
    const created = store.create({ agentId: "agent-edge", projectId: "edge-finder", projectType: "software", mission: "Ship", state: "Ready", queueRefs: ["queue:main"], checkpointRefs: ["cp:1"], contextVersion: 1, policyVersion: 1 });
    expect(created.generation === 1, "new agent state starts at generation 1");
    const claimed = store.claimWorker("edge-finder", "worker-a");
    expect(claimed.generation === 2 && claimed.workerId === "worker-a", "claim must advance generation");
    expectThrow(() => store.claimWorker("edge-finder", "worker-b"), /already claimed/i, "a second worker cannot claim a live agent");
    expectThrow(() => store.releaseWorker("edge-finder", "worker-b"), /mismatch/i, "release requires the owning worker");
    const released = store.releaseWorker("edge-finder", "worker-a");
    expect(released.workerId === undefined && released.generation === 3, "release must clear the worker and advance generation");
    expect(store.get("edge-finder").mission === "Ship", "mission must survive claim/release");
    expectThrow(() => store.create({ agentId: "agent-edge", projectId: "other", projectType: "software", mission: "Other", state: "Ready", queueRefs: ["q"], checkpointRefs: ["c"], contextVersion: 1, policyVersion: 1 }), /id already exists/i, "agent ids must be unique");
  });
  check("orphaned assignments requeue only from a verified checkpoint", () => {
    const orphan = { taskId: "t1", workerId: "worker-a", leaseExpiresAt: T1, checkpointRef: "cp-1", evidenceRefs: ["evd:1"] };
    expectThrow(() => reapOrphan(orphan, T0), /live assignment/i, "a live assignment cannot be reaped");
    expect(reapOrphan(orphan, T2).resumeFrom === "cp-1", "orphan recovery must resume from the checkpoint");
    expectThrow(() => reapOrphan({ ...orphan, checkpointRef: "  " }, T2), /checkpoint/i, "recovery requires a checkpoint");
    expectThrow(() => reapOrphan({ ...orphan, evidenceRefs: [] }, T2), /evidence/i, "recovery requires evidence");
  });
});

suite("shift-incidents-and-owner-boundaries", "Shift Manager distinguishes recoverable incidents from real owner boundaries", (check) => {
  check("stalled and failed workers are recoverable, blocked workers escalate only when listed", () => {
    const workers = [
      { workerId: "w1", projectId: "p", taskId: "t-stalled", state: "working", lastHeartbeatAt: T0 },
      { workerId: "w2", projectId: "p", taskId: "t-failed", state: "failed", lastHeartbeatAt: T2 },
      { workerId: "w3", projectId: "p", taskId: "t-blocked", state: "blocked", lastHeartbeatAt: T2 }
    ];
    const base = inspectShift(workers, T2, 60_000);
    const stalled = base.find((incident) => incident.taskId === "t-stalled");
    const failed = base.find((incident) => incident.taskId === "t-failed");
    expect(stalled.kind === "stalled" && stalled.ownerAttentionRequired === false, "stalled work must be recoverable, not owner-blocked");
    expect(failed.kind === "failed" && failed.ownerAttentionRequired === false, "failed work must be recoverable");
    const assessment = inspectShiftManager({ workers, queueDepth: 5, queueCapacity: 10, resourcePressure: 0.4, coordinationFaults: [], ownerBoundaryTaskIds: ["t-blocked"] }, T2, 60_000);
    expect(assessment.safeHandoffTaskIds.join(",") === "t-failed,t-stalled", "stalled/failed work must be handed off");
    expect(assessment.ownerBoundaryTaskIds.join(",") === "t-blocked", "only declared owner boundaries escalate");
    expect(assessment.containmentRequired === true, "incidents must require containment");
    expect(assessment.queuePressure === 0.5, "queue pressure must be computed");
  });
  check("coordination faults split into recoverable and owner-boundary sets", () => {
    const assessment = inspectShiftManager({
      workers: [],
      queueDepth: 10,
      queueCapacity: 10,
      resourcePressure: 0.95,
      coordinationFaults: [{ taskId: "t-rec", kind: "lease_conflict", ownerBoundaryRequired: false }, { taskId: "t-owner", kind: "consent_required", ownerBoundaryRequired: true }],
      ownerBoundaryTaskIds: []
    }, T0, 60_000);
    expect(assessment.recoverableFaultTaskIds.join(",") === "t-rec", "recoverable faults must be separated");
    expect(assessment.ownerBoundaryTaskIds.join(",") === "t-owner", "owner-boundary faults must escalate");
    expect(assessment.containmentRequired === true, "queue saturation and resource pressure must trigger containment");
    expect(assessment.queuePressure === 1, "queue pressure must saturate at 1");
  });
  check("Shift Manager rejects invalid coordination input", () => {
    const base = { workers: [], queueDepth: 0, queueCapacity: 1, resourcePressure: 0.1, coordinationFaults: [], ownerBoundaryTaskIds: [] };
    expectThrow(() => inspectShiftManager({ ...base, queueDepth: -1 }, T0, 60_000), /queue depth/i, "negative queue depth must be rejected");
    expectThrow(() => inspectShiftManager({ ...base, resourcePressure: 1.5 }, T0, 60_000), /resource pressure/i, "invalid pressure must be rejected");
    expectThrow(() => inspectShiftManager({ ...base, coordinationFaults: [{ taskId: "t", kind: "x", ownerBoundaryRequired: false }, { taskId: "t", kind: "y", ownerBoundaryRequired: false }] }, T0, 60_000), /unique/i, "duplicate faults must be rejected");
  });
});

suite("lead-failover", "Lead failover preserves mission, queue, checkpoint and authority", (check) => {
  check("failover requires a replacement and durable references", () => {
    const failover = { projectAgentId: "pa", priorLeadId: "lead-a", replacementLeadId: "lead-b", missionRef: "mission:1", queueRef: "queue:1", checkpointRef: "cp:1", authorityScopes: ["repo:write"] };
    validateLeadFailover(failover);
    expectThrow(() => validateLeadFailover({ ...failover, replacementLeadId: "lead-a" }), /replacement identity/i, "failover must change the lead");
    expectThrow(() => validateLeadFailover({ ...failover, missionRef: " " }), /mission/i, "failover must preserve the mission");
    expectThrow(() => validateLeadFailover({ ...failover, queueRef: " " }), /queue/i, "failover must preserve the queue");
    expectThrow(() => validateLeadFailover({ ...failover, checkpointRef: " " }), /checkpoint/i, "failover must preserve the checkpoint");
  });
  check("expired assignments recover to a replacement worker with new fence and revalidation", () => {
    const assignment = { taskId: "t1", workerId: "worker-a", generation: 3, fencingToken: 7, claimedAt: T0, expiresAt: T1, checkpointRef: "cp-1", evidenceRefs: ["evd:1"] };
    expectThrow(() => recoverExpiredAssignment(assignment, "worker-b", T0), /not expired/i, "live assignments cannot be recovered");
    const recovered = recoverExpiredAssignment(assignment, "worker-b", T2);
    expect(recovered.workerId === "worker-b" && recovered.generation === 4 && recovered.fencingToken === 8, "recovery must advance generation and fence");
    expect(recovered.checkpointRef === "cp-1" && recovered.contextRevalidationRequired === true, "recovery must preserve the checkpoint and demand revalidation");
    expectThrow(() => recoverExpiredAssignment({ ...assignment, checkpointRef: undefined }, "worker-b", T2), /checkpoint/i, "recovery requires a checkpoint");
    expectThrow(() => recoverExpiredAssignment({ ...assignment, evidenceRefs: ["e", "e"] }, "worker-b", T2), /unique evidence/i, "recovery evidence must be unique");
  });
});

suite("deterministic-replay", "Replay reproduces coordination decisions exactly", (check) => {
  check("a valid replay log reproduces the recorded choices", () => {
    const log = [
      { sequence: 1, kind: "scheduler", inputHash: "in-1", outputHash: "out-1", chosenValue: "worker-a" },
      { sequence: 2, kind: "retry", inputHash: "in-2", outputHash: "out-2", chosenValue: "block" },
      { sequence: 3, kind: "failover", inputHash: "in-3", outputHash: "out-3", chosenValue: "lead-b" }
    ];
    validateReplayLog(log);
    expect(replayChoices(log).join(",") === "worker-a,block,lead-b", "replay must reproduce decisions in order");
    expect(replayChoices(log).join(",") === replayChoices(log).join(","), "replay must be deterministic");
  });
  check("replay rejects gaps, duplicates and non-monotonic sequences", () => {
    expectThrow(() => validateReplayLog([{ sequence: 2, kind: "x", inputHash: "i", outputHash: "o", chosenValue: "v" }]), /sequence/i, "replay must start at sequence 1");
    expectThrow(() => validateReplayLog([{ sequence: 1, kind: "x", inputHash: "i", outputHash: "o", chosenValue: "v" }, { sequence: 1, kind: "y", inputHash: "i", outputHash: "o", chosenValue: "v" }]), /sequence|duplicate|monotonic/i, "duplicate sequences must be rejected");
    expectThrow(() => validateReplayLog([{ sequence: 1, kind: "x", inputHash: "", outputHash: "o", chosenValue: "v" }]), /./, "empty hashes must be rejected");
  });
});

suite("canary-rollback", "Canary evaluation blocks regressions before broad promotion", (check) => {
  check("a healthier candidate promotes and a regressed candidate does not", () => {
    const stable = { successRate: 0.98, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 };
    expect(evaluateCanary(stable, { ...stable, successRate: 0.99 }).promote === true, "improved candidate must promote");
    expect(evaluateCanary(stable, { ...stable, successRate: 0.9 }).promote === false, "success regression must block promotion");
    expect(evaluateCanary(stable, { ...stable, protectedBoundaryViolationCount: 1 }).promote === false, "protected-boundary violation must block promotion");
    expect(evaluateCanary(stable, { ...stable, duplicateSideEffectCount: 1 }).promote === false, "duplicate side effects must block promotion");
    expect(evaluateCanary(stable, { ...stable, verificationFailureRate: 0.5 }).promote === false, "verification failure regression must block promotion");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.8",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.8",
    headSha,
    inputs: [
      "clean-room/scripts/p15-8-scheduler-failover-replay-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/agency/scheduler.ts",
      "clean-room/src/agency/project-agent.ts",
      "clean-room/src/agency/shift.ts",
      "clean-room/src/agency/recovery.ts",
      "clean-room/src/agency/replay.ts",
      "clean-room/src/agency/rollout.ts",
      "clean-room/src/agency/resilience.ts",
      "clean-room/tests/agency-foundation.test.mjs",
      "clean-room/tests/p15-8-scheduler-failover-replay.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-8-scheduler-failover-replay-audit.mjs",
      "clean-room/tests/p15-8-scheduler-failover-replay.test.mjs",
      "clean-room/tests/agency-foundation.test.mjs",
      "clean-room/tests/category7-recovery-failover.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_8.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_8.json", inputsDigest: receipt.inputsDigest }));
}
console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
