import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeInputsDigest, validateReceiptBinding } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_6.json";
const auditSource = readFileSync("scripts/p15-6-historical-recovery-audit.mjs", "utf8");

const audit = spawnSync(process.execPath, ["scripts/p15-6-historical-recovery-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.6 historical import, lineage, privacy and lost-artifact audit passes against the compiled implementation", () => {
  assert.equal(audit.status, 0, `audit reported failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.6");
  assert.equal(summary.failedSuiteCount, 0);
  assert.ok(summary.suiteCount >= 7, `expected at least 7 suites, got ${summary.suiteCount}`);
  assert.ok(summary.checkCount >= 15, `expected at least 15 checks, got ${summary.checkCount}`);
  assert.deepEqual(summary.requirementIds, ["CCR-05847", "CCR-05848", "CCR-05849", "CCR-05850", "CCR-05851", "CCR-05852"]);
  assert.equal(summary.conversations, 3);
  assert.equal(summary.messageNodes, 7);
  assert.equal(summary.branchPoints, 2);
  assert.equal(summary.containers, 2);
  assert.equal(summary.redactedNodes, 1);
  for (const entry of summary.suites) {
    assert.equal(entry.passed, true, `${entry.id} must pass`);
    assert.equal(entry.checks.filter((check) => !check.passed).length, 0, `${entry.id} has failed checks`);
  }
  const ids = summary.suites.map((entry) => entry.id);
  for (const required of [
    "import-adapter-and-provenance",
    "complete-message-graph",
    "branch-aware-lineage",
    "container-identity-lineage",
    "lost-artifact-original-first",
    "completeness-report-exactness",
    "privacy-exclusion-and-determinism"
  ]) assert.ok(ids.includes(required), `missing suite ${required}`);
});

test("P15.6 audit exercises the real import, lineage, report and lost-artifact modules", () => {
  for (const behaviour of ["stageChatExport", "validateConversationGraph", "buildHistoricalLineageIndex", "auditStagedHistoricalRecovery", "evaluateOriginalFirstRecovery", "validateRecoveryCompletenessReport", "recoveryComplete"]) {
    assert.ok(auditSource.includes(behaviour), `audit must exercise ${behaviour}`);
  }
  assert.ok(auditSource.includes("../dist/data/index.js") && auditSource.includes("../dist/recovery/index.js"), "audit must load the compiled import and recovery surfaces");
  for (const requiredTest of ["clean-room/tests/data-platform-recovery.test.mjs", "clean-room/tests/recovery-scale-foundation.test.mjs"]) {
    assert.ok(existsSync(resolve(repoRoot, requiredTest)), `${requiredTest} must remain the phase foundation artifact`);
  }
});

test("P15.6 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.6 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.6");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of [
    "clean-room/scripts/p15-6-historical-recovery-audit.mjs",
    "clean-room/src/data/historical-export.ts",
    "clean-room/src/data/historical-lineage.ts",
    "clean-room/src/recovery/historical-report.ts",
    "clean-room/src/recovery/lost-artifact.ts",
    "clean-room/tests/data-platform-recovery.test.mjs"
  ]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
  assert.ok(receipt.summary.failedSuiteCount === 0, "receipt summary must record no failed suite");
  assert.deepEqual(receipt.summary.requirementIds, ["CCR-05847", "CCR-05848", "CCR-05849", "CCR-05850", "CCR-05851", "CCR-05852"]);
});

test("P15.6 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [...receipt.inputs, "clean-room/package.json"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: ["clean-room/../app.js"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
});
