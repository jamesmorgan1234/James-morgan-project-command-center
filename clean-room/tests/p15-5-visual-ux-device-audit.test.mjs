import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeInputsDigest, validateReceiptBinding } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_5.json";
const auditSource = readFileSync("scripts/p15-5-visual-ux-device-audit.mjs", "utf8");

const audit = spawnSync(process.execPath, ["scripts/p15-5-visual-ux-device-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.5 visual, UX, accessibility and device audit passes against the compiled implementation", () => {
  assert.equal(audit.status, 0, `audit reported failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.5");
  assert.equal(summary.failedSuiteCount, 0);
  assert.ok(summary.suiteCount >= 8, `expected at least 8 suites, got ${summary.suiteCount}`);
  assert.ok(summary.checkCount >= 30, `expected at least 30 checks, got ${summary.checkCount}`);
  assert.equal(summary.approvedScreenCount, 4);
  assert.equal(summary.coreRouteCount, 19);
  assert.equal(summary.requiredStateCount, 9);
  for (const entry of summary.suites) {
    assert.equal(entry.passed, true, `${entry.id} must pass`);
    assert.equal(entry.checks.filter((check) => !check.passed).length, 0, `${entry.id} has failed checks`);
  }
  const ids = summary.suites.map((entry) => entry.id);
  for (const required of [
    "approved-screen-authority",
    "unseen-screen-derivation",
    "required-routes-and-navigation",
    "interactions-back-and-scroll",
    "loading-empty-error-and-degraded-states",
    "accessibility",
    "responsive-geometry-and-target-devices",
    "runtime-assembly-and-no-legacy-drift"
  ]) assert.ok(ids.includes(required), `missing suite ${required}`);
});

test("P15.5 audit exercises the real UI and runtime modules rather than filenames", () => {
  for (const specifier of ["../dist/ui/index.js", "../dist/runtime/route-state.js"]) assert.ok(auditSource.includes(specifier), `audit must load ${specifier}`);
  for (const behaviour of ["APPROVED_VISUAL_REFERENCES", "UNSEEN_SCREEN_DERIVATION_RULE", "resolveBrowserRoute", "NavigationCoordinator", "assertAccessibleControl", "classifyLayout", "COMMAND_CENTER_OFFLINE_POLICY"]) {
    assert.ok(auditSource.includes(behaviour), `audit must exercise ${behaviour}`);
  }
  for (const source of ["clean-room/src/runtime/browser.ts", "clean-room/public/app.css", "clean-room/public/project-system.css"]) assert.ok(auditSource.includes(source), `audit must inspect ${source}`);
  for (const requiredTest of ["clean-room/tests/ui-shell-foundation.test.mjs", "clean-room/tests/runtime-visual-structure.test.mjs", "clean-room/tests/route-state-closure.test.mjs"]) {
    assert.ok(existsSync(resolve(repoRoot, requiredTest)), `${requiredTest} must remain the phase foundation artifact`);
  }
});

test("P15.5 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.5 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.5");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of [
    "clean-room/scripts/p15-5-visual-ux-device-audit.mjs",
    "clean-room/src/ui/visual-references.ts",
    "clean-room/src/ui/accessibility.ts",
    "clean-room/src/runtime/route-state.ts",
    "clean-room/src/runtime/browser.ts",
    "clean-room/tests/ui-shell-foundation.test.mjs"
  ]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
  assert.ok(receipt.summary.failedSuiteCount === 0, "receipt summary must record no failed suite");
});

test("P15.5 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [...receipt.inputs, "clean-room/package.json"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: ["clean-room/../app.js"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
});
