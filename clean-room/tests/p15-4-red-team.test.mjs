import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateReceiptBinding, computeInputsDigest } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_4.json";
const auditSource = readFileSync("scripts/p15-4-red-team-audit.mjs", "utf8");

const audit = spawnSync(process.execPath, ["scripts/p15-4-red-team-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.4 red team leaves no unresolved critical or high boundary failure", () => {
  assert.equal(audit.status, 0, `red team found failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.4");
  assert.equal(summary.failedSuiteCount, 0);
  assert.equal(summary.criticalFailureCount, 0);
  assert.ok(summary.suiteCount >= 7, `expected at least 7 attack suites, got ${summary.suiteCount}`);
  assert.ok(summary.checkCount >= 28, `expected at least 28 adversarial checks, got ${summary.checkCount}`);
  for (const suite of summary.suites) {
    assert.equal(suite.passed, true, `${suite.id} must pass`);
    assert.equal(suite.failed.length, 0, `${suite.id} has unresolved findings`);
    assert.ok(["critical", "high", "medium"].includes(suite.severity), `unexpected severity ${suite.severity}`);
  }
  const ids = summary.suites.map((suite) => suite.id);
  for (const required of [
    "session-identity-and-staleness",
    "protected-action-bypass",
    "cross-project-company-isolation",
    "cross-brain-transfer",
    "privacy-and-data-minimisation",
    "leak-prevention",
    "replay-and-uncertain-side-effects"
  ]) assert.ok(ids.includes(required), `missing attack suite ${required}`);
});

test("P15.4 red team exercises real compiled security modules", () => {
  for (const specifier of ["../dist/security/index.js", "../dist/data/index.js"]) {
    assert.ok(auditSource.includes(specifier), `red team must load ${specifier}`);
  }
  for (const behaviour of ["ProtectedActionGate", "AuthSessionStore", "evaluateDataBoundary", "createIntentBinding", "projectForSurface", "assertShareLinkActive", "validateLearningPacket"]) {
    assert.ok(auditSource.includes(behaviour), `red team must exercise ${behaviour}`);
  }
});

test("P15.4 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.4 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.4");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of [
    "clean-room/src/security/protected-gate.ts",
    "clean-room/src/security/data-sensitivity.ts",
    "clean-room/src/security/boundaries.ts",
    "clean-room/scripts/p15-4-red-team-audit.mjs"
  ]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
});

test("P15.4 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [...receipt.inputs, "clean-room/package.json"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, phaseId: "P15.3" }, { repoRoot, headSha }), true, "phase identity is enforced by the gate, not the binding helper");
});
