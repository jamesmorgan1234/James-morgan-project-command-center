import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

test("Task 3 integrity: the final nonproduction Category 15 gate is mandatory and cannot be softened", () => {
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

test("Task 3 integrity: audit:category15 always requires nonproduction closure", () => {
  const command = pkg.scripts?.["audit:category15"];
  assert.equal(typeof command, "string");
  assert.match(command, /category15-phase-gate-audit\.mjs/);
  assert.match(command, /--require-nonproduction/);
  assert.match(command, /--verified-by-prior-gates/);
  assert.doesNotMatch(command, /\|\|\s*true/);
});

test("Task 3 integrity: P15.1 cannot become VERIFIED_COMPLETE without strict traceability closure", () => {
  assert.match(
    gate,
    /phases\["P15\.1"\]\s*=\s*canonicalRequirementAuthoritySatisfied\s*&&\s*requirementTraceabilityClosureComplete/
  );
  assert.match(gate, /requirementTraceabilityValid\s*=\s*requirementTraceabilityClosureComplete/);
  assert.match(gate, /value\.status\s*!==\s*"VERIFIED_COMPLETE"/);
});

test("Task 3 integrity: any open P15.1-P15.14 phase makes the required nonproduction audit exit nonzero", () => {
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
