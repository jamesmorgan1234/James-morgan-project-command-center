/**
 * P15.9 — Foundry conversation-to-execution and live-steering acceptance.
 *
 * Authority (roadmap P15.9): rough idea → Ultimate Spec → roadmap → "go ahead"
 * snapshot → Agency → mid-build steering → evidence → completion. Exit gate: no
 * referent ambiguity/scope drift; steering invalidates only affected work;
 * verified outputs persist.
 *
 * Exercised against the real compiled Foundry and Brain steering implementation.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { advanceFoundry } from "../dist/projects/index.js";
import { applySteering } from "../dist/brain/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

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

const snapshot = (overrides = {}) => ({
  projectId: "edge-finder",
  stage: "idea",
  specVersion: 1,
  requirementRefs: ["CCR-05847", "CCR-05849"],
  decisionRefs: ["decision:foundry"],
  artifactRefs: [],
  ...overrides
});

suite("foundry-stage-progression", "Idea to completion follows the ordered Foundry stages", (check) => {
  check("every stage advances in order and records its evidence", () => {
    let current = snapshot();
    const path = ["research", "ultimate_spec", "architecture", "roadmap", "owner_authorization"];
    for (const stage of path) {
      current = advanceFoundry(current, stage, `evd:${stage}`);
      expect(current.stage === stage, `stage ${stage} must be reached`);
      expect(current.artifactRefs.includes(`evd:${stage}`), `stage ${stage} must record evidence`);
    }
    expect(current.artifactRefs.length === path.length, "each transition must append exactly one evidence reference");
    expect(current.projectId === "edge-finder" && current.requirementRefs.join(",") === "CCR-05847,CCR-05849", "project and requirement referents must not drift");
    expect(current.specVersion === 1, "spec version must be carried, not invented");
  });
  check("illegal jumps and terminal re-entry are rejected", () => {
    expectThrow(() => advanceFoundry(snapshot(), "roadmap", "evd:x"), /invalid foundry transition/i, "idea cannot jump to roadmap");
    expectThrow(() => advanceFoundry(snapshot(), "agency_execution", "evd:x", "owner:go"), /invalid foundry transition/i, "agency execution requires the spec chain first");
    const done = snapshot({ stage: "post_launch" });
    expectThrow(() => advanceFoundry(done, "acceptance", "evd:x"), /invalid foundry transition/i, "post launch is terminal");
  });
  check("every transition requires evidence rather than assumed progress", () => {
    expectThrow(() => advanceFoundry(snapshot(), "research", "  "), /requires evidence/i, "a transition without evidence must be rejected");
    expectThrow(() => advanceFoundry(snapshot(), "research", ""), /requires evidence/i, "blank evidence must be rejected");
  });
});

suite("owner-authorization-gate", "Agency execution requires the exact owner authorization reference", (check) => {
  check("execution cannot begin without an authorization reference", () => {
    const atGate = snapshot({ stage: "owner_authorization" });
    expectThrow(() => advanceFoundry(atGate, "agency_execution", "evd:go"), /owner authorization/i, "execution without authorization must be rejected");
    const authorized = advanceFoundry(atGate, "agency_execution", "evd:go", "owner:go-ahead:1");
    expect(authorized.ownerAuthorizationRef === "owner:go-ahead:1", "authorization reference must be exact");
  });
  check("authorization is preserved through evidence and acceptance", () => {
    let current = advanceFoundry(snapshot({ stage: "owner_authorization" }), "agency_execution", "evd:go", "owner:go-ahead:1");
    current = advanceFoundry(current, "evidence", "evd:build");
    current = advanceFoundry(current, "acceptance", "evd:accept");
    expect(current.ownerAuthorizationRef === "owner:go-ahead:1", "authorization must survive later stages");
    expect(current.stage === "acceptance", "acceptance must be reached through evidence only");
  });
  check("acceptance cannot be reached without an evidence stage", () => {
    const executing = advanceFoundry(snapshot({ stage: "owner_authorization" }), "agency_execution", "evd:go", "owner:go-ahead:1");
    expectThrow(() => advanceFoundry(executing, "acceptance", "evd:accept"), /invalid foundry transition/i, "evidence must precede acceptance");
  });
});

suite("steering-invalidation", "Steering invalidates only affected and dependent work", (check) => {
  check("changing one unit invalidates its dependents transitively", () => {
    const units = [
      { id: "u1", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] },
      { id: "u2", dependencyIds: ["u1"], verified: true, authorizationScope: ["repo:read"] },
      { id: "u3", dependencyIds: ["u2"], verified: false, authorizationScope: ["repo:read"] },
      { id: "u4", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] }
    ];
    const result = applySteering("change", ["u1"], units);
    expect([...result.invalidatedIds].sort().join(",") === "u1,u2,u3", "the changed unit and its transitive dependents must be invalidated");
    expect(result.preservedVerifiedIds.join(",") === "u4", "unrelated verified work must be preserved");
    expect(result.requiresAuthorizationRecheck === true, "a change must require authorization recheck");
  });
  check("pause and resume preserve verified work without re-authorization", () => {
    const units = [
      { id: "u1", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] },
      { id: "u2", dependencyIds: ["u1"], verified: false, authorizationScope: ["repo:read"] }
    ];
    const paused = applySteering("pause", ["u2"], units);
    expect(paused.preservedVerifiedIds.join(",") === "u1", "pause must preserve verified work");
    expect(paused.invalidatedIds.join(",") === "u2", "pause must invalidate only the affected unit");
    expect(paused.requiresAuthorizationRecheck === false, "pause must not force re-authorization");
    expect(applySteering("resume", [], units).requiresAuthorizationRecheck === false, "resume must not force re-authorization");
  });
  check("unverified work is never preserved as verified output", () => {
    const units = [
      { id: "u1", dependencyIds: [], verified: false, authorizationScope: ["repo:read"] },
      { id: "u2", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] }
    ];
    const result = applySteering("reprioritize", [], units);
    expect(!result.preservedVerifiedIds.includes("u1"), "unverified work cannot be preserved as completed");
    expect(result.preservedVerifiedIds.join(",") === "u2", "only verified work is preserved");
    expect(result.requiresAuthorizationRecheck === true, "reprioritize must require authorization recheck");
  });
  check("steering is deterministic and scoped to declared units", () => {
    const units = [{ id: "u1", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] }];
    const first = applySteering("redirect", ["u1"], units);
    const second = applySteering("redirect", ["u1"], units);
    expect(JSON.stringify(first) === JSON.stringify(second), "steering must be deterministic");
    expect(applySteering("redirect", ["unknown"], units).preservedVerifiedIds.join(",") === "u1", "unknown ids must not invalidate real work");
    expect(applySteering("redirect", ["unknown"], units).invalidatedIds.length === 0, "unknown ids must be ignored rather than fabricated");
  });
});

suite("scope-and-authority-preservation", "Execution stays inside granted scope through steering", (check) => {
  check("affected work retains its declared authorization scope", () => {
    const units = [
      { id: "u1", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] },
      { id: "u2", dependencyIds: ["u1"], verified: true, authorizationScope: ["repo:read"] }
    ];
    applySteering("change", ["u1"], units);
    expect(units.every((unit) => unit.authorizationScope.join(",") === "repo:read"), "steering must not widen any unit's scope");
  });
  check("steering cannot mark invalidated work as verified", () => {
    const units = [{ id: "u1", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] }];
    const result = applySteering("redirect", ["u1"], units);
    expect(result.invalidatedIds.join(",") === "u1", "affected work must be invalidated");
    expect(!result.preservedVerifiedIds.includes("u1"), "invalidated work cannot remain in the preserved set");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.9",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  stages: 10,
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.9",
    headSha,
    inputs: [
      "clean-room/scripts/p15-9-foundry-steering-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/projects/foundry.ts",
      "clean-room/src/brain/steering.ts",
      "clean-room/tests/projects-foundation.test.mjs",
      "clean-room/tests/category6-live-steering-persistence.test.mjs",
      "clean-room/tests/p15-9-foundry-steering.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-9-foundry-steering-audit.mjs",
      "clean-room/tests/p15-9-foundry-steering.test.mjs",
      "clean-room/tests/projects-foundation.test.mjs",
      "clean-room/tests/category6-live-steering-persistence.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_9.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_9.json", inputsDigest: receipt.inputsDigest }));
}
console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
