import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveClaimPrecedence,
  scanContradictions,
  explainContradiction,
  proposeConflictResolution,
  assertNoSilentOwnerConflictResolution,
  assertSupportedMemoryClaim,
  classifySourceAvailability,
  ownerInputRequired,
  prefersLiveSource,
  recommendationCooldown
} from "../dist/brain/index.js";

const T1 = "2026-10-30T10:00:00.000Z";
const T2 = "2026-10-31T10:00:00.000Z";

function claim(id, source, fingerprint, assertedAt = T1, subjectRef = "metric:revenue") {
  return { id, source, subjectRef, valueFingerprint: fingerprint, assertedAt };
}

test("P6.15 owner corrections outrank brain inference and hypotheses", () => {
  const resolution = resolveClaimPrecedence([
    claim("inference", "brain_inference", "1234"),
    claim("correction", "owner_correction", "1200"),
    claim("hypothesis", "brain_hypothesis", "900")
  ]);
  assert.equal(resolution.selectedId, "correction");
  assert.equal(resolution.reason, "owner_authority");
  assert.deepEqual(resolution.conflictingIds, ["inference", "hypothesis"]);
});

test("P6.15 newer explicit owner instruction supersedes older conflicting instruction", () => {
  const resolution = resolveClaimPrecedence([
    claim("older", "owner_instruction", "weekly", T1),
    claim("newer", "owner_instruction", "daily", T2)
  ]);
  assert.equal(resolution.selectedId, "newer");
  assert.equal(resolution.requiresOwnerResolution, false);
  assert.deepEqual(resolution.conflictingIds, ["older"]);
});

test("P6.15 contradictory claims are scanned before context assembly", () => {
  const contradictions = scanContradictions([
    { id: "a", subjectRef: "metric:revenue", valueFingerprint: "100" },
    { id: "b", subjectRef: "metric:revenue", valueFingerprint: "200" },
    { id: "c", subjectRef: "metric:cost", valueFingerprint: "50" }
  ]);
  assert.equal(contradictions.length, 1);
  assert.deepEqual(contradictions[0].claimIds, ["a", "b"]);
  assert.match(contradictions[0].explanation, /disagree about metric:revenue/);
  assert.equal(scanContradictions([
    { id: "a", subjectRef: "metric:revenue", valueFingerprint: "100" },
    { id: "b", subjectRef: "metric:revenue", valueFingerprint: "100" }
  ]).length, 0);
});

test("P6.15 contradictions are explainable with both claim identities", () => {
  const explanation = explainContradiction(
    { id: "a", subjectRef: "metric:revenue", valueFingerprint: "100" },
    { id: "b", subjectRef: "metric:revenue", valueFingerprint: "200" }
  );
  assert.deepEqual(explanation.claimIds, ["a", "b"]);
  assert.equal(explanation.subjectRef, "metric:revenue");
  assert.throws(() => explainContradiction(
    { id: "a", subjectRef: "metric:revenue", valueFingerprint: "100" },
    { id: "b", subjectRef: "metric:revenue", valueFingerprint: "100" }
  ), /not a contradiction/);
});

test("P6.15 conflict resolution is proposed but never silently applied", () => {
  const tied = resolveClaimPrecedence([
    claim("one", "owner_instruction", "weekly", T1),
    claim("two", "owner_instruction", "daily", T1)
  ]);
  assert.equal(tied.requiresOwnerResolution, true);
  assert.throws(() => assertNoSilentOwnerConflictResolution(tied, false), /cannot be resolved silently/);
  assert.doesNotThrow(() => assertNoSilentOwnerConflictResolution(tied, true));
  const proposal = proposeConflictResolution([claim("one", "owner_instruction", "weekly", T1), claim("two", "owner_instruction", "daily", T1)]);
  assert.equal(proposal.requiresOwnerApproval, true);
  assert.equal(proposal.applied, false);
});

test("P6.15 unsupported memory claims are refused", () => {
  assert.doesNotThrow(() => assertSupportedMemoryClaim({ supported: true, sources: ["evd:source"] }));
  assert.throws(() => assertSupportedMemoryClaim({ supported: false, sources: ["evd:source"] }), /cannot claim it remembers/);
  assert.throws(() => assertSupportedMemoryClaim({ supported: true, sources: [] }), /cannot claim it remembers/);
});

test("P6.15 owner input is requested only for genuinely missing truth", () => {
  assert.equal(ownerInputRequired("missing_source"), true);
  assert.equal(ownerInputRequired("negative_result"), false);
  assert.equal(ownerInputRequired("unavailable_tool"), false);
  assert.equal(ownerInputRequired("stale_source"), false);
});

test("P6.15 source availability distinguishes missing, absent, unavailable, stale and current", () => {
  const base = { sourceExists: true, toolAvailable: true, querySucceeded: true, stale: false, resultCount: 1 };
  assert.equal(classifySourceAvailability(base), "current_source");
  assert.equal(classifySourceAvailability({ ...base, resultCount: 0 }), "negative_result");
  assert.equal(classifySourceAvailability({ ...base, sourceExists: false }), "missing_source");
  assert.equal(classifySourceAvailability({ ...base, toolAvailable: false }), "unavailable_tool");
  assert.equal(classifySourceAvailability({ ...base, querySucceeded: false }), "unavailable_tool");
  assert.equal(classifySourceAvailability({ ...base, stale: true }), "stale_source");
  assert.throws(() => classifySourceAvailability({ ...base, resultCount: -1 }), /non-negative result count/);
});

test("P6.15 live source is preferred over stale memory", () => {
  assert.equal(prefersLiveSource("current_source"), true);
  assert.equal(prefersLiveSource("negative_result"), true);
  assert.equal(prefersLiveSource("stale_source"), false);
  assert.equal(prefersLiveSource("missing_source"), false);
});

test("P6.15 recommendation cooldown prevents repeated presentation", () => {
  const history = [{ recommendationKey: "raise-price", presentedAt: T2 }];
  const blocked = recommendationCooldown(history, "raise-price", "2026-11-01T10:00:00.000Z", 48 * 60 * 60 * 1000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.remainingMs > 0);
  const allowed = recommendationCooldown(history, "raise-price", "2026-11-05T10:00:00.000Z", 48 * 60 * 60 * 1000);
  assert.equal(allowed.allowed, true);
  assert.equal(recommendationCooldown(history, "other", "2026-11-01T10:00:00.000Z", 60000).allowed, true);
  assert.throws(() => recommendationCooldown(history, "raise-price", "bad-date", 60000), /valid time/);
});
