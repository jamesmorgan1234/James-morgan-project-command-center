/**
 * P15.7 — Agency concurrency, claims, fencing and conflict acceptance.
 *
 * Authority (roadmap P15.7): same-project parallelism, cross-project shared
 * resources, duplicate jobs, lease expiry, stale commits, lock conflicts, work
 * stealing, deadlock/livelock/priority inversion, arbitration and verifier
 * independence. Exit gate: no stale/duplicate protected mutation; conflicts are
 * detected and arbitrated; eligible concurrency remains productive.
 *
 * Exercised against the real compiled Agency implementation (dist/agency).
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  DispatchQueue,
  ResourceClaimManager,
  RunCoordinator,
  TaskClaimStore,
  acquireProjectLock,
  arbitrateIntegration,
  recoverExpiredResourceClaims,
  renewProjectLock,
  validateIndependentVerification
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
const T4 = "2026-11-01T00:04:00.000Z";
const T5 = "2026-11-01T00:05:00.000Z";

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

suite("atomic-claims-and-parallelism", "Concurrent claims are atomic and same-project parallelism stays productive", (check) => {
  check("a live claim cannot be double-owned by a competing worker", () => {
    const claims = new TaskClaimStore();
    const first = claims.claim("task-a", "worker-1", T0, T2);
    expect(first.fencingToken === 1, "first claim must open the fence at 1");
    expectThrow(() => claims.claim("task-a", "worker-2", T1, T3), /already claimed/i, "live claim must reject a second owner");
    expect(claims.get("task-a").workerId === "worker-1", "ownership must not change on a rejected claim");
  });
  check("independent tasks proceed concurrently without blocking each other", () => {
    const claims = new TaskClaimStore();
    const a = claims.claim("task-a", "worker-1", T0, T2);
    const b = claims.claim("task-b", "worker-2", T0, T2);
    expect(a.taskId !== b.taskId && a.fencingToken === 1 && b.fencingToken === 1, "distinct tasks must have independent fences");
    claims.assertCommitAllowed("task-a", "worker-1", a.fencingToken, T1);
    claims.assertCommitAllowed("task-b", "worker-2", b.fencingToken, T1);
  });
  check("renewal extends only the holder's live lease", () => {
    const claims = new TaskClaimStore();
    const claim = claims.claim("task-a", "worker-1", T0, T1);
    const renewed = claims.renew("task-a", "worker-1", claim.fencingToken, T0, T3);
    expect(renewed.expiresAt === T3, "renewal must extend the lease");
    claims.assertCommitAllowed("task-a", "worker-1", claim.fencingToken, T2);
    expectThrow(() => claims.renew("task-a", "worker-2", claim.fencingToken, T0, T4), /stale worker/i, "a non-holder cannot renew");
    expectThrow(() => claims.renew("task-a", "worker-1", claim.fencingToken, T2, T2), /future/i, "renewal expiry must be in the future");
  });
});

suite("fencing-and-stale-commits", "Fencing prevents stale workers from mutating after losing ownership", (check) => {
  check("an expired claim is re-fenced and the prior generation cannot commit", () => {
    const claims = new TaskClaimStore();
    const first = claims.claim("task-a", "worker-1", T0, T1);
    const second = claims.claim("task-a", "worker-2", T2, T4);
    expect(second.fencingToken === first.fencingToken + 1, "re-claim must advance the fence");
    expectThrow(() => claims.assertCommitAllowed("task-a", "worker-1", first.fencingToken, T2), /stale worker/i, "stale generation must be rejected");
    expectThrow(() => claims.assertCommitAllowed("task-a", "worker-2", first.fencingToken, T2), /stale worker/i, "old token must be rejected even for the new worker");
    claims.assertCommitAllowed("task-a", "worker-2", second.fencingToken, T3);
  });
  check("released claims cannot commit and a later claim re-fences", () => {
    const claims = new TaskClaimStore();
    const claim = claims.claim("task-a", "worker-1", T0, T3);
    claims.release("task-a", "worker-1", claim.fencingToken, T1);
    expectThrow(() => claims.assertCommitAllowed("task-a", "worker-1", claim.fencingToken, T1), /no claim/i, "released claim must not commit");
    expect(claims.claim("task-a", "worker-2", T1, T4).fencingToken === claim.fencingToken + 1, "post-release claim must advance the fence");
  });
  check("fencing holds across repeated contention cycles", () => {
    const claims = new TaskClaimStore();
    let prior = 0;
    for (let cycle = 0; cycle < 200; cycle += 1) {
      const start = new Date(Date.UTC(2026, 10, 1, 0, 0, cycle * 2)).toISOString();
      const expiry = new Date(Date.UTC(2026, 10, 1, 0, 0, cycle * 2 + 1)).toISOString();
      const claim = claims.claim("task-contended", `worker-${cycle}`, start, expiry);
      expect(claim.fencingToken === prior + 1, `fence must advance monotonically at cycle ${cycle}`);
      prior = claim.fencingToken;
      expectThrow(() => claims.assertCommitAllowed("task-contended", `worker-${(cycle + 1) % 200}`, claim.fencingToken, start), /stale worker/i, `foreign worker must be rejected at cycle ${cycle}`);
    }
  });
});

suite("lease-expiry-and-resource-recovery", "Expired leases and resource claims are recovered deterministically", (check) => {
  check("expired claims cannot commit and expired resource claims are released with evidence", () => {
    const claims = new TaskClaimStore();
    const claim = claims.claim("task-a", "worker-1", T0, T1);
    expectThrow(() => claims.assertCommitAllowed("task-a", "worker-1", claim.fencingToken, T1), /expired/i, "expired claim must not commit");
    const live = { claimId: "c-live", ownerKey: "job-live", resourceKey: "repo:a", mode: "exclusive", generation: 1, acquiredAt: T0, expiresAt: T4, evidenceRefs: ["evd:acquire"] };
    const expired = { claimId: "c-expired", ownerKey: "job-stale", resourceKey: "repo:b", mode: "exclusive", generation: 2, acquiredAt: T0, expiresAt: T1, evidenceRefs: ["evd:acquire"] };
    const released = { ...expired, claimId: "c-released", resourceKey: "repo:c", releasedAt: T1 };
    const recovery = recoverExpiredResourceClaims([live, expired, released], T2, ["evd:recovery"]);
    expect(recovery.events.length === 1 && recovery.events[0].claimId === "c-expired", "only the expired live claim may be recovered");
    expect(recovery.events[0].priorOwnerKey === "job-stale" && recovery.events[0].generation === 2, "recovery event must preserve prior ownership and generation");
    expect(recovery.claims.find((entry) => entry.claimId === "c-expired").releasedAt === T2, "recovered claim must be released at recovery time");
    expect(recovery.claims.find((entry) => entry.claimId === "c-live").releasedAt === undefined, "live claims must be untouched");
    expect(recovery.claims.find((entry) => entry.claimId === "c-released").releasedAt === T1, "already released claims must keep their release time");
  });
  check("resource recovery fails closed on missing evidence or invalid claims", () => {
    const base = [{ claimId: "c1", ownerKey: "job", resourceKey: "repo:a", mode: "exclusive", generation: 1, acquiredAt: T0, expiresAt: T1, evidenceRefs: ["evd:acquire"] }];
    expectThrow(() => recoverExpiredResourceClaims(base, T2, []), /evidence/i, "recovery requires evidence");
    expectThrow(() => recoverExpiredResourceClaims(base, T2, ["evd:a", "evd:a"]), /unique/i, "recovery evidence must be unique");
    expectThrow(() => recoverExpiredResourceClaims([{ ...base[0], generation: 0 }], T2, ["evd:a"]), /invalid/i, "invalid generations must be rejected");
    expectThrow(() => recoverExpiredResourceClaims([{ ...base[0], expiresAt: T0 }], T2, ["evd:a"]), /expiry/i, "expiry must follow acquisition");
  });
  check("recovered resources become claimable again", () => {
    const resources = new ResourceClaimManager();
    resources.claim("job-a", [{ resourceKey: "repo:file-a", mode: "exclusive" }]);
    expectThrow(() => resources.claim("job-b", [{ resourceKey: "repo:file-a", mode: "shared" }]), /conflict/i, "exclusive claim must block shared access");
    resources.releaseOwner("job-a");
    resources.claim("job-b", [{ resourceKey: "repo:file-a", mode: "shared" }]);
  });
});

suite("resource-serialization-and-lock-conflicts", "Conflicting writes serialize while shared reads stay parallel", (check) => {
  check("shared claims coexist and exclusive claims serialize", () => {
    const resources = new ResourceClaimManager();
    resources.claim("job-a", [{ resourceKey: "db:table", mode: "shared" }]);
    resources.claim("job-b", [{ resourceKey: "db:table", mode: "shared" }]);
    expectThrow(() => resources.claim("job-c", [{ resourceKey: "db:table", mode: "exclusive" }]), /conflict/i, "exclusive claim must wait for shared claims");
    resources.releaseOwner("job-a");
    resources.releaseOwner("job-b");
    resources.claim("job-c", [{ resourceKey: "db:table", mode: "exclusive" }]);
  });
  check("a claim bundle cannot contain duplicate keys and is ordered deterministically", () => {
    const resources = new ResourceClaimManager();
    expectThrow(() => resources.claim("job", [{ resourceKey: "repo:a", mode: "shared" }, { resourceKey: "repo:a", mode: "shared" }]), /duplicate/i, "duplicate bundle keys must be rejected");
    const claims = resources.claim("job", [{ resourceKey: "repo:z", mode: "shared" }, { resourceKey: "repo:a", mode: "shared" }]);
    expect(claims.map((claim) => claim.resourceKey).join(",") === "repo:a,repo:z", "bundle claims must be acquired in canonical order");
  });
  check("cross-project shared resources serialize without cross-scope mutation", () => {
    const resources = new ResourceClaimManager();
    resources.claim("project:alpha", [{ resourceKey: "provider:shared", mode: "exclusive" }]);
    expectThrow(() => resources.claim("project:beta", [{ resourceKey: "provider:shared", mode: "exclusive" }]), /conflict/i, "another project cannot take the same exclusive resource");
    resources.claim("project:beta", [{ resourceKey: "repo:beta-only", mode: "exclusive" }]);
    resources.releaseOwner("project:alpha");
    resources.claim("project:beta", [{ resourceKey: "provider:shared", mode: "exclusive" }]);
  });
  check("project locks are fenced leases that cannot be stolen while live", () => {
    const locks = new TaskClaimStore();
    const lock = acquireProjectLock(locks, "edge-finder", "worker-1", T0, T2);
    expectThrow(() => acquireProjectLock(locks, "edge-finder", "worker-2", T1, T3), /already claimed/i, "a live project lock cannot be stolen");
    expectThrow(() => renewProjectLock(locks, "edge-finder", "worker-2", lock.fencingToken, T1, T3), /stale worker/i, "a non-holder cannot renew the lock");
    renewProjectLock(locks, "edge-finder", "worker-1", lock.fencingToken, T1, T4);
    expectThrow(() => acquireProjectLock(locks, "   ", "worker-1", T0, T2), /project reference/i, "a lock requires a project reference");
    acquireProjectLock(locks, "other-project", "worker-2", T0, T2);
  });
});

suite("duplicate-jobs-and-idempotency", "Duplicate runs, tasks and equivalent work are deduplicated", (check) => {
  check("run/task/equivalent-work duplicates are reported rather than executed twice", () => {
    const coordinator = new RunCoordinator();
    const base = { id: "cmd-1", kind: "start", runKey: "run:alpha", taskKey: "task:alpha", workFingerprint: "fp-alpha", issuedAt: T0 };
    expect(coordinator.accept(base).disposition === "accepted", "first command must be accepted");
    expect(coordinator.accept({ ...base, id: "cmd-2", issuedAt: T1 }).disposition === "duplicate_run", "same run must be deduplicated");
    expect(coordinator.accept({ ...base, id: "cmd-3", runKey: "run:beta", issuedAt: T2 }).disposition === "duplicate_task", "same task must be deduplicated");
    expect(coordinator.accept({ ...base, id: "cmd-4", runKey: "run:gamma", taskKey: "task:gamma", issuedAt: T3 }).disposition === "equivalent_work", "same work fingerprint must be deduplicated");
    expectThrow(() => coordinator.accept({ ...base }), /already accepted/i, "identical command id must be rejected");
  });
  check("one active run per project and portfolio lane", () => {
    const coordinator = new RunCoordinator();
    coordinator.startRun("alpha", "run:alpha", "lane:1");
    expectThrow(() => coordinator.startRun("alpha", "run:alpha-2"), /already has an active run/i, "a project cannot run two active runs");
    expectThrow(() => coordinator.startRun("beta", "run:beta", "lane:1"), /lane already active/i, "a lane cannot host two active runs");
    coordinator.startRun("beta", "run:beta", "lane:2");
    coordinator.finishRun("alpha", "lane:1");
    coordinator.startRun("gamma", "run:gamma", "lane:1");
  });
  check("commands are ordered by stop, pause, then start and coalesce deterministically", () => {
    const coordinator = new RunCoordinator();
    coordinator.accept({ id: "s1", kind: "start", runKey: "r1", taskKey: "t1", workFingerprint: "f1", issuedAt: T0 });
    coordinator.accept({ id: "p1", kind: "pause", runKey: "r2", taskKey: "t2", workFingerprint: "f2", issuedAt: T1 });
    coordinator.accept({ id: "x1", kind: "stop", runKey: "r3", taskKey: "t3", workFingerprint: "f3", issuedAt: T2 });
    expect(coordinator.next().id === "x1", "stop must outrank pause and start");
    const coalesced = coordinator.coalesce();
    expect(coalesced.filter((command) => command.kind === "start").length === 1, "equivalent pending starts must coalesce to one");
    expect(coalesced.length === 3, "non-start commands must pass through coalescing");
  });
  check("dispatch separates acceptance from execution claim", () => {
    const queue = new DispatchQueue();
    queue.accept({ id: "cmd-low", ownerId: "owner", issuedAt: T0, priority: "low" });
    queue.accept({ id: "cmd-critical", ownerId: "owner", issuedAt: T0, priority: "critical" });
    expectThrow(() => queue.assertExecutionAllowed("cmd-low"), /explicit claim/i, "accepted work must not execute without a claim");
    queue.signal("cmd-critical");
    queue.claim("cmd-critical", "worker-1", T1);
    queue.assertExecutionAllowed("cmd-critical");
    expectThrow(() => queue.claim("cmd-critical", "worker-2", T2), /already claimed/i, "a claimed command cannot be re-claimed");
    expect(queue.pending()[0].commandId === "cmd-critical", "critical priority must order first");
    expectThrow(() => queue.accept({ id: "cmd-low", ownerId: "owner", issuedAt: T3, priority: "low" }), /already accepted/i, "duplicate command ids must be rejected");
    const restored = DispatchQueue.restore(queue.snapshot());
    restored.assertExecutionAllowed("cmd-critical");
  });
});

suite("conflict-arbitration-and-verifier-independence", "Divergent outputs are arbitrated and high-risk work cannot self-certify", (check) => {
  check("overlapping divergent artifacts conflict instead of last-write-wins", () => {
    const divergent = arbitrateIntegration([
      { taskId: "a", artifactKey: "file:x", version: 1, contentHash: "h1", verificationRefs: ["v1"] },
      { taskId: "b", artifactKey: "file:x", version: 1, contentHash: "h2", verificationRefs: ["v2"] }
    ]);
    expect(divergent.conflicts.join(",") === "file:x", "divergent outputs must be reported as a conflict");
    expect(divergent.acceptedTaskIds.length === 0, "no side of a conflict may be auto-accepted");
    const identical = arbitrateIntegration([
      { taskId: "a", artifactKey: "file:y", version: 1, contentHash: "same", verificationRefs: ["v1"] },
      { taskId: "b", artifactKey: "file:y", version: 1, contentHash: "same", verificationRefs: ["v2"] }
    ]);
    expect(identical.conflicts.length === 0 && identical.acceptedTaskIds.length === 2, "identical verified outputs may both be accepted");
    expectThrow(() => arbitrateIntegration([{ taskId: "c", artifactKey: "file:z", version: 1, contentHash: "h", verificationRefs: [] }]), /lacks verification/i, "unverified outputs cannot be integrated");
  });
  check("high and critical risk require an independent verifier", () => {
    expectThrow(() => validateIndependentVerification({ taskId: "t", executorId: "w1", verifierId: "w1", risk: "high", evidenceRefs: ["e"] }), /independent verifier/i, "high risk cannot self-certify");
    expectThrow(() => validateIndependentVerification({ taskId: "t", executorId: "w1", verifierId: "w1", risk: "critical", evidenceRefs: ["e"] }), /independent verifier/i, "critical risk cannot self-certify");
    validateIndependentVerification({ taskId: "t", executorId: "w1", verifierId: "w2", risk: "high", evidenceRefs: ["e"] });
    validateIndependentVerification({ taskId: "t", executorId: "w1", verifierId: "w1", risk: "low", evidenceRefs: ["e"] });
    expectThrow(() => validateIndependentVerification({ taskId: "t", executorId: "w1", verifierId: "w2", risk: "high", evidenceRefs: [] }), /evidence/i, "verification requires evidence");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.7",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  contentionCycles: 200,
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.7",
    headSha,
    inputs: [
      "clean-room/scripts/p15-7-concurrency-claims-fencing-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/agency/leases.ts",
      "clean-room/src/agency/resources.ts",
      "clean-room/src/agency/dispatch.ts",
      "clean-room/src/agency/run-coordination.ts",
      "clean-room/src/agency/integration.ts",
      "clean-room/src/agency/verification.ts",
      "clean-room/src/agency/protected.ts",
      "clean-room/tests/agency-foundation.test.mjs",
      "clean-room/tests/p15-7-concurrency-claims-fencing.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-7-concurrency-claims-fencing-audit.mjs",
      "clean-room/tests/p15-7-concurrency-claims-fencing.test.mjs",
      "clean-room/tests/agency-foundation.test.mjs",
      "clean-room/tests/category7-agency-adversarial.test.mjs",
      "clean-room/tests/category15-performance-load-soak.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_7.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_7.json", inputsDigest: receipt.inputsDigest }));
}
console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
