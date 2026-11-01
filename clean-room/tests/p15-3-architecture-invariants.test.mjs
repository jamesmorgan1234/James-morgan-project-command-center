import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateReceiptBinding, computeInputsDigest } from "../scripts/phase-receipt-binding.mjs";

const repoRoot = resolve(process.cwd(), "..");
const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const receiptPath = "clean-room/evidence/phase-receipts/P15_3.json";
const auditSource = readFileSync("scripts/p15-3-architecture-invariants-audit.mjs", "utf8");
const phaseGateSource = readFileSync("scripts/category15-phase-gate-audit.mjs", "utf8");

const audit = spawnSync(process.execPath, ["scripts/p15-3-architecture-invariants-audit.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.3 architecture invariants all pass against the compiled implementation", () => {
  assert.equal(audit.status, 0, `audit reported failures:\n${audit.stderr || audit.stdout}`);
  const summary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.3");
  assert.equal(summary.failedInvariantCount, 0);
  assert.ok(summary.invariantCount >= 9, `expected at least 9 invariants, got ${summary.invariantCount}`);
  assert.ok(summary.checkCount >= 30, `expected at least 30 checks, got ${summary.checkCount}`);
  assert.ok(summary.sourceFileCount > 300, "the audit must inspect the whole active source tree");
  assert.ok(summary.importEdgeCount > 0, "the audit must build the real module graph");
  for (const invariant of summary.invariants) {
    assert.equal(invariant.passed, true, `${invariant.id} must pass`);
    assert.equal(invariant.failed.length, 0, `${invariant.id} has failed checks`);
  }
  const ids = summary.invariants.map((invariant) => invariant.id);
  for (const required of [
    "single-owner-responsibilities",
    "command-center-control-plane",
    "authority-narrows-never-expands",
    "canonical-registries",
    "no-duplicate-control-plane-and-acyclic-dependencies",
    "registration-only-extension",
    "learning-cannot-become-global-truth",
    "self-improvement-cannot-mutate-authority",
    "evidence-and-provenance-controls"
  ]) assert.ok(ids.includes(required), `missing invariant ${required}`);
});

test("P15.3 audit exercises real compiled modules rather than roadmap prose", () => {
  for (const specifier of ["../dist/kernel/index.js", "../dist/agency/index.js", "../dist/brain/index.js", "../dist/data/index.js"]) {
    assert.ok(auditSource.includes(specifier), `audit must load ${specifier}`);
  }
  for (const behaviour of ["validateDelegatedAuthority", "validateSpecialistProjection", "LearningPromotionGovernor", "SelfImprovementGovernor", "assertProtectedPreflight", "createCoreArchitectureResponsibilityRegistry"]) {
    assert.ok(auditSource.includes(behaviour), `audit must exercise ${behaviour}`);
  }
  assert.match(phaseGateSource, /validateReceiptBinding\(candidate, \{ repoRoot, headSha \}\)/);
});

test("P15.3 receipt is bound to its exact audited source inputs", () => {
  assert.ok(existsSync(resolve(repoRoot, receiptPath)), "P15.3 phase receipt must be committed");
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(receipt.phaseId, "P15.3");
  assert.equal(receipt.status, "VERIFIED_COMPLETE");
  assert.equal(receipt.inputsDigest, computeInputsDigest(repoRoot, receipt.inputs));
  assert.equal(validateReceiptBinding(receipt, { repoRoot, headSha }), true);
  for (const required of [
    "clean-room/src/kernel/architecture-contract.ts",
    "clean-room/src/agency/delegation.ts",
    "clean-room/src/brain/specialists.ts",
    "clean-room/src/data/learning.ts",
    "clean-room/scripts/p15-3-architecture-invariants-audit.mjs"
  ]) assert.ok(receipt.inputs.includes(required), `receipt must bind ${required}`);
});

test("P15.3 receipt binding fails closed on stale or fabricated evidence", () => {
  const receipt = JSON.parse(readFileSync(resolve(repoRoot, receiptPath), "utf8"));
  assert.equal(validateReceiptBinding({ ...receipt, inputsDigest: "f".repeat(64) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: receipt.inputs.slice(1) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [...receipt.inputs, "clean-room/package.json"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, gitSha: "a".repeat(40) }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: [] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, inputs: ["clean-room/../app.js"] }, { repoRoot, headSha }), false);
  assert.equal(validateReceiptBinding({ ...receipt, status: "PARTIAL" }, { repoRoot, headSha }), false);
});
