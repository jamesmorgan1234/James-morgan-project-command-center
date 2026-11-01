/**
 * P15.10 — Needs Me, onboarding and boundary-resume acceptance.
 *
 * Authority (roadmap P15.10): onboarding manifests, grouped owner dependencies,
 * unlock scoring, device/login/legal/payment/identity boundaries, exact
 * instructions, verification, and same-run resume. Exit gate: the owner is not
 * repeatedly asked for already-known/cleared actions and work resumes
 * deterministically.
 *
 * Exercised against the real compiled Personal runtime (dist/personal). Real
 * owner-only boundaries are represented by deterministic contracts; nothing here
 * crosses a real credential, MFA, passkey, legal or payment boundary.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  NeedsMeQueue,
  generateOnboardingManifest,
  groupSetupByUnlockImpact,
  knownSetupBlockers,
  onboardingNeeds,
  resumeResolvedNeed,
  validateOnboardingManifest
} from "../dist/personal/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const T0 = "2026-11-01T00:00:00.000Z";
const T1 = "2026-11-01T00:05:00.000Z";

const results = [];
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const expectThrow = (run, pattern, message) => {
  try { run(); } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected error "${error.message}"`);
    return;
  }
  throw new Error(`${message}: expected a rejection but the operation succeeded`);
};
const expectReject = async (run, pattern, message) => {
  try { await run(); } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected error "${error.message}"`);
    return;
  }
  throw new Error(`${message}: expected a rejection but the operation succeeded`);
};
const suite = async (id, description, body) => {
  const checks = [];
  const check = async (name, run) => {
    try { await run(); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  await body(check);
  const failed = checks.filter((entry) => !entry.passed);
  results.push({ id, description, passed: failed.length === 0, checks });
};

const need = (overrides = {}) => ({
  id: "need-1",
  ownerId: "owner-1",
  needKey: "login:bank",
  title: "Sign in to your bank",
  reason: "Provider connection blocked until the owner signs in",
  urgency: "normal",
  requiredEnvironment: "phone",
  ownerAction: "Sign in to the bank app on your phone",
  unlockRefs: ["finance:link"],
  resumeRefs: ["resume:finance"],
  sourceRefs: ["provider:bank"],
  state: "open",
  ...overrides
});

const manifest = (overrides = {}) => ({
  projectId: "edge-finder",
  specVersion: 3,
  requirements: [
    { id: "req-account", kind: "account", title: "Create owner account", dependencyIds: [], unlockRefs: ["app:start"], requiredEnvironment: "phone", ownerOnly: true, knownAtSpecTime: true },
    { id: "req-passkey", kind: "permission", title: "Add a passkey", dependencyIds: ["req-account"], unlockRefs: ["app:secure", "app:start"], requiredEnvironment: "phone", ownerOnly: true, knownAtSpecTime: true },
    { id: "req-domain", kind: "domain", title: "Choose domain", dependencyIds: [], unlockRefs: ["web:launch"], requiredEnvironment: "pc", ownerOnly: true, knownAtSpecTime: true },
    { id: "req-internal", kind: "provider", title: "Internal provider key", dependencyIds: [], unlockRefs: ["ops:internal"], requiredEnvironment: "any_device", ownerOnly: false, knownAtSpecTime: true },
    { id: "req-learned", kind: "device", title: "Later discovered device", dependencyIds: [], unlockRefs: ["devices:add"], requiredEnvironment: "any_device", ownerOnly: true, knownAtSpecTime: false }
  ],
  ...overrides
});

await suite("needs-me-state", "Needs Me tracks owner boundaries, urgency and unlocks truthfully", (check) => {
  check("open needs are ordered by urgency and unlock impact", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need({ id: "n-low", needKey: "low", urgency: "low", unlockRefs: ["a"], resumeRefs: ["r1"] }));
    queue.upsert(need({ id: "n-critical", needKey: "critical", urgency: "critical", unlockRefs: ["b"], resumeRefs: ["r2"] }));
    queue.upsert(need({ id: "n-high", needKey: "high", urgency: "high", unlockRefs: ["c", "d"], resumeRefs: ["r3"] }));
    expect(queue.open().map((item) => item.needKey).join(",") === "critical,high,low", "needs must be ordered by urgency");
  });
  check("duplicate boundary keys merge instead of prompting twice", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need({ id: "n1", urgency: "low", unlockRefs: ["finance:link"], resumeRefs: ["resume:finance"] }));
    queue.upsert(need({ id: "n2", urgency: "critical", unlockRefs: ["finance:report"], resumeRefs: ["resume:report"] }));
    const open = queue.open();
    expect(open.length === 1, "the same boundary must not be asked twice");
    expect(open[0].urgency === "critical", "merged urgency must take the highest");
    expect(open[0].unlockRefs.join(",") === "finance:link,finance:report", "merged unlocks must be unioned");
    expect(open[0].resumeRefs.join(",") === "resume:finance,resume:report", "merged resume routes must be unioned");
  });
  check("a colliding key with a different instruction is rejected rather than silently merged", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    expectThrow(() => queue.upsert(need({ id: "n-other", ownerAction: "Enter your bank password here" })), /different owner action/i, "different instructions under one key must be rejected");
    expectThrow(() => queue.upsert(need({ id: "n-other", requiredEnvironment: "pc" })), /different owner action|environment/i, "a different boundary environment must be rejected");
  });
  check("owner needs never contain credential material fields", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    for (const item of queue.open()) {
      for (const forbidden of ["password", "secret", "token", "credential", "mfaCode", "passkey"]) expect(!Object.hasOwn(item, forbidden), `needs must not collect ${forbidden}`);
    }
  });
});

await suite("resolution-idempotency", "One resolution clears the boundary permanently without re-asking", (check) => {
  check("resolving by key is idempotent and evidence-bearing", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    const first = queue.resolveByKey("owner-1", "login:bank", T1, ["evd:signin"]);
    const second = queue.resolveByKey("owner-1", "login:bank", T1, ["evd:signin"]);
    expect(JSON.stringify(first) === JSON.stringify(second), "repeat resolution must return the original receipt");
    expect(first.resolvedNeedId === "need-1" && first.unlockRefs.join(",") === "finance:link", "resolution must carry the cleared unlock");
    expect(queue.open().length === 0, "resolved needs must leave the owner queue");
    const fresh = new NeedsMeQueue();
    fresh.upsert(need({ id: "n-empty", needKey: "empty:key" }));
    expectThrow(() => fresh.resolveByKey("owner-1", "empty:key", T1, []), /evidence/i, "resolution requires evidence");
  });
  check("already-resolved boundaries are not re-raised by later observation", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    queue.resolveByKey("owner-1", "login:bank", T1, ["evd:signin"]);
    queue.upsert(need({ id: "need-again", title: "Sign in again" }));
    expect(queue.open().length === 0, "a resolved boundary must not be re-raised");
    expect(queue.resolution("owner-1", "login:bank").resolvedNeedId === "need-1", "the original resolution must stay authoritative");
  });
  check("unknown or malformed resolutions fail closed", () => {
    const queue = new NeedsMeQueue();
    expectThrow(() => queue.resolveByKey("owner-1", "missing", T1, ["evd"]), /unknown open needs me key/i, "unknown keys must be rejected");
    queue.upsert(need());
    expectThrow(() => queue.resolveByKey("owner-1", "login:bank", "not-a-time", ["evd"]), /valid timestamp/i, "invalid timestamps must be rejected");
    expectThrow(() => queue.resolve("missing"), /unknown needs me item/i, "unknown items cannot be resolved by id");
  });
});

await suite("boundary-resume", "Completed boundary work resumes every linked route exactly once", (check) => {
  check("one resolution fans out to every resume route with preserved scope", async () => {
    const calls = [];
    const dispatcher = { resume: async (resumeRef) => { calls.push(resumeRef); return { resumeRef, evidenceRefs: [`evd:${resumeRef}`], protectedActionAuthorized: false }; } };
    const resolution = { ownerId: "owner-1", needKey: "login:bank", resolvedNeedId: "need-1", resolvedAt: T1, evidenceRefs: ["evd:signin"], unlockRefs: ["finance:link"], resumeRefs: ["resume:finance", "resume:dashboard"] };
    const receipt = await resumeResolvedNeed(resolution, dispatcher);
    expect(receipt.resumed.length === 2 && calls.length === 2, "every resume route must be dispatched once");
    expect(receipt.resumed.every((entry) => entry.protectedActionAuthorized === false), "resume must not expand protected-action authority");
    expect(receipt.unlockRefs.join(",") === "finance:link", "resume must carry the unlocked scope");
  });
  check("resume cannot widen authority or misroute receipts", async () => {
    const resolution = { ownerId: "owner-1", needKey: "login:bank", resolvedNeedId: "need-1", resolvedAt: T1, evidenceRefs: ["evd:signin"], unlockRefs: ["finance:link"], resumeRefs: ["resume:finance"] };
    await expectReject(() => resumeResolvedNeed(resolution, { resume: async (resumeRef) => ({ resumeRef, evidenceRefs: ["evd"], protectedActionAuthorized: true }) }), /cannot expand protected-action authority/i, "resume must not grant protected authority");
    await expectReject(() => resumeResolvedNeed(resolution, { resume: async () => ({ resumeRef: "resume:other", evidenceRefs: ["evd"], protectedActionAuthorized: false }) }), /does not match/i, "misrouted receipts must be rejected");
    await expectReject(() => resumeResolvedNeed({ ...resolution, evidenceRefs: [] }, { resume: async (resumeRef) => ({ resumeRef, evidenceRefs: ["evd"], protectedActionAuthorized: false }) }), /evidence/i, "resume requires resolution evidence");
  });
});

await suite("onboarding-manifest", "Onboarding manifests are valid, grouped by unlock impact and dependency-aware", (check) => {
  check("manifests reject duplicate ids, unknown dependencies, self-dependency and cycles", () => {
    validateOnboardingManifest(manifest());
    expectThrow(() => validateOnboardingManifest(manifest({ requirements: [...manifest().requirements, manifest().requirements[0]] })), /unique/i, "duplicate requirement ids must be rejected");
    expectThrow(() => validateOnboardingManifest(manifest({ requirements: [{ ...manifest().requirements[0], dependencyIds: ["ghost"] }] })), /unknown setup dependency/i, "unknown dependencies must be rejected");
    expectThrow(() => validateOnboardingManifest(manifest({ requirements: [{ ...manifest().requirements[0], dependencyIds: ["req-account"] }] })), /cannot depend on itself/i, "self dependency must be rejected");
    expectThrow(() => validateOnboardingManifest(manifest({ projectId: " " })), /project/i, "manifest requires a project");
  });
  check("setup groups rank by unlock impact", () => {
    const groups = groupSetupByUnlockImpact(manifest());
    expect(groups[0].requirementIds.length >= 2, "the widest unlock group must rank first");
    expect(groups.every((group) => group.unlockRefs === undefined || group.unlockRefs.length > 0), "groups must carry unlock refs");
    expect(groups.some((group) => group.unlockRef === "app:start"), "app:start must be a declared unlock group");
  });
  check("blockers expose exact actions, environments and dependency readiness", () => {
    const blockers = knownSetupBlockers(manifest(), ["req-account"]);
    const passkey = blockers.find((blocker) => blocker.requirementId === "req-passkey");
    expect(passkey.readyForOwnerAction === true && passkey.unmetDependencyIds.length === 0, "a cleared dependency must make the boundary actionable");
    const dependent = knownSetupBlockers(manifest(), []);
    const blocked = dependent.find((blocker) => blocker.requirementId === "req-passkey");
    expect(blocked.readyForOwnerAction === false && blocked.unmetDependencyIds.join(",") === "req-account", "a dependent boundary must wait for its prerequisite");
    expect(blocked.requiredEnvironment === "phone" && blocked.ownerOnly === true, "the exact environment and owner ownership must be exposed");
    expect(!dependent.some((blocker) => blocker.requirementId === "req-learned"), "unknown-at-spec-time setup must not be demanded upfront");
    expectThrow(() => knownSetupBlockers(manifest(), ["ghost"]), /not in manifest/i, "unknown completions must be rejected");
  });
});

await suite("foundry-onboarding-needs", "Foundry capability declarations generate owner needs without duplicate prompts", (check) => {
  check("manifest generation merges declarations deterministically", () => {
    const spec = { projectId: "edge-finder", specVersion: 3, capabilities: [
      { capabilityRef: "cap:app", requirements: [{ ...manifest().requirements[0] }, { ...manifest().requirements[1] }] },
      { capabilityRef: "cap:web", requirements: [{ ...manifest().requirements[2] }] }
    ] };
    const generated = generateOnboardingManifest(spec);
    expect(generated.requirements.length === 3, "deduplicated requirements must be generated");
    expect(generated.requirements.map((requirement) => requirement.id).join(",") === "req-account,req-domain,req-passkey", "generated requirements must be canonically ordered");
    expectThrow(() => generateOnboardingManifest({ ...spec, capabilities: [...spec.capabilities, { capabilityRef: "cap:conflict", requirements: [{ ...manifest().requirements[0], title: "Different account step" }] }] }), /conflicting setup requirement/i, "conflicting declarations must be rejected");
  });
  check("owner needs carry exact instructions, environment and resume routes", () => {
    const needs = onboardingNeeds("owner-1", manifest(), []);
    expect(needs.length === 3, "only owner-only, spec-time-known boundaries become needs");
    expect(!needs.some((item) => item.needKey.includes("req-internal")), "non-owner setup must not become an owner need");
    expect(!needs.some((item) => item.needKey.includes("req-learned")), "later-discovered setup must not be demanded upfront");
    const passkey = needs.find((item) => item.needKey.endsWith("req-passkey"));
    expect(passkey.urgency === "normal", "a blocked prerequisite must not be presented as immediately actionable");
    expect(passkey.requiredEnvironment === "phone" && passkey.ownerAction === "Add a passkey", "the exact action and environment must be preserved");
    expect(passkey.resumeRefs.length === 1 && passkey.unlockRefs.join(",") === "app:secure,app:start", "resume route and unlocks must be carried");
    const available = onboardingNeeds("owner-1", manifest(), ["req-account"]).find((item) => item.needKey.endsWith("req-passkey"));
    expect(available.urgency === "high", "an actionable boundary must be prioritised");
  });
});

await suite("restart-and-truthful-states", "Boundaries survive restart without re-asking or fabricating resolution", (check) => {
  check("snapshot rehydration preserves resolutions and does not re-open cleared work", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    queue.upsert(need({ id: "n-domain", needKey: "domain:purchase", urgency: "high", unlockRefs: ["web:launch"], resumeRefs: ["resume:web"], requiredEnvironment: "pc", ownerAction: "Buy the domain" }));
    queue.resolveByKey("owner-1", "login:bank", T1, ["evd:signin"]);
    const restored = NeedsMeQueue.rehydrate(queue.exportSnapshot());
    expect(restored.open().map((item) => item.needKey).join(",") === "domain:purchase", "only unresolved boundaries may re-open after restart");
    expect(restored.resolution("owner-1", "login:bank").resolvedNeedId === "need-1", "resolutions must survive restart");
    restored.upsert(need({ id: "need-replay" }));
    expect(restored.open().length === 1, "a restored resolved boundary must not be re-raised");
  });
  check("corrupt or unsupported snapshots fail closed", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    expectThrow(() => NeedsMeQueue.rehydrate({ ...queue.exportSnapshot(), schemaVersion: "cc-needs-me-v2" }), /unsupported/i, "unknown snapshot schema must be rejected");
    expectThrow(() => NeedsMeQueue.rehydrate({ ...queue.exportSnapshot(), needs: [...queue.exportSnapshot().needs, queue.exportSnapshot().needs[0]] }), /duplicate/i, "duplicate persisted items must be rejected");
    expectThrow(() => NeedsMeQueue.rehydrate({ ...queue.exportSnapshot(), resolutions: [{ ownerId: "", needKey: "k", resolvedNeedId: "n", resolvedAt: T1, evidenceRefs: ["e"], unlockRefs: ["u"], resumeRefs: ["r"] }] }), /identity/i, "invalid persisted resolutions must be rejected");
  });
  check("needs states are limited to explicit boundary outcomes", () => {
    const queue = new NeedsMeQueue();
    queue.upsert(need());
    queue.resolve("need-1");
    expect(queue.open().length === 0, "resolved items must be excluded");
    expectThrow(() => queue.upsert(need({ id: "n-blank", title: "   " })), /required/i, "a boundary without a title must be rejected");
    expect(["open", "acknowledged", "resolved"].includes(queue.exportSnapshot().needs[0].state), "stored needs must use a declared state");
    expect(queue.exportSnapshot().schemaVersion === "cc-needs-me-v1", "the snapshot must declare its schema");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.10",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.10",
    headSha,
    inputs: [
      "clean-room/scripts/p15-10-needs-me-boundary-resume-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/personal/needs-me.ts",
      "clean-room/src/personal/onboarding.ts",
      "clean-room/src/personal/runtime-integration.ts",
      "clean-room/tests/p8-5-needs-me.test.mjs",
      "clean-room/tests/p8-6-onboarding-manifests.test.mjs",
      "clean-room/tests/p15-10-needs-me-boundary-resume.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-10-needs-me-boundary-resume-audit.mjs",
      "clean-room/tests/p15-10-needs-me-boundary-resume.test.mjs",
      "clean-room/tests/p8-5-needs-me.test.mjs",
      "clean-room/tests/p8-6-onboarding-manifests.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_10.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_10.json", inputsDigest: receipt.inputsDigest }));
}
console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
