import test from "node:test";
import assert from "node:assert/strict";
import * as recovery from "../dist/recovery/index.js";

test("P14.1 backup includes governed intelligence with encryption/integrity/retention/key strategy", () => {
  assert.doesNotThrow(() => recovery.validateIntelligenceBackup({ backupId: "b", classes: recovery.REQUIRED_INTELLIGENCE_BACKUP_CLASSES, encrypted: true, integrityVerified: true, retentionPolicyRef: "ret", keyStrategyRef: "key-ref-only", createdAt: "2026-10-26T00:00:00Z" }));
});

test("P14.2 restore enforces current revocation privacy policy", () => {
  const result = recovery.restoreUnderCurrentPolicy([{ id: "a", kind: "method", state: "active", privacyAllowed: true, policyAllowed: true, payloadRef: "p" }, { id: "b", kind: "promotion", state: "revoked", privacyAllowed: true, policyAllowed: true, payloadRef: "q" }]);
  assert.deepEqual(result.restored.map((value) => value.id), ["a"]);
  assert.deepEqual(result.rejected, ["b"]);
});

test("P14.3 migration rollback preserves erasure", () => {
  const result = recovery.dryRunMigration([{ id: "a", sourceVersion: 1, targetVersion: 2, erased: false, historyRefs: ["h"], identityRef: "i" }, { id: "gone", sourceVersion: 1, targetVersion: 2, erased: true, historyRefs: ["h2"], identityRef: "i2" }, { id: "fail", sourceVersion: 1, targetVersion: 2, erased: false, historyRefs: ["h3"], identityRef: "i3" }], "fail");
  assert.equal(result.status, "rolled_back");
  assert.equal(result.erasurePreserved, true);
});

test("P14.4 replacement default-denies unavailable paid/unknown or incompatible candidates", () => {
  const result = recovery.evaluateReplacement({ kind: "model", candidateRef: "m", available: true, costKnownFree: false, compatible: false, dependentRefs: ["d"] });
  assert.equal(result.activatable, false);
  assert.deepEqual(result.invalidatedDependents, ["d"]);
});

test("P14.5 historical recovery keeps unavailable CCR evidence visible", () => {
  const result = recovery.auditHistoricalRecovery({ processedRefs: ["a"], conflicts: [], privacyExclusions: [], missingArtifacts: [], lineageRefs: ["l"], originalCcrAvailable: false });
  assert.equal(result.complete, false);
  assert.ok(result.blockers.includes("original_ccr_ledger_unavailable"));
});

test("P14.6 scale accepts bounded backpressure but never loss or budget overrun", () => {
  assert.equal(recovery.validateScaleWorkload({ baselineUnits: 100, multiplier: 100, accepted: 9000, backpressured: 1000, lost: 0, resourceBudgetUnits: 100, resourceUsedUnits: 90 }).pass, true);
  assert.equal(recovery.validateScaleWorkload({ baselineUnits: 10, multiplier: 10, accepted: 99, backpressured: 0, lost: 1, resourceBudgetUnits: 10, resourceUsedUnits: 10 }).pass, false);
});

test("P14.7 dormant reactivation requires ordered CONFIGURE CONNECT AUTHORIZE ENABLE", () => {
  assert.equal(recovery.validateDormantReactivation({ ref: "x", revalidated: true, obsolete: false, completedStages: ["configure", "connect", "authorize", "enable"] }).enabled, true);
  assert.throws(() => recovery.validateDormantReactivation({ ref: "x", revalidated: false, obsolete: false, completedStages: [] }));
});

test("P14.8 synthetic multi-user seam proves separation without activating multi-user product", () => {
  assert.equal(recovery.validateSyntheticTenantBoundary([{ tenantRef: "synthetic:a", roleRef: "owner", privateDataRef: "synthetic:data-a" }, { tenantRef: "synthetic:b", roleRef: "viewer", privateDataRef: "synthetic:data-b" }], false), true);
  assert.throws(() => recovery.validateSyntheticTenantBoundary([], true));
});

test("P14.9 synthetic public fork excludes private credentials and owner policy and never publishes", () => {
  assert.deepEqual(recovery.buildSyntheticPublicFork([{ ref: "pub", classification: "public" }, { ref: "priv", classification: "private" }, { ref: "cred", classification: "credential" }, { ref: "owner", classification: "owner_policy" }], false), ["pub"]);
  assert.throws(() => recovery.buildSyntheticPublicFork([], true));
});

test("P14.10 future interface seam reuses canonical intent policy data and removes cleanly", () => {
  assert.equal(recovery.validateFutureInterfaceSeam({ id: "synthetic:voice", usesCanonicalIntent: true, usesPolicy: true, usesCanonicalData: true, removable: true, productionActivated: false }), true);
});

test("P14.11 isolated chaos drill requires observed fencing recovery resume and no production egress", () => {
  assert.equal(recovery.validateChaosDrill({ failure: "worker", syntheticOrCopiedData: true, stateProvenanceRef: "s", versionRef: "v", productionEgress: false, fenced: true, recovered: true, resumed: true, observedAt: "2026-10-26T00:00:00Z" }).pass, true);
  assert.throws(() => recovery.validateChaosDrill({ failure: "provider", syntheticOrCopiedData: true, stateProvenanceRef: "s", versionRef: "v", productionEgress: true, fenced: true, recovered: true, resumed: true, observedAt: "2026-10-26T00:00:00Z" }));
});

test("P14.12 long-horizon lifecycle leaves no orphan authority/data and never labels simulation as real", () => {
  const actions = ["create", "use", "fail", "recover", "migrate", "disable", "remove"];
  const events = actions.map((action, index) => ({ entityRef: "synthetic:e", action, synthetic: true, outcomeClass: "simulation", authorityRefs: index === 6 ? [] : ["a"], dataRefs: index === 6 ? [] : ["d"] }));
  assert.equal(recovery.validateLongHorizonLifecycle(events), true);
  events[1] = { ...events[1], outcomeClass: "observed" };
  assert.throws(() => recovery.validateLongHorizonLifecycle(events));
});
