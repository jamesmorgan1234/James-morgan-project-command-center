import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeInputsDigest, validateReceiptBinding } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_12.json";
const auditSource = readFileSync("scripts/p15-12-performance-load-soak-audit.mjs", "utf8");
const audit = spawnSync(process.execPath, ["scripts/p15-12-performance-load-soak-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 240_000 });

test("P15.12 performance, load, soak and scale acceptance passes", () => {
  assert.equal(audit.status, 0, `audit reported failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.12");
  assert.equal(summary.failedSuiteCount, 0);
  assert.ok(summary.suiteCount >= 5, `expected at least 5 suites, got ${summary.suiteCount}`);
  assert.ok(summary.checkCount >= 12, `expected at least 12 checks, got ${summary.checkCount}`);
  assert.ok(summary.workload.capacityCycles >= 50000, "saturation soak must cover sustained load");
  assert.ok(summary.workload.taskCount >= 10000, "scale soak must cover many tasks");
  assert.ok(summary.workload.claimCycles >= 2000, "contention soak must cover repeated claims");
  assert.ok(summary.workload.failoverCycles >= 500, "failover soak must cover repeated leadership");
  for (const entry of summary.suites) assert.equal(entry.checks.filter((check) => !check.passed).length, 0, `${entry.id} has failed checks`);
  const ids = summary.suites.map((entry) => entry.id);
  for (const required of ["sustained-saturation-soak", "many-task-dependency-scheduling", "concurrent-claim-soak", "bounded-concurrency-and-backpressure", "failover-under-load", "learning-governance-fail-closed"]) assert.ok(ids.includes(required), `missing suite ${required}`);
});

test("P15.12 audit exercises real scale, backpressure, budget and learning modules", () => {
  for (const behaviour of ["capacityDecision", "readyTasks", "TaskClaimStore", "SchedulerControlPlane", "assertBackpressure", "assertBudget", "LearningPromotionGovernor"]) assert.ok(auditSource.includes(behaviour), `audit must exercise ${behaviour}`);
  for (const requiredTest of ["clean-room/tests/category15-performance-load-soak.test.mjs", "clean-room/tests/p14-6-capacity-under-load.test.mjs"]) assert.ok(existsSync(resolve(repoRoot, requiredTest)), `${requiredTest} must remain`);
});

test("P15.12 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.12 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.12");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of ["clean-room/src/perf/budgets.ts", "clean-room/src/recovery/scale.ts", "clean-room/src/data/learning.ts", "clean-room/scripts/p15-12-performance-load-soak-audit.mjs"]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
  assert.equal(receipt.summary.failedSuiteCount, 0);
});

test("P15.12 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
});
