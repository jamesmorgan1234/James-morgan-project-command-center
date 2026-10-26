import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupSetupByUnlockImpact, knownSetupBlockers, validateOnboardingManifest } from "../dist/personal/index.js";

const manifest = {
  projectId: "command-center",
  specVersion: 1,
  requirements: [
    { id: "account", kind: "account", title: "Create provider account", dependencyIds: [], unlockRefs: ["provider:connect", "provider:read"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true },
    { id: "credential", kind: "credential", title: "Authorize credential", dependencyIds: ["account"], unlockRefs: ["provider:read", "provider:write"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true },
    { id: "device", kind: "device", title: "Register device", dependencyIds: [], unlockRefs: ["device:trusted"], requiredEnvironment: "phone", ownerOnly: true, knownAtSpecTime: true },
    { id: "late-discovery", kind: "provider", title: "Runtime-only condition", dependencyIds: [], unlockRefs: ["runtime:optional"], requiredEnvironment: "any_device", ownerOnly: false, knownAtSpecTime: false }
  ]
};

test("P8.6 exposes every known setup blocker before late execution, including dependency-blocked items", () => {
  const blockers = knownSetupBlockers(manifest, []);
  assert.deepEqual(blockers.map((item) => item.requirementId).sort(), ["account", "credential", "device"]);
  assert.equal(blockers.find((item) => item.requirementId === "account")?.readyForOwnerAction, true);
  assert.deepEqual(blockers.find((item) => item.requirementId === "credential")?.unmetDependencyIds, ["account"]);
  assert.equal(blockers.some((item) => item.requirementId === "late-discovery"), false);
});

test("P8.6 completing a prerequisite updates readiness without hiding remaining blockers", () => {
  const blockers = knownSetupBlockers(manifest, ["account"]);
  assert.equal(blockers.some((item) => item.requirementId === "account"), false);
  assert.equal(blockers.find((item) => item.requirementId === "credential")?.readyForOwnerAction, true);
  assert.ok(blockers.some((item) => item.requirementId === "device"));
  assert.equal(groupSetupByUnlockImpact(manifest)[0]?.unlockRef, "provider:read");
});

test("P8.6 rejects unknown dependencies, self-dependencies, cycles, and unknown completed ids", () => {
  assert.throws(() => validateOnboardingManifest({ ...manifest, requirements: [{ ...manifest.requirements[0], dependencyIds: ["missing"] }] }), /Unknown setup dependency/i);
  assert.throws(() => validateOnboardingManifest({ ...manifest, requirements: [{ ...manifest.requirements[0], dependencyIds: ["account"] }] }), /depend on itself/i);
  assert.throws(() => validateOnboardingManifest({ ...manifest, requirements: [
    { ...manifest.requirements[0], id: "a", dependencyIds: ["b"] },
    { ...manifest.requirements[1], id: "b", dependencyIds: ["a"] }
  ] }), /dependency cycle/i);
  assert.throws(() => knownSetupBlockers(manifest, ["not-in-manifest"]), /not in manifest/i);
});

test("P8.6 durable schema versions prerequisites and completion evidence without inventing execution authority", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026085000_p8_6_onboarding_manifests.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_onboarding_requirements/i);
  assert.match(sql, /spec_version bigint not null/i);
  assert.match(sql, /known_at_spec_time boolean not null/i);
  assert.match(sql, /dependency_ids text\[\] not null/i);
  assert.match(sql, /unlock_refs text\[\] not null/i);
  assert.match(sql, /command_center_onboarding_completions/i);
  assert.match(sql, /evidence_refs text\[\] not null/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.doesNotMatch(sql, /scheduler|executor|worker_queue/i);
});
