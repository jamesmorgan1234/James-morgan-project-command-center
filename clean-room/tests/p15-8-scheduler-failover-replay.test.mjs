import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeInputsDigest, validateReceiptBinding } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_8.json";
const auditSource = readFileSync("scripts/p15-8-scheduler-failover-replay-audit.mjs", "utf8");
const audit = spawnSync(process.execPath, ["scripts/p15-8-scheduler-failover-replay-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.8 scheduler, worker, lead failover and replay acceptance passes against the compiled Agency", () => {
  assert.equal(audit.status, 0, `audit reported failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.8");
  assert.equal(summary.failedSuiteCount, 0);
  assert.ok(summary.suiteCount >= 6, `expected at least 6 suites, got ${summary.suiteCount}`);
  assert.ok(summary.checkCount >= 13, `expected at least 13 checks, got ${summary.checkCount}`);
  for (const entry of summary.suites) assert.equal(entry.checks.filter((check) => !check.passed).length, 0, `${entry.id} has failed checks`);
  const ids = summary.suites.map((entry) => entry.id);
  for (const required of ["scheduler-leadership-and-fencing", "worker-crash-and-project-agent-persistence", "shift-incidents-and-owner-boundaries", "lead-failover", "deterministic-replay", "canary-rollback"]) assert.ok(ids.includes(required), `missing suite ${required}`);
});

test("P15.8 audit exercises the real scheduler, agent, shift, replay and rollout modules", () => {
  for (const behaviour of ["SchedulerControlPlane", "ProjectAgentRegistry", "ProjectAgentStore", "inspectShiftManager", "recoverExpiredAssignment", "validateReplayLog", "evaluateCanary", "validateLeadFailover"]) assert.ok(auditSource.includes(behaviour), `audit must exercise ${behaviour}`);
  assert.ok(existsSync(resolve(repoRoot, "clean-room/tests/agency-foundation.test.mjs")), "agency foundation test must remain");
});

test("P15.8 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.8 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.8");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of ["clean-room/src/agency/scheduler.ts", "clean-room/src/agency/project-agent.ts", "clean-room/src/agency/shift.ts", "clean-room/src/agency/replay.ts", "clean-room/scripts/p15-8-scheduler-failover-replay-audit.mjs"]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
  assert.equal(receipt.summary.failedSuiteCount, 0);
});

test("P15.8 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
});
