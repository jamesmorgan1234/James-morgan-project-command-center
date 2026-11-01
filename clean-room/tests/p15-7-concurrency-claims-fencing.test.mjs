import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeInputsDigest, validateReceiptBinding } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_7.json";
const auditSource = readFileSync("scripts/p15-7-concurrency-claims-fencing-audit.mjs", "utf8");
const audit = spawnSync(process.execPath, ["scripts/p15-7-concurrency-claims-fencing-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.7 concurrency, claims, fencing and conflict acceptance passes against the compiled Agency", () => {
  assert.equal(audit.status, 0, `audit reported failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.7");
  assert.equal(summary.failedSuiteCount, 0);
  assert.ok(summary.suiteCount >= 6, `expected at least 6 suites, got ${summary.suiteCount}`);
  assert.ok(summary.checkCount >= 18, `expected at least 18 checks, got ${summary.checkCount}`);
  assert.ok(summary.contentionCycles >= 200, "the audit must exercise repeated contention");
  for (const entry of summary.suites) assert.equal(entry.checks.filter((check) => !check.passed).length, 0, `${entry.id} has failed checks`);
  const ids = summary.suites.map((entry) => entry.id);
  for (const required of ["atomic-claims-and-parallelism", "fencing-and-stale-commits", "lease-expiry-and-resource-recovery", "resource-serialization-and-lock-conflicts", "duplicate-jobs-and-idempotency", "conflict-arbitration-and-verifier-independence"]) assert.ok(ids.includes(required), `missing suite ${required}`);
});

test("P15.7 audit exercises the real claim, resource, dispatch and arbitration modules", () => {
  for (const behaviour of ["TaskClaimStore", "ResourceClaimManager", "DispatchQueue", "RunCoordinator", "arbitrateIntegration", "validateIndependentVerification", "recoverExpiredResourceClaims", "acquireProjectLock"]) assert.ok(auditSource.includes(behaviour), `audit must exercise ${behaviour}`);
  assert.ok(existsSync(resolve(repoRoot, "clean-room/tests/agency-foundation.test.mjs")), "agency foundation test must remain");
});

test("P15.7 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.7 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.7");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of ["clean-room/src/agency/leases.ts", "clean-room/src/agency/resources.ts", "clean-room/src/agency/dispatch.ts", "clean-room/src/agency/integration.ts", "clean-room/scripts/p15-7-concurrency-claims-fencing-audit.mjs"]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
  assert.equal(receipt.summary.failedSuiteCount, 0);
});

test("P15.7 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
});
