import test from "node:test";
import assert from "node:assert/strict";
import {
  validateBackup,
  validateRestore,
  dryRunMigration,
  rollbackRequired,
  replacementDisposition,
  validateRecoveryReport,
  recoveryComplete,
  capacityDecision,
  reactivationPath,
  assertFuturePrincipalIsolation,
  assertPublicForkSafe,
  InterfaceRegistry,
  verifyChaosOutcome,
  validateLongHorizonLifecycle
} from "../dist/recovery/index.js";

test("backup architecture is encrypted, integrity-addressed and independently evidenced", () => {
  const manifest = validateBackup({ scopeKeys: ["canonical_data", "protected_assets"], cadenceRef: "daily", retentionRef: "30d", encrypted: true, integrityAlgorithm: "sha256", protectedAssetRefs: ["asset:approved"], secretStrategy: "references_only" }, { backupId: "b1", createdAt: "2026-10-23T19:00:00Z", policyHash: "ph", contentHash: "ch", itemCount: 10, sourceRefs: ["backup-run"] });
  assert.equal(manifest.itemCount, 10);
});

test("isolated disaster restore verifies full integrity and dependency consistency", () => {
  const result = validateRestore({ backupId: "b1", isolatedEnvironment: true, items: [{ id: "a", kind: "config", contentHash: "1", dependencyIds: [] }, { id: "b", kind: "data", contentHash: "2", dependencyIds: ["a"] }], expectedContentHash: "same", observedContentHash: "same" });
  assert.deepEqual(result, { restored: 2, consistent: true });
  assert.throws(() => validateRestore({ backupId: "b1", isolatedEnvironment: false, items: [], expectedContentHash: "a", observedContentHash: "a" }));
});

test("schema migration requires dry-run compatibility, backup and rollback path", () => {
  assert.deepEqual(dryRunMigration({ id: "m1", fromVersion: 1, toVersion: 2, preconditionRefs: ["schema-ok"], backupRef: "backup", rollbackRef: "rollback", compatibleFrom: [1] }, 1), { canApply: true, reason: "dry_run_passed" });
  assert.equal(rollbackRequired("failed"), true);
});

test("provider/dependency loss degrades locally and replacement never requires core rewrite", () => {
  assert.equal(replacementDisposition({ key: "provider-x", kind: "provider", health: "degraded", adapterKey: "adapter-x", coreRewriteRequired: false, capabilities: ["read"] }), "degrade_locally");
  assert.equal(replacementDisposition({ key: "provider-x", kind: "provider", health: "retired", adapterKey: "adapter-x", coreRewriteRequired: false, capabilities: ["read"] }), "replace");
  assert.throws(() => replacementDisposition({ key: "bad", kind: "provider", health: "retired", adapterKey: "a", coreRewriteRequired: true, capabilities: [] }));
});

test("historical recovery cannot be called complete until machine-readable scope exactly closes", () => {
  const report = validateRecoveryReport({ sourceSetId: "export-132", expectedConversations: 132, processedConversations: 132, messageNodes: 1000, branchPoints: 50, projectContainers: 20, candidateProjects: ["candidate"], conflicts: [], privacyExclusions: ["secret"], missingArtifacts: ["missing-cover"], unresolvedUnknowns: [], sourceRefs: ["export-0", "export-1"] });
  assert.equal(recoveryComplete(report), true);
  assert.equal(recoveryComplete({ ...report, processedConversations: 131 }), false);
});

test("10x/100x scale applies explicit backpressure instead of data loss", () => {
  assert.equal(capacityDecision({ projects: 1000, books: 5000, accounts: 100, socialChannels: 200, agencyJobs: 900, knowledgeRecords: 100000, cpuPercent: 70, memoryPercent: 72, queueDepth: 500, providerDegraded: false }), "accept");
  assert.equal(capacityDecision({ projects: 1000, books: 5000, accounts: 100, socialChannels: 200, agencyJobs: 2000, knowledgeRecords: 100000, cpuPercent: 90, memoryPercent: 72, queueDepth: 1200, providerDegraded: false }), "backpressure");
});

test("dormant capability re-enters configure-connect-authorize-enable without kernel rewrite", () => {
  assert.deepEqual(reactivationPath({ key: "future-x", state: "dormant", contractVersion: 3, dataVersion: 2, requiredProviderCapabilities: ["read"] }, ["read", "write"]), ["configure", "connect", "authorize", "enable"]);
});

test("future multi-user seam cannot weaken current owner-private scope", () => {
  assert.doesNotThrow(() => assertFuturePrincipalIsolation([{ ownerId: "james", principalId: "future-user", tenantId: "t2", roleKeys: ["viewer"], resourceScopes: ["project:x:read"] }]));
  assert.throws(() => assertFuturePrincipalIsolation([{ ownerId: "james", principalId: "future-user", tenantId: "t2", roleKeys: ["viewer"], resourceScopes: ["owner:*"] }]));
});

test("commercial/public fork excludes James private data, secrets and owner-specific policy", () => {
  assert.doesNotThrow(() => assertPublicForkSafe({ codeRefs: ["release"], publicConfigRefs: ["default-config"], privateDataRefs: [], secretRefs: [], ownerPolicyRefs: [] }));
  assert.throws(() => assertPublicForkSafe({ codeRefs: ["release"], publicConfigRefs: [], privateDataRefs: ["james-data"], secretRefs: [], ownerPolicyRefs: [] }));
});

test("future interfaces reuse canonical command/policy/data runtimes and remove cleanly", () => {
  const registry = new InterfaceRegistry();
  registry.register({ key: "wearable-1", kind: "wearable", commandRuntimeKey: "command-runtime", policyRuntimeKey: "policy-runtime", canonicalDataRuntimeKey: "canonical-data", removable: true });
  assert.equal(registry.remove("wearable-1").kind, "wearable");
});

test("distributed chaos requires fencing and verified checkpoint resume with no stale mutation", () => {
  assert.doesNotThrow(() => verifyChaosOutcome({ fault: "scheduler", fencingEnabled: true, durableCheckpointRef: "checkpoint-7", staleMutationAccepted: false, resumedFromCheckpoint: true }));
  assert.throws(() => verifyChaosOutcome({ fault: "stale_lease", fencingEnabled: true, durableCheckpointRef: "checkpoint-7", staleMutationAccepted: true, resumedFromCheckpoint: true }));
});

test("long-horizon lifecycle covers birth through replacement without orphan authority/data", () => {
  assert.doesNotThrow(() => validateLongHorizonLifecycle({ subjectKey: "provider:x", stages: ["birth", "configure", "use", "failure", "recovery", "migration", "disable", "removal", "replacement"], evidenceRefs: ["lifecycle-suite"], undocumentedManualSurgery: false, orphanAuthorityOrData: false }));
});
