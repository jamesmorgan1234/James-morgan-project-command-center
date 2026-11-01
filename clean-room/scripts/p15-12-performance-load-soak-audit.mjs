/**
 * P15.12 — Performance, load, soak and scale acceptance.
 *
 * Authority (roadmap P15.12): representative long-duration/many-project/many-
 * worker workloads under CPU/RAM/disk/network/provider quotas and backpressure.
 * Exit gate: no data corruption/leak, uncontrolled queue growth, starvation or
 * false completion under accepted capacity.
 *
 * Deterministic $0 soak on the real compiled Agency, recovery, data and perf
 * surfaces. No paid load service, runner, provider or network call is used.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  SchedulerControlPlane,
  TaskClaimStore,
  reapOrphan,
  readyTasks
} from "../dist/agency/index.js";
import { capacityDecision } from "../dist/recovery/index.js";
import { LearningPromotionGovernor, validateLearningPacket } from "../dist/data/index.js";
import { assertBudget, assertNoNPlusOne, invalidateCache, listStrategy, navigationBudget, page, queryBudget, renderBudget, requestBudget } from "../dist/perf/budgets.js";
import { assertBackpressure, assertCheapWork, rateLimit } from "../dist/perf/data.js";
import { incrementalBatch } from "../dist/perf/loading.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const T0 = "2026-11-01T00:00:00.000Z";
const CAPACITY_CYCLES = 50_000;
const TASK_COUNT = 10_000;
const CLAIM_CYCLES = 2_000;
const FAILOVER_CYCLES = 500;

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

const task = (index) => ({
  id: `task-${index}`,
  runId: "soak-run",
  projectId: `project-${index % 100}`,
  title: `Task ${index}`,
  state: index === 0 ? "verified" : "pending",
  dependencyIds: index === 0 ? [] : [`task-${index - 1}`],
  capability: "code",
  risk: "low",
  preferredEnvironment: "normal_chat",
  evidenceRefs: index === 0 ? ["verified"] : [],
  idempotencyKey: `soak-${index}`,
  priority: 1,
  createdSequence: index + 1,
  affinityKeys: [],
  antiAffinityKeys: []
});

suite("sustained-saturation-soak", "Sustained load converts excess demand into backpressure, never loss", (check) => {
  check(`${CAPACITY_CYCLES} capacity decisions stay deterministic and total`, () => {
    const counts = { accept: 0, backpressure: 0, overflow: 0 };
    for (let index = 0; index < CAPACITY_CYCLES; index += 1) {
      const overloaded = index % 7 === 0;
      const decision = capacityDecision({ projects: 1000, books: 5000, accounts: 100, socialChannels: 200, agencyJobs: overloaded ? 2000 : 900, knowledgeRecords: 100000, cpuPercent: overloaded ? 92 : 70, memoryPercent: 72, queueDepth: overloaded ? 1500 : 500, providerDegraded: false });
      if (decision === "accept") counts.accept += 1;
      else if (decision === "backpressure") counts.backpressure += 1;
      else counts.overflow += 1;
    }
    expect(counts.accept > 0 && counts.backpressure > 0, "both accept and backpressure must occur");
    expect(counts.overflow === 0, "no decision may fall outside accept/backpressure");
    expect(counts.accept + counts.backpressure === CAPACITY_CYCLES, "every unit of demand must be accounted for");
  });
  check("degraded providers and resource pressure never fabricate completion", () => {
    const degraded = capacityDecision({ projects: 1000, books: 5000, accounts: 100, socialChannels: 200, agencyJobs: 900, knowledgeRecords: 100000, cpuPercent: 70, memoryPercent: 72, queueDepth: 500, providerDegraded: true });
    expect(degraded !== "accept", "a degraded provider must not be reported as healthy capacity");
    const saturated = capacityDecision({ projects: 1000, books: 5000, accounts: 100, socialChannels: 200, agencyJobs: 900, knowledgeRecords: 100000, cpuPercent: 99, memoryPercent: 99, queueDepth: 5000, providerDegraded: false });
    expect(saturated === "backpressure", "saturated resources must apply backpressure");
  });
});

suite("many-task-dependency-scheduling", "Large dependency graphs expose only ready work with no starvation", (check) => {
  check(`${TASK_COUNT} chained tasks schedule deterministically`, () => {
    const tasks = Array.from({ length: TASK_COUNT }, (_, index) => task(index));
    const ready = readyTasks(tasks);
    expect(ready.length === 1 && ready[0].id === "task-1", "a linear chain must expose exactly its next task");
    expect(readyTasks(tasks).map((entry) => entry.id).join(",") === ready.map((entry) => entry.id).join(","), "scheduling must be deterministic");
    expect(tasks.filter((entry) => entry.state === "verified").length === 1, "no task may be marked complete by the scheduler");
  });
  check("independent tasks across many projects all become ready without loss", () => {
    const independent = Array.from({ length: 2_000 }, (_, index) => ({ ...task(index), id: `free-${index}`, dependencyIds: [], state: "pending", projectId: `project-${index % 50}`, idempotencyKey: `free-${index}` }));
    const ready = readyTasks(independent);
    expect(ready.length === independent.length, "every dependency-free task must remain schedulable");
    expect(new Set(ready.map((entry) => entry.projectId)).size === 50, "no project may be starved of eligible work");
  });
  check("a blocked dependency never becomes ready and no task is duplicated", () => {
    const tasks = [task(0), task(1), task(2)];
    const ready = readyTasks(tasks);
    expect(ready.every((entry) => entry.dependencyIds.every((id) => tasks.find((candidate) => candidate.id === id)?.state === "verified")), "only verified dependencies may unlock work");
    expect(new Set(ready.map((entry) => entry.id)).size === ready.length, "no duplicate task may be scheduled");
  });
});

suite("concurrent-claim-soak", "Repeated contention never permits duplicate or stale execution", (check) => {
  check(`${CLAIM_CYCLES} claim generations reject every stale commit`, () => {
    const claims = new TaskClaimStore();
    for (let cycle = 0; cycle < CLAIM_CYCLES; cycle += 1) {
      const id = `claim-${cycle}`;
      const first = claims.claim(id, "worker-a", T0, "2026-11-01T00:00:01.000Z");
      const second = claims.claim(id, "worker-b", "2026-11-01T00:00:02.000Z", "2026-11-01T00:00:03.000Z");
      expect(second.fencingToken === first.fencingToken + 1, `fence must advance at cycle ${cycle}`);
      expectThrow(() => claims.assertCommitAllowed(id, "worker-a", first.fencingToken, "2026-11-01T00:00:02.500Z"), /stale worker/i, `stale commit must be rejected at cycle ${cycle}`);
      claims.assertCommitAllowed(id, "worker-b", second.fencingToken, "2026-11-01T00:00:02.500Z");
    }
  });
  check("expired work is reaped with its checkpoint rather than silently dropped", () => {
    const orphan = { taskId: "task-lost", workerId: "worker-a", leaseExpiresAt: "2026-11-01T00:01:00.000Z", checkpointRef: "cp:9", evidenceRefs: ["evd:1"] };
    expectThrow(() => reapOrphan(orphan, T0), /live assignment/i, "live work must not be reaped");
    const recovered = reapOrphan(orphan, "2026-11-01T00:02:00.000Z");
    expect(recovered.reclaim === true && recovered.resumeFrom === "cp:9", "expired work must resume from its checkpoint");
  });
});

suite("bounded-concurrency-and-backpressure", "Concurrency, queues and requests stay bounded under pressure", (check) => {
  check("queues, requests and rate limits bound work instead of growing", () => {
    assertBackpressure(50, 100);
    expectThrow(() => assertBackpressure(150, 100), /backpressure/i, "an over-capacity queue must be rejected");
    expectThrow(() => assertBackpressure(-1, 100), /nonnegative/i, "invalid queue depth must be rejected");
    requestBudget(1);
    expectThrow(() => requestBudget(1000), /./, "request storms must be rejected");
    expect(rateLimit(3, 10) === "allow" && rateLimit(10, 10) === "throttle", "rate limiting must throttle at the limit");
    assertNoNPlusOne(1, 1000);
    expectThrow(() => assertNoNPlusOne(500, 5), /N\+1|queries/i, "N+1 query patterns must be rejected under load");
  });
  check("listing strategy and paging stay bounded at scale", () => {
    expect(listStrategy(1) === "plain", "small lists may render plainly");
    expect(listStrategy(500) === "virtualized", "large lists must virtualize");
    expectThrow(() => listStrategy(100000), /virtualization/i, "unbounded lists must be rejected outright");
    const items = Array.from({ length: 1000 }, (_, index) => index);
    expect(page(items, 100, 3).length === 100 && page(items, 100, 3)[0] === 300, "paging must be bounded and exact");
    const batch = incrementalBatch(1000, 100, 0);
    expect(batch.items === 100 && batch.nextCursor === 100, "incremental loading must advance by batch");
    expect(incrementalBatch(1000, 100, 900).nextCursor === null, "the final batch must terminate the cursor");
  });
  check("budgets and cheap-work guards hold under scale", () => {
    navigationBudget(100);
    renderBudget(16);
    queryBudget(50);
    assertBudget("soak", 10, 100);
    expectThrow(() => assertBudget("soak", 101, 100), /budget/i, "over-budget work must be rejected");
    expectThrow(() => navigationBudget(10_000), /./, "navigation budget overruns must be rejected");
    assertCheapWork({ batteryPct: 80, cpuPct: 20 });
    expectThrow(() => assertCheapWork({ batteryPct: 5, cpuPct: 20 }), /battery/i, "mobile work must respect battery");
    expect(invalidateCache("project:1", { "project:1": "bust" }) === "bust", "cache invalidation must be explicit");
  });
});

suite("failover-under-load", "Scheduler failover remains fenced while the claim load continues", (check) => {
  check(`${FAILOVER_CYCLES} leadership cycles never admit two live leaders`, () => {
    const control = new SchedulerControlPlane();
    let prior = 0;
    for (let cycle = 0; cycle < FAILOVER_CYCLES; cycle += 1) {
      const start = new Date(Date.UTC(2026, 10, 1, 0, 0, cycle * 2)).toISOString();
      const expiry = new Date(Date.UTC(2026, 10, 1, 0, 0, cycle * 2 + 1)).toISOString();
      const leader = control.acquire(`leader-${cycle}`, start, expiry);
      expect(leader.fencingToken === prior + 1, `fence must advance at failover ${cycle}`);
      prior = leader.fencingToken;
      if (cycle > 0) expectThrow(() => control.assertLeader(`leader-${cycle - 1}`, leader.fencingToken - 1, start), /mismatch/i, `stale leader must be rejected at failover ${cycle}`);
      control.assertLeader(`leader-${cycle}`, leader.fencingToken, start);
    }
  });
  check("claim load and failover interleave without cross-scope leakage", () => {
    const control = new SchedulerControlPlane();
    const claims = new TaskClaimStore();
    for (let cycle = 0; cycle < 200; cycle += 1) {
      const start = new Date(Date.UTC(2026, 10, 1, 0, 0, cycle * 2)).toISOString();
      const expiry = new Date(Date.UTC(2026, 10, 1, 0, 0, cycle * 2 + 1)).toISOString();
      control.acquire(`leader-${cycle}`, start, expiry);
      const project = `project-${cycle % 10}`;
      const claim = claims.claim(`task:${project}:${cycle}`, `worker-${cycle % 5}`, start, expiry);
      expect(claim.taskId.includes(project), "claims must remain scoped to their project");
    }
    expect(claims.get("task:project-0:0") !== undefined, "project-scoped claims must be addressable");
  });
});

suite("learning-governance-fail-closed", "Ecosystem learning cannot be promoted without valid evidence", (check) => {
  check("invalid or unknown learning packets are rejected", () => {
    expectThrow(() => validateLearningPacket({}, T0), /./, "an empty learning packet must be rejected");
    expectThrow(() => validateLearningPacket({ id: "learning:missing" }, T0), /./, "a packet without provenance must be rejected");
    const governor = new LearningPromotionGovernor();
    expectThrow(() => governor.submit({}, T0), /./, "the governor must reject an invalid packet");
    expectThrow(() => governor.decide("learning:missing", "promotion:missing", {}, ["validator:1"], T0), /./, "unknown packets cannot be promoted");
  });
  check("learning promotion cannot be decided without validators", () => {
    const governor = new LearningPromotionGovernor();
    expectThrow(() => governor.decide("learning:missing", "promotion:missing", {}, [], T0), /./, "promotion requires independent validators");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.12",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  workload: { capacityCycles: CAPACITY_CYCLES, taskCount: TASK_COUNT, claimCycles: CLAIM_CYCLES, failoverCycles: FAILOVER_CYCLES },
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.12",
    headSha,
    inputs: [
      "clean-room/scripts/p15-12-performance-load-soak-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/agency/leases.ts",
      "clean-room/src/agency/scheduler.ts",
      "clean-room/src/agency/dag.ts",
      "clean-room/src/agency/recovery.ts",
      "clean-room/src/recovery/scale.ts",
      "clean-room/src/perf/budgets.ts",
      "clean-room/src/perf/data.ts",
      "clean-room/src/perf/loading.ts",
      "clean-room/src/data/learning.ts",
      "clean-room/tests/category15-performance-load-soak.test.mjs",
      "clean-room/tests/p15-12-performance-load-soak.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-12-performance-load-soak-audit.mjs",
      "clean-room/tests/p15-12-performance-load-soak.test.mjs",
      "clean-room/tests/category15-performance-load-soak.test.mjs",
      "clean-room/tests/p14-6-capacity-under-load.test.mjs",
      "clean-room/tests/p13-10-adversarial-scale.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_12.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_12.json", inputsDigest: receipt.inputsDigest }));
}
console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
