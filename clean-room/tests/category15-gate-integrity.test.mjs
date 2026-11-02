import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const workflow = readFileSync("../.github/workflows/spec-lock-v2-clean-room-qa.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const gate = readFileSync("scripts/category15-phase-gate-audit.mjs", "utf8");

function workflowStep(name, nextName) {
  const start = workflow.indexOf(`- name: ${name}`);
  assert.notEqual(start, -1, `workflow step missing: ${name}`);
  const end = nextName ? workflow.indexOf(`- name: ${nextName}`, start + 1) : workflow.length;
  assert.notEqual(end, -1, `workflow boundary step missing: ${nextName}`);
  return workflow.slice(start, end);
}

test("Task 4 integrity: the final nonproduction Category 15 gate is mandatory and cannot be softened", () => {
  const step = workflowStep(
    "Final Category 15 nonproduction phase gate",
    "P15.16 production live evidence gate"
  );

  assert.match(step, /run:\s*npm run audit:category15/);
  assert.doesNotMatch(step, /continue-on-error:\s*true/);
  assert.doesNotMatch(step, /if:\s*always\(\)/);
  assert.doesNotMatch(step, /\|\|\s*true/);
  assert.doesNotMatch(step, /\|\|\s*:/);
});

test("Task 4 integrity: audit:category15 always requires nonproduction closure", () => {
  const command = pkg.scripts?.["audit:category15"];
  assert.equal(typeof command, "string");
  assert.match(command, /category15-phase-gate-audit\.mjs/);
  assert.match(command, /--require-nonproduction/);
  assert.match(command, /--verified-by-prior-gates/);
  assert.doesNotMatch(command, /\|\|\s*true/);
});

test("Task 4 integrity: P15.1 cannot become VERIFIED_COMPLETE without strict traceability closure", () => {
  assert.match(
    gate,
    /phases\["P15\.1"\]\s*=\s*canonicalRequirementAuthoritySatisfied\s*&&\s*requirementTraceabilityClosureComplete/
  );
  assert.match(gate, /requirementTraceabilityValid\s*=\s*requirementTraceabilityClosureComplete/);
  assert.match(gate, /value\.status\s*!==\s*"VERIFIED_COMPLETE"/);
});

test("Task 4 integrity: any open P15.1-P15.14 phase makes the required nonproduction audit exit nonzero", () => {
  assert.match(
    gate,
    /const nonproductionFailures\s*=\s*Object\.entries\(phases\)[\s\S]*?n\s*>=\s*1\s*&&\s*n\s*<=\s*14[\s\S]*?value\.status\s*!==\s*"VERIFIED_COMPLETE"/
  );
  assert.match(
    gate,
    /requireNonproduction\s*&&\s*nonproductionFailures\.length\)\)\s*process\.exit\(1\)/
  );
  assert.doesNotMatch(gate, /process\.exit\(0\)/);
});

function runGate() {
  const result = spawnSync(
    process.execPath,
    ["scripts/category15-phase-gate-audit.mjs", "--require-nonproduction"],
    { cwd: process.cwd(), encoding: "utf8" }
  );
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  assert.ok(lines.length > 0, `Category 15 gate emitted no machine-readable summary. stderr=${result.stderr}`);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, summary: JSON.parse(lines.at(-1)) };
}

test("Task 4 integrity: a missing phase receipt still makes the required nonproduction audit exit nonzero", () => {
  // Removing a receipt must reopen that phase. The test proves the gate is not
  // trivially green now that every P15.1-P15.14 phase legitimately closes.
  const receipt = "evidence/phase-receipts/P15_12.json";
  const parked = `${receipt}.integrity-parked`;
  renameSync(receipt, parked);
  let result;
  try {
    result = runGate();
  } finally {
    renameSync(parked, receipt);
  }

  assert.notEqual(result.status, 0, `Category 15 gate passed with P15.12 unbound. stdout=${result.stdout}`);
  assert.ok(result.summary.p15_1_through_14_unverified_count > 0, "Category 15 reports no open phase after removing a receipt");
  assert.notEqual(result.summary.p15_1_through_14_unverified_count, undefined);
});

test("Task 4 integrity: only recorded exact-candidate owner authorization opens P15.15, never automation", () => {
  const authorization = "evidence/CURRENT_PRODUCTION_AUTHORIZATION.json";
  const parked = `${authorization}.integrity-parked`;
  renameSync(authorization, parked);
  let withoutAuthorization;
  try {
    withoutAuthorization = runGate();
  } finally {
    renameSync(parked, authorization);
  }

  assert.equal(withoutAuthorization.summary.p15_15, "BLOCKED_OWNER_AUTHORIZATION", "P15.15 must never be self-certified by automation when no owner authorization is recorded");
  assert.equal(withoutAuthorization.summary.p15_16, "BLOCKED_DEPENDENCY", "P15.16 must stay dependent on real owner authorization");

  const { status, summary } = runGate();
  assert.equal(summary.p15_15, "VERIFIED_COMPLETE", "a recorded exact-candidate owner authorization must be reflected by the gate");
  assert.notEqual(summary.p15_16, "VERIFIED_COMPLETE", "P15.16 live verification must not be certified by the phase gate");
  // The gate must be green exactly when no P15.1-P15.14 phase is open, and red
  // otherwise. This keeps the invariant stable while P15.1 requalification is
  // pending after any bound evidence input changes.
  assert.equal(
    status === 0,
    summary.p15_1_through_14_unverified_count === 0,
    `gate exit ${status} is inconsistent with ${summary.p15_1_through_14_unverified_count} open phase(s)`
  );
});
