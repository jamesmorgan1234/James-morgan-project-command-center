/**
 * P15.11 — Recovery, migration, offline, update and provider-loss exercise.
 *
 * Authority (roadmap P15.11): backup/restore, schema migration rollback,
 * provider/model loss, PWA update/rollback/offline shell, stale cache, partial
 * write and disconnected integrations. Exit gate: known-good system/data
 * survives each failure and recovers without mixed-version or fabricated state.
 *
 * Exercised against the real compiled recovery, data and UI implementation. All
 * failure injection is deterministic and nonproduction; no provider is contacted.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  REQUIRED_INTELLIGENCE_BACKUP_CLASSES,
  dryRunMigration,
  evaluateReplacement,
  reactivationPath,
  replacementDisposition,
  restoreUnderCurrentPolicy,
  rollbackRequired,
  validateBackup,
  validateIntelligenceBackup,
  validateRestore,
  verifyChaosOutcome
} from "../dist/recovery/index.js";
import { dryRunMigration as dryRunDataSetMigration } from "../dist/recovery/acceptance.js";
import { assertProviderReplacement, rebuildProjection } from "../dist/data/index.js";
import { COMMAND_CENTER_OFFLINE_POLICY, COMMAND_CENTER_PWA_SHELL, PwaUpdateCoordinator } from "../dist/ui/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const T0 = "2026-11-01T00:00:00.000Z";

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

const backupPolicy = (overrides = {}) => ({ scopeKeys: ["canonical_data", "protected_assets"], cadenceRef: "daily", retentionRef: "30d", encrypted: true, integrityAlgorithm: "sha256", protectedAssetRefs: ["asset:approved"], secretStrategy: "references_only", ...overrides });
const backupManifest = (overrides = {}) => ({ backupId: "backup-1", createdAt: T0, policyHash: "policy-hash", contentHash: "content-hash", itemCount: 12, sourceRefs: ["backup-run:1"], ...overrides });
const provider = (overrides = {}) => ({ key: "provider:primary", version: 1, enabled: true, authMode: "none", capabilities: ["data.read", "data.write"], scopes: ["project:edge"], freshnessSeconds: 60, cost: "free", health: "available", verification: "tool_result", failureMode: "fail_closed", ...overrides });

suite("backup-and-restore-integrity", "Backups and restores are encrypted, integrity-addressed and complete", (check) => {
  check("an encrypted, integrity-addressed backup validates", () => {
    expect(validateBackup(backupPolicy(), backupManifest()).itemCount === 12, "valid backup manifest must be accepted");
    expectThrow(() => validateBackup(backupPolicy({ scopeKeys: [] }), backupManifest()), /incomplete/i, "a backup without scopes must be rejected");
  });
  check("unencrypted or evidence-free backups are rejected", () => {
    expectThrow(() => validateBackup(backupPolicy({ encrypted: false }), backupManifest()), /unencrypted/i, "unencrypted backups must be rejected");
    expectThrow(() => validateBackup(backupPolicy({ cadenceRef: "  " }), backupManifest()), /incomplete/i, "incomplete policies must be rejected");
    expectThrow(() => validateBackup(backupPolicy(), backupManifest({ sourceRefs: [] })), /integrity evidence/i, "a backup without source evidence must be rejected");
    expectThrow(() => validateBackup(backupPolicy(), backupManifest({ contentHash: "" })), /integrity evidence/i, "a backup without content hash must be rejected");
  });
  check("intelligence backup classes are all required", () => {
    const classes = [...REQUIRED_INTELLIGENCE_BACKUP_CLASSES];
    validateIntelligenceBackup({ backupId: "b1", classes, encrypted: true, integrityVerified: true, retentionPolicyRef: "retain:30d", keyStrategyRef: "key:ref", createdAt: T0 });
    expectThrow(() => validateIntelligenceBackup({ backupId: "b1", classes: classes.slice(1), encrypted: true, integrityVerified: true, retentionPolicyRef: "r", keyStrategyRef: "k", createdAt: T0 }), /class_missing/i, "missing classes must be rejected");
    expectThrow(() => validateIntelligenceBackup({ backupId: "b1", classes, encrypted: false, integrityVerified: true, retentionPolicyRef: "r", keyStrategyRef: "k", createdAt: T0 }), /encryption/i, "unencrypted intelligence backup must be rejected");
    expectThrow(() => validateIntelligenceBackup({ backupId: "b1", classes, encrypted: true, integrityVerified: false, retentionPolicyRef: "r", keyStrategyRef: "k", createdAt: T0 }), /integrity/i, "unverified integrity must be rejected");
  });
  check("restore is isolated, integrity-checked and dependency-complete", () => {
    const plan = { backupId: "b1", isolatedEnvironment: true, items: [{ id: "a", kind: "config", contentHash: "1", dependencyIds: [] }, { id: "b", kind: "data", contentHash: "2", dependencyIds: ["a"] }], expectedContentHash: "same", observedContentHash: "same" };
    expect(validateRestore(plan).restored === 2, "a consistent isolated restore must succeed");
    expectThrow(() => validateRestore({ ...plan, isolatedEnvironment: false }), /isolated/i, "restore must stay isolated");
    expectThrow(() => validateRestore({ ...plan, observedContentHash: "different" }), /integrity mismatch/i, "hash mismatch must be rejected");
    expectThrow(() => validateRestore({ ...plan, items: [{ id: "b", kind: "data", contentHash: "2", dependencyIds: ["missing"] }] }), /dependency missing/i, "missing dependencies must be rejected");
  });
  check("restore under current policy cannot resurrect revoked or invalid state", () => {
    const records = [
      { id: "active", kind: "data", state: "active", privacyAllowed: true, policyAllowed: true, payloadRef: "payload:1" },
      { id: "revoked", kind: "data", state: "revoked", privacyAllowed: true, policyAllowed: true, payloadRef: "payload:2" },
      { id: "invalid", kind: "data", state: "invalid", privacyAllowed: true, policyAllowed: true, payloadRef: "payload:3" },
      { id: "private", kind: "data", state: "active", privacyAllowed: false, policyAllowed: true, payloadRef: "payload:4" },
      { id: "blocked", kind: "data", state: "active", privacyAllowed: true, policyAllowed: false, payloadRef: "payload:5" }
    ];
    const result = restoreUnderCurrentPolicy(records);
    expect(result.restored.map((record) => record.id).join(",") === "active", "only currently authorized state may restore");
    expect([...result.rejected].sort().join(",") === "blocked,invalid,private,revoked", "revoked, invalid, private and policy-blocked state must be rejected");
  });
});

suite("migration-and-rollback", "Migrations are dry-run gated and roll back without mixed-version state", (check) => {
  check("dry run requires compatibility, preconditions, backup and rollback", () => {
    const step = { id: "m1", fromVersion: 1, toVersion: 2, preconditionRefs: ["schema-ok"], backupRef: "backup:1", rollbackRef: "rollback:1", compatibleFrom: [1] };
    expect(dryRunMigration(step, 1).canApply === true, "a compatible migration must pass dry run");
    expect(dryRunMigration(step, 2).canApply === false, "an incompatible source must not apply");
    expect(dryRunMigration({ ...step, backupRef: " " }, 1).canApply === false, "a migration without backup must not apply");
    expect(dryRunMigration({ ...step, preconditionRefs: [] }, 1).canApply === false, "a migration without preconditions must not apply");
    expect(dryRunMigration({ ...step, toVersion: 1 }, 1).canApply === false, "a non-advancing migration must not apply");
  });
  check("failed or uncertain migrations require rollback", () => {
    expect(rollbackRequired("failed") === true && rollbackRequired("uncertain") === true, "failed and uncertain migrations must roll back");
    expect(rollbackRequired("applied") === false, "an applied migration must not roll back");
  });
  check("partial migration rolls back every applied item and preserves erasure", () => {
    const items = [
      { id: "a", sourceVersion: 1, targetVersion: 2, erased: false, historyRefs: ["h:a"], identityRef: "id:a" },
      { id: "b", sourceVersion: 1, targetVersion: 2, erased: false, historyRefs: ["h:b"], identityRef: "id:b" },
      { id: "erased", sourceVersion: 1, targetVersion: 2, erased: true, historyRefs: ["h:e"], identityRef: "id:e" }
    ];
    const complete = dryRunDataSetMigration(items);
    expect(complete.status === "completed" && complete.migrated.join(",") === "a,b", "a clean migration must complete");
    expect(!complete.migrated.includes("erased") && complete.erasurePreserved === true, "erased records must stay erased");
    const partial = dryRunDataSetMigration(items, "b");
    expect(partial.status === "rolled_back" && partial.rolledBack.join(",") === "a", "a failure must roll back prior items");
    expect(partial.migrated.length === 0 && partial.erasurePreserved === true, "a partial migration must leave no mixed state");
  });
});

suite("provider-loss-and-replacement", "Provider loss degrades or replaces without silent substitution", (check) => {
  check("provider health decides keep, degrade or replace", () => {
    expect(replacementDisposition(provider({ health: "available" })) === "keep", "available must keep");
    expect(replacementDisposition(provider({ health: "degraded" })) === "degrade_locally", "degraded must degrade locally");
    expect(replacementDisposition(provider({ health: "retired" })) === "replace", "retired must replace");
    expectThrow(() => replacementDisposition(provider({ coreRewriteRequired: true })), /core rewrite/i, "replacement must never require a core rewrite");
  });
  check("replacement candidates must be available, free and compatible", () => {
    const candidate = { kind: "provider", candidateRef: "provider:next", available: true, costKnownFree: true, compatible: true, dependentRefs: ["dep:a"] };
    expect(evaluateReplacement(candidate).activatable === true, "a free compatible candidate must activate");
    expect(evaluateReplacement({ ...candidate, available: false }).reasons.join(",") === "candidate_unavailable", "unavailable candidates must be refused");
    expect(evaluateReplacement({ ...candidate, costKnownFree: false }).reasons.join(",") === "cost_not_verified_free", "paid candidates must be refused at $0");
    const incompatible = evaluateReplacement({ ...candidate, compatible: false });
    expect(incompatible.activatable === false && incompatible.invalidatedDependents.join(",") === "dep:a", "incompatibility must invalidate dependents");
  });
  check("canonical provider replacement enforces free-first and capability parity", () => {
    const old = provider();
    assertProviderReplacement(old, provider({ key: "provider:primary", version: 2 }), ["data.read"], true);
    expectThrow(() => assertProviderReplacement(old, provider({ key: "provider:primary", version: 2, cost: "paid" }), ["data.read"], true), /paid|free/i, "paid replacement must be rejected at $0");
    expectThrow(() => assertProviderReplacement(old, provider({ key: "provider:primary", version: 2, capabilities: [] }), ["data.read"], true), /capabilit/i, "capability loss must be rejected");
    expect(old.key === "provider:primary" && old.cost === "free", "replacement checks must not mutate the canonical provider");
  });
});

suite("offline-update-and-stale-cache", "Offline shell and updates never fake freshness or mixed versions", (check) => {
  check("the PWA shell states its offline limits explicitly", () => {
    expect(COMMAND_CENTER_PWA_SHELL.offlineFallbackRoute === "/offline", "offline fallback must exist");
    expect(COMMAND_CENTER_PWA_SHELL.cachedShellNeverImpliesFreshBusinessData === true, "cached shell must never imply fresh data");
    expect(COMMAND_CENTER_OFFLINE_POLICY.shellAvailableOffline === true && COMMAND_CENTER_OFFLINE_POLICY.showStaleness === true, "offline shell must show staleness");
    expect(COMMAND_CENTER_OFFLINE_POLICY.queueWritesWhileOffline === false, "writes must not be queued offline");
    expect(COMMAND_CENTER_OFFLINE_POLICY.protectedActionsOffline === false, "protected actions must remain unavailable offline");
  });
  check("incompatible updates are blocked and rollback restores known-good", () => {
    const updates = new PwaUpdateCoordinator();
    expectThrow(() => updates.rollback(), /known-good/i, "rollback requires a known-good release");
    updates.transition("checking");
    updates.transition("available");
    updates.setCandidate({ releaseId: "release-2", buildHash: "build-2", assetManifestHash: "assets-2", schemaCompatibility: "schema-v2" });
    expect(updates.candidateIsSchemaCompatible("schema-v1") === false, "incompatible schema must block activation");
    updates.transition("downloading");
    updates.transition("verified");
    updates.transition("activating");
    updates.transition("active");
    updates.markActive();
    updates.transition("rolled_back");
    expect(updates.rollback().releaseId === "release-2", "rollback must restore the last known-good release");
    expectThrow(() => updates.transition("activating"), /invalid update transition/i, "rolled-back coordinators cannot skip verification");
  });
  check("stale caches and projection gaps are rejected rather than patched", () => {
    expect(rebuildProjection([{ sequence: 1, eventId: "e1", payloadHash: "h1" }, { sequence: 2, eventId: "e2", payloadHash: "h2" }]).eventCount === 2, "a complete projection must rebuild");
    expectThrow(() => rebuildProjection([{ sequence: 1, eventId: "e1", payloadHash: "h1" }, { sequence: 3, eventId: "e3", payloadHash: "h3" }]), /./, "a projection gap must be rejected");
  });
});

suite("dormant-and-chaos-recovery", "Dormant capabilities reactivate and chaos recovery stays fenced", (check) => {
  check("dormant capabilities re-enter the full configure-connect-authorize-enable path", () => {
    const path = reactivationPath({ key: "future-x", state: "dormant", contractVersion: 3, dataVersion: 2, requiredProviderCapabilities: ["read"] }, ["read", "write"]);
    expect(path.join(",") === "configure,connect,authorize,enable", "reactivation must require every gate");
    expectThrow(() => reactivationPath({ key: "future-x", state: "dormant", contractVersion: 3, dataVersion: 2, requiredProviderCapabilities: ["read"] }, []), /./, "missing provider capabilities must block reactivation");
  });
  check("chaos recovery requires fencing, checkpoints and no stale mutation", () => {
    const outcome = { fault: "stale_lease", fencingEnabled: true, durableCheckpointRef: "checkpoint:7", staleMutationAccepted: false, resumedFromCheckpoint: true };
    verifyChaosOutcome(outcome);
    expectThrow(() => verifyChaosOutcome({ ...outcome, staleMutationAccepted: true }), /stale/i, "stale mutation must fail the drill");
    expectThrow(() => verifyChaosOutcome({ ...outcome, fencingEnabled: false }), /fenc/i, "unfenced recovery must fail the drill");
    expectThrow(() => verifyChaosOutcome({ ...outcome, resumedFromCheckpoint: false }), /checkpoint|resume/i, "recovery without checkpoint resume must fail");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.11",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  failureClasses: ["backup", "restore", "migration", "provider-loss", "offline", "update", "stale-cache", "chaos"],
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.11",
    headSha,
    inputs: [
      "clean-room/scripts/p15-11-recovery-migration-provider-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/recovery/backup.ts",
      "clean-room/src/recovery/restore.ts",
      "clean-room/src/recovery/migrations.ts",
      "clean-room/src/recovery/replacement.ts",
      "clean-room/src/recovery/acceptance.ts",
      "clean-room/src/recovery/scale.ts",
      "clean-room/src/data/recovery.ts",
      "clean-room/src/ui/pwa.ts",
      "clean-room/tests/recovery-scale-foundation.test.mjs",
      "clean-room/tests/p15-11-recovery-migration-provider.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-11-recovery-migration-provider-audit.mjs",
      "clean-room/tests/p15-11-recovery-migration-provider.test.mjs",
      "clean-room/tests/recovery-scale-foundation.test.mjs",
      "clean-room/tests/p14-durable-recovery.test.mjs",
      "clean-room/tests/category3-recovery-boundaries.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_11.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_11.json", inputsDigest: receipt.inputsDigest }));
}
console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
