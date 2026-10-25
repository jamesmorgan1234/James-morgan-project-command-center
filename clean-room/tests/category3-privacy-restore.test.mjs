import test from "node:test";
import assert from "node:assert/strict";
import { DerivedPayloadRegistry, evaluateRestoreRevalidation } from "../dist/data/index.js";

const T0 = "2026-10-25T01:00:00Z";
const T1 = "2026-10-25T01:01:00Z";
const T2 = "2026-10-25T01:02:00Z";
const FUTURE = "2026-10-25T02:00:00Z";
const HASH = "a".repeat(64);

function payload(overrides = {}) {
  return {
    ownerId: "owner-1",
    derivedId: "derived:summary-1",
    state: "present",
    payloadRef: "object://derived/summary-1",
    contentHash: HASH,
    keyVersion: 7,
    createdAt: T0,
    updatedAt: T0,
    ...overrides
  };
}

function audit(eventId, recordedAt, reason = "privacy_lifecycle") {
  return { eventId, recordedAt, reason, evidenceRefs: [`evidence:${eventId}`] };
}

function restore(overrides = {}) {
  return {
    now: T1,
    authorizationState: "active",
    authorizationRef: "authorization:restore-1",
    authorizationExpiresAt: FUTURE,
    authorizationPolicyEpoch: 9,
    currentPolicyEpoch: 9,
    privacyState: "allowed",
    keyState: "active",
    applicationState: "valid",
    sourceLifecycle: "active",
    payloadState: "present",
    purposeAllowed: true,
    retentionAllowed: true,
    evidenceRefs: ["evidence:current-auth", "evidence:privacy", "evidence:key"],
    ...overrides
  };
}

test("derived payload erasure preserves metadata-only audit history while removing payload material", () => {
  const registry = new DerivedPayloadRegistry();
  registry.register(payload(), audit("payload-register-1", T0, "derived_created"));
  registry.restrict("owner-1", "derived:summary-1", audit("payload-restrict-1", T1, "privacy_restricted"));
  const erased = registry.erase("owner-1", "derived:summary-1", false, audit("payload-erase-1", T2, "retention_expired"));

  assert.deepEqual(erased, {
    ownerId: "owner-1",
    derivedId: "derived:summary-1",
    state: "erased",
    createdAt: T0,
    updatedAt: T2
  });
  assert.equal("payloadRef" in erased, false);
  assert.equal("contentHash" in erased, false);
  assert.equal("keyVersion" in erased, false);

  const trail = registry.auditTrail("owner-1", "derived:summary-1");
  assert.deepEqual(trail.map((event) => event.action), ["registered", "restricted", "erased"]);
  for (const event of trail) {
    const serialized = JSON.stringify(event);
    assert.equal(serialized.includes("payloadRef"), false);
    assert.equal(serialized.includes("contentHash"), false);
    assert.equal(serialized.includes("keyVersion"), false);
    assert.equal(serialized.includes("object://derived/summary-1"), false);
    assert.equal(serialized.includes(HASH), false);
  }
});

test("legal hold blocks payload erasure and audit events require unique evidence", () => {
  const registry = new DerivedPayloadRegistry();
  registry.register(payload(), audit("payload-register-2", T0));
  assert.throws(() => registry.erase("owner-1", "derived:summary-1", true, audit("payload-erase-held", T1)), /Legal hold blocks/);
  assert.equal(registry.get("owner-1", "derived:summary-1").state, "present");
  assert.throws(
    () => registry.restrict("owner-1", "derived:summary-1", { eventId: "payload-bad-evidence", recordedAt: T1, reason: "restriction", evidenceRefs: ["same", "same"] }),
    /must be unique/
  );
});

test("restore becomes active only after current authorization privacy key application source purpose and retention truth all pass", () => {
  const decision = evaluateRestoreRevalidation(restore());
  assert.equal(decision.status, "active");
  assert.equal(decision.reason, "current_authority_and_privacy_revalidated");
});

test("restore denies revoked missing expired or stale-policy authorization", () => {
  const cases = [
    [restore({ authorizationState: "revoked" }), "authorization_revoked"],
    [restore({ authorizationState: "missing", authorizationRef: undefined, authorizationExpiresAt: undefined, authorizationPolicyEpoch: undefined }), "authorization_missing"],
    [restore({ authorizationExpiresAt: T1 }), "authorization_expired"],
    [restore({ authorizationPolicyEpoch: 8 }), "authorization_policy_epoch_stale"],
    [restore({ authorizationRef: "" }), "authorization_reference_missing"]
  ];
  for (const [input, reason] of cases) {
    const decision = evaluateRestoreRevalidation(input);
    assert.equal(decision.status, "denied");
    assert.equal(decision.reason, reason);
  }
});

test("restore denies deleted privacy erased payload revoked key tombstoned source invalid app or obsolete purpose/retention", () => {
  const cases = [
    [restore({ privacyState: "deleted" }), "privacy_deleted"],
    [restore({ payloadState: "erased" }), "payload_erased"],
    [restore({ keyState: "revoked" }), "key_revoked"],
    [restore({ keyState: "missing" }), "key_missing"],
    [restore({ sourceLifecycle: "tombstoned" }), "source_tombstoned"],
    [restore({ applicationState: "invalid" }), "application_state_invalid"],
    [restore({ applicationState: "unknown" }), "application_state_unknown"],
    [restore({ purposeAllowed: false }), "purpose_no_longer_allowed"],
    [restore({ retentionAllowed: false }), "retention_no_longer_allowed"]
  ];
  for (const [input, reason] of cases) {
    const decision = evaluateRestoreRevalidation(input);
    assert.equal(decision.status, "denied");
    assert.equal(decision.reason, reason);
  }
});

test("restore keeps data restricted when current truth permits retention but not normal active use", () => {
  const cases = [
    [restore({ privacyState: "restricted" }), "privacy_restricted"],
    [restore({ payloadState: "restricted" }), "payload_restricted"],
    [restore({ keyState: "decrypt_only" }), "key_decrypt_only"],
    [restore({ sourceLifecycle: "degraded" }), "source_degraded"],
    [restore({ sourceLifecycle: "unavailable" }), "source_unavailable"]
  ];
  for (const [input, reason] of cases) {
    const decision = evaluateRestoreRevalidation(input);
    assert.equal(decision.status, "restricted");
    assert.equal(decision.reason, reason);
  }
});

test("restore fails closed when current evidence is absent blank or duplicated", () => {
  for (const evidenceRefs of [[], [""], ["evidence:one", "evidence:one"]]) {
    const decision = evaluateRestoreRevalidation(restore({ evidenceRefs }));
    assert.equal(decision.status, "denied");
    assert.equal(decision.reason, "restore_evidence_missing_or_invalid");
  }
});
