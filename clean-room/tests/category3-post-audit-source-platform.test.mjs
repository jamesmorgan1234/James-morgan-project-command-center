import test from "node:test";
import assert from "node:assert/strict";
import {
  DerivedLifecycleRegistry,
  ProviderCapabilityLedger,
  ProvenanceLedger,
  RefreshLeaseManager,
  SourceRegistry,
  classifyRefresh,
  compareSourceAuthority,
  createContextSnapshot,
  evaluateCoverage,
  evaluateEnumerationStability,
  fairRefreshOrder
} from "../dist/data/index.js";

const T0 = "2026-10-25T00:00:00Z";
const T1 = "2026-10-25T00:01:00Z";
const T2 = "2026-10-25T00:02:00Z";

function source(overrides = {}) {
  return {
    id: "source:chat-1",
    providerKey: "provider:chat",
    sourceType: "conversation",
    externalStableId: "chat-stable-1",
    scope: { ownerId: "owner-1", companyId: "company-101", projectId: "project-101", environment: "staging" },
    trust: "historical_evidence",
    instructionPolicy: "data_only",
    sensitivity: "sensitive",
    purpose: ["project_context"],
    retentionClass: "owner_history",
    lifecycle: "active",
    version: 1,
    createdAt: T0,
    updatedAt: T0,
    ...overrides
  };
}

const enumeration = {
  enumerateAll: "verified_supported",
  stableIds: "verified_supported",
  updatedMetadata: "verified_supported",
  revisionIds: "unverified",
  contentHashes: "verified_supported",
  deltaFetch: "unverified",
  deletionDetection: "verified_supported",
  stablePagination: "verified_supported"
};

test("source registry uses stable provider identity and historical/untrusted content cannot grant instruction authority", () => {
  const registry = new SourceRegistry();
  registry.register(source());
  assert.throws(() => registry.register(source({ id: "source:duplicate" })));
  assert.throws(() => registry.register(source({ id: "source:bad", externalStableId: "chat-bad", trust: "untrusted_external", instructionPolicy: "owner_statement_candidate" })));
  assert.throws(() => registry.register(source({ id: "source:historical-bad", externalStableId: "chat-historical-bad", trust: "historical_evidence", instructionPolicy: "owner_statement_candidate" })));
});

test("source authority prefers stronger authority but abstains on equal authority or different scope", () => {
  const historical = source();
  const verified = source({ id: "source:verified", externalStableId: "verified", trust: "verified_provider", instructionPolicy: "data_only" });
  assert.equal(compareSourceAuthority(historical, verified).action, "prefer_right");
  assert.equal(compareSourceAuthority(historical, source({ id: "source:other", externalStableId: "other" })).action, "abstain_conflict");
  assert.equal(compareSourceAuthority(historical, source({ id: "source:other-company", externalStableId: "other-company", scope: { ownerId: "owner-1", companyId: "company-102", projectId: "project-101", environment: "staging" } })).reason, "different_scope_cannot_be_ranked");
});

test("provenance separates observed effective and ingested time and preserves correction/retraction lineage", () => {
  const ledger = new ProvenanceLedger();
  ledger.append({ id: "observation:o1", sourceId: "source:chat-1", sequence: 1, contentHash: "h1", state: "current", observedAt: T0, effectiveAt: T0, ingestedAt: T1 });
  ledger.append({ id: "observation:o2", sourceId: "source:chat-1", sequence: 2, contentHash: "h2", state: "corrected", observedAt: T1, effectiveAt: T0, ingestedAt: T2, supersedes: "observation:o1", reason: "source_edit" });
  assert.equal(ledger.history("source:chat-1")[0].state, "superseded");
  assert.equal(ledger.current("source:chat-1").id, "observation:o2");
  ledger.append({ id: "observation:o3", sourceId: "source:chat-1", sequence: 3, contentHash: "retracted-hash", state: "retracted", observedAt: T2, effectiveAt: T2, ingestedAt: T2, supersedes: "observation:o2", reason: "source_retracted" });
  assert.equal(ledger.current("source:chat-1"), undefined);
  assert.equal(ledger.latest("source:chat-1").state, "retracted");
});

test("derived lifecycle traces provenance and source invalidation deletes or restricts held derivatives", () => {
  const registry = new DerivedLifecycleRegistry();
  const provenance = [{ observationId: "observation:o2", sourceId: "source:chat-1", contentHash: "h2" }];
  registry.register({ id: "derived:d1", ownerId: "owner-1", companyId: "company-101", projectId: "project-101", purpose: "project_context", retentionClass: "derived_context", state: "active", provenance, createdAt: T0, updatedAt: T0, legalHold: false });
  registry.register({ id: "derived:d2", ownerId: "owner-1", companyId: "company-101", projectId: "project-101", purpose: "legal_hold_context", retentionClass: "derived_context", state: "active", provenance, createdAt: T0, updatedAt: T0, legalHold: true });
  const changed = registry.invalidateByObservation("observation:o2", T1, "upstream_retracted");
  assert.equal(changed.length, 2);
  assert.equal(registry.get("derived:d1").state, "deleted");
  assert.equal(registry.get("derived:d2").state, "restricted");
});

test("same-size or rename-only metadata cannot falsely prove unchanged content", () => {
  const previous = { stableId: "s1", byteSize: 100, title: "old" };
  assert.equal(classifyRefresh(previous, { stableId: "s1", byteSize: 100, title: "new" }), "uncertain");
  assert.equal(classifyRefresh({ stableId: "s1", contentHash: "h1", title: "old" }, { stableId: "s1", contentHash: "h1", title: "new" }), "unchanged");
  assert.equal(classifyRefresh({ stableId: "s1", revisionId: "r1" }, { stableId: "s1", revisionId: "r2" }), "changed");
});

test("paginated enumeration fails closed on cursor drift, source duplication, or changing provider snapshots", () => {
  const stable = evaluateEnumerationStability({
    stablePagination: "verified_supported",
    startFingerprint: "inventory-v1",
    endFingerprint: "inventory-v1",
    pages: [
      { nextCursor: "cursor-2", consistencyToken: "snapshot-1", stableIds: ["a", "b"] },
      { cursor: "cursor-2", consistencyToken: "snapshot-1", stableIds: ["c"] }
    ]
  });
  assert.deepEqual(stable, { complete: true, restartRequired: false, reason: "stable_complete", enumeratedCount: 3 });

  assert.equal(evaluateEnumerationStability({ stablePagination: "verified_supported", pages: [
    { nextCursor: "cursor-2", stableIds: ["a"] },
    { cursor: "different", stableIds: ["b"] }
  ] }).reason, "cursor_chain_changed");

  assert.equal(evaluateEnumerationStability({ stablePagination: "verified_supported", pages: [
    { nextCursor: "cursor-2", stableIds: ["a"] },
    { cursor: "cursor-2", stableIds: ["a"] }
  ] }).reason, "duplicate_source_during_enumeration");

  assert.equal(evaluateEnumerationStability({ stablePagination: "verified_supported", pages: [
    { nextCursor: "cursor-2", consistencyToken: "snapshot-1", stableIds: ["a"] },
    { cursor: "cursor-2", consistencyToken: "snapshot-2", stableIds: ["b"] }
  ] }).reason, "enumeration_changed_during_pagination");

  assert.equal(evaluateEnumerationStability({ stablePagination: "verified_supported", startFingerprint: "inventory-v1", endFingerprint: "inventory-v2", pages: [
    { stableIds: ["a"] }
  ] }).reason, "enumeration_fingerprint_changed");
});

test("multi-page enumeration cannot claim complete when pagination stability is unverified and no consistency token exists", () => {
  const result = evaluateEnumerationStability({
    stablePagination: "unverified",
    pages: [
      { nextCursor: "cursor-2", stableIds: ["a"] },
      { cursor: "cursor-2", stableIds: ["b"] }
    ]
  });
  assert.deepEqual(result, { complete: false, restartRequired: false, reason: "pagination_stability_unverified", enumeratedCount: 2 });
});

test("refresh leases use generations so an expired prior refresher cannot commit", () => {
  const leases = new RefreshLeaseManager();
  const one = leases.acquire("source:chat-1", "worker-a", T0, T1);
  const two = leases.acquire("source:chat-1", "worker-b", T2, "2026-10-25T00:03:00Z");
  assert.equal(two.generation, one.generation + 1);
  assert.throws(() => leases.assertCommit("source:chat-1", "worker-a", one.generation, "2026-10-25T00:02:10Z"));
  assert.doesNotThrow(() => leases.assertCommit("source:chat-1", "worker-b", two.generation, "2026-10-25T00:02:10Z"));
});

test("cold-start coverage accounts for unreadable/tombstoned sources instead of silently dropping them", () => {
  const complete = evaluateCoverage({ enumerationComplete: true, expectedCount: 3, items: [{ stableId: "a", state: "readable" }, { stableId: "b", state: "unreadable", reason: "permission_denied" }, { stableId: "c", state: "tombstone", reason: "provider_deleted" }] });
  assert.deepEqual(complete, { complete: true, readable: 1, unreadable: 1, tombstones: 1, unaccounted: 0 });
  assert.equal(evaluateCoverage({ enumerationComplete: true, expectedCount: 4, items: [{ stableId: "a", state: "readable" }] }).complete, false);
});

test("refresh ordering prioritizes changed/newer work but forces old-item fairness", () => {
  const ordered = fairRefreshOrder([
    { stableId: "new-a", classification: "changed", updatedAt: "2026-10-25T00:10:00Z", lastCheckedAt: "2026-10-25T00:09:00Z" },
    { stableId: "new-b", classification: "changed", updatedAt: "2026-10-25T00:09:00Z", lastCheckedAt: "2026-10-25T00:08:00Z" },
    { stableId: "new-c", classification: "uncertain", updatedAt: "2026-10-25T00:08:00Z", lastCheckedAt: "2026-10-25T00:07:00Z" },
    { stableId: "old", classification: "uncertain", updatedAt: "2026-01-01T00:00:00Z", lastCheckedAt: "2026-01-01T00:00:00Z" },
    { stableId: "skip", classification: "unchanged", updatedAt: "2026-10-25T00:11:00Z" }
  ], 4);
  assert.deepEqual(ordered.map((item) => item.stableId), ["new-a", "new-b", "new-c", "old"]);
});

test("provider capability drift is evidence-backed and regressions/pricing uncertainty fail visibly", () => {
  const ledger = new ProviderCapabilityLedger();
  const first = ledger.record({ id: "provider-snapshot:1", providerKey: "provider:chat", observedAt: T0, apiVersion: "v1", schemaFingerprint: "schema-1", capabilityFingerprint: "caps-1", capabilities: ["enumerate", "fetch"], enumeration, callbacks: "verified_supported", pricing: "free", verification: "live_verified" });
  assert.equal(first.drift, "compatible");
  const unchanged = ledger.record({ id: "provider-snapshot:2", providerKey: "provider:chat", observedAt: T1, apiVersion: "v1", schemaFingerprint: "schema-1", capabilityFingerprint: "caps-1", capabilities: ["enumerate", "fetch"], enumeration, callbacks: "verified_supported", pricing: "free", verification: "live_verified" });
  assert.equal(unchanged.drift, "none");
  const regressed = ledger.record({ id: "provider-snapshot:3", providerKey: "provider:chat", observedAt: T2, apiVersion: "v2", schemaFingerprint: "schema-2", capabilityFingerprint: "caps-2", capabilities: ["fetch"], enumeration: { ...enumeration, enumerateAll: "verified_unsupported" }, callbacks: "verified_supported", pricing: "free", verification: "live_verified" });
  assert.equal(regressed.drift, "breaking");
  assert.equal(ledger.record({ id: "provider-snapshot:4", providerKey: "provider:chat", observedAt: "2026-10-25T00:03:00Z", apiVersion: "v2", schemaFingerprint: "schema-2", capabilityFingerprint: "caps-2", capabilities: ["fetch"], enumeration: { ...enumeration, enumerateAll: "verified_unsupported" }, callbacks: "verified_supported", pricing: "unknown", verification: "live_verified" }).drift, "pricing_unknown");
});

test("context snapshots exclude retracted, stale, cross-company/account/environment and wrong-purpose sources", () => {
  const common = { ownerId: "owner-1", projectId: "project-101", companyId: "company-101", accountId: "acct-1", environment: "staging", version: 1, sensitivity: "sensitive", sourceRef: "source:chat-1", sourceTrust: "verified_provider", purpose: ["project_context"], value: { text: "safe" } };
  const snapshot = createContextSnapshot({ id: "ctx", ownerId: "owner-1", projectId: "project-101", companyId: "company-101", accountId: "acct-1", environment: "staging", purpose: "project_context", createdAt: T2, maxSensitivity: "protected", sources: [
    { id: "ok", ...common },
    { id: "retracted", ...common, retracted: true },
    { id: "stale", ...common, staleAfter: T1 },
    { id: "wrong-company", ...common, companyId: "company-102" },
    { id: "wrong-account", ...common, accountId: "acct-2" },
    { id: "wrong-env", ...common, environment: "production" },
    { id: "wrong-purpose", ...common, purpose: ["analytics"] }
  ] });
  assert.deepEqual(snapshot.sourceIds, ["ok"]);
});
