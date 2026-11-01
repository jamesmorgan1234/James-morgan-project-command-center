import test from "node:test";
import assert from "node:assert/strict";
import {
  assertOwnerAction,
  auditHistoryChannel,
  deletionPreview,
  assertDeletionConfirmed,
  deletionMode,
  assertPurgeElevated,
  purgeAuditEvent,
  anonymizeFields,
  redactFields,
  redactionTrail,
  inheritClassification,
  assertNoDowngrade,
  assertScopedExport,
  assertProjectScope,
  voiceTranscriptSensitivity,
  assertVoiceRecordingsNotRetained,
  assertProviderRetentionSurfaced,
  providerPrivacyReview,
  assertNoOwnerPiiInDiagnostics,
  assertNoPublicProjectEndpoint,
  sharingDefault,
  assertExplicitCollaborationRoles,
  assertPublicLinkIsolated,
  assertShareLinkUnexpired
} from "../dist/security/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const T1 = "2026-11-30T10:00:00.000Z";
const sensitive = { key: "bankBalance", classification: "sensitive" };
const secret = { key: "apiToken", classification: "secret" };
const publicField = { key: "headline", classification: "public" };

test("P7.2 owner can correct data", () => {
  assert.doesNotThrow(() => assertOwnerAction("owner", "correct"));
  assert.throws(() => assertOwnerAction("agent", "correct"), /Only the owner/);
});

test("P7.2 owner can archive data", () => {
  assert.doesNotThrow(() => assertOwnerAction("owner", "archive"));
  assert.throws(() => assertOwnerAction("viewer", "archive"), /Only the owner/);
});

test("P7.2 owner can export data", () => {
  assert.doesNotThrow(() => assertOwnerAction("owner", "export"));
});

test("P7.2 owner can request deletion", () => {
  assert.doesNotThrow(() => assertOwnerAction("owner", "delete"));
  assert.throws(() => assertOwnerAction("integration", "delete"), /Only the owner/);
});

test("P7.2 protected audit history is separate from project notes", () => {
  assert.equal(auditHistoryChannel("audit"), "protected");
  assert.equal(auditHistoryChannel("note"), "editable");
});

test("P7.2 deletion impact preview", () => {
  const preview = deletionPreview({ entity: "project:p1", dependencies: ["invoice:9"], critical: true });
  assert.deepEqual([...preview.impact], ["invoice:9"]);
  assert.equal(preview.requiresConfirmation, true);
});

test("P7.2 deletion dependency check", () => {
  const preview = deletionPreview({ entity: "project:p1", dependencies: ["invoice:9"], critical: true });
  assert.equal(preview.blocked, true);
  assert.throws(() => assertDeletionConfirmed(preview, true), /blocked by dependencies/);
});

test("P7.2 destructive delete requires explicit confirmation", () => {
  const preview = deletionPreview({ entity: "note:n1", dependencies: [], critical: false });
  assert.throws(() => assertDeletionConfirmed(preview, false), /explicit confirmation/);
  assert.doesNotThrow(() => assertDeletionConfirmed(preview, true));
});

test("P7.2 soft delete is the default for critical entities", () => {
  assert.equal(deletionMode(true), "soft");
  assert.equal(deletionMode(false), "purge");
});

test("P7.2 purge requires elevated action", () => {
  assert.doesNotThrow(() => assertPurgeElevated("owner", true));
  assert.throws(() => assertPurgeElevated("owner", false), /elevated explicit action/);
  assert.throws(() => assertPurgeElevated("agent", true), /requires the owner/);
});

test("P7.2 purge writes an audit event", () => {
  const event = purgeAuditEvent("project:p1", "owner", T0);
  assert.equal(event.action, "purge");
  assert.throws(() => purgeAuditEvent(" ", "owner", T0), /requires entity and actor/);
});

test("P7.2 anonymization option for shared exports", () => {
  const anonymized = anonymizeFields([publicField, sensitive, secret]);
  assert.deepEqual(anonymized.map((entry) => entry.value), ["[kept]", "[anonymized]", "[anonymized]"]);
});

test("P7.2 redaction framework", () => {
  const redacted = redactFields([publicField, sensitive, secret], ["bankBalance", "apiToken"]);
  assert.deepEqual(redacted, [{ key: "headline", redacted: false }, { key: "bankBalance", redacted: true }, { key: "apiToken", redacted: true }]);
  assert.throws(() => redactFields([publicField], []), /at least one target/);
});

test("P7.2 redaction audit trail", () => {
  const trail = redactionTrail([{ key: "bankBalance", at: T0 }]);
  assert.equal(trail.length, 1);
  assert.throws(() => redactionTrail([]), /requires entries/);
});

test("P7.2 derived outputs inherit classification", () => {
  assert.equal(inheritClassification("private", "sensitive"), "sensitive");
  assert.equal(inheritClassification("secret", "public"), "secret");
});

test("P7.2 brain cannot downgrade sensitivity", () => {
  assert.doesNotThrow(() => assertNoDowngrade("sensitive", "secret"));
  assert.throws(() => assertNoDowngrade("sensitive", "public"), /cannot be downgraded/);
});

test("P7.2 integration export requires scope permission", () => {
  assert.doesNotThrow(() => assertScopedExport(["public", "sensitive"], sensitive));
  assert.throws(() => assertScopedExport(["public"], sensitive), /lacks scope permission/);
});

test("P7.2 agent cannot use sensitive data outside project scope", () => {
  assert.doesNotThrow(() => assertProjectScope("p1", "p1"));
  assert.throws(() => assertProjectScope("p1", "p2"), /outside its scope/);
});

test("P7.2 voice transcript sensitivity matches content", () => {
  assert.equal(voiceTranscriptSensitivity("sensitive"), "sensitive");
  assert.equal(voiceTranscriptSensitivity("public"), "public");
});

test("P7.2 voice recordings are not retained unnecessarily", () => {
  assert.doesNotThrow(() => assertVoiceRecordingsNotRetained(false));
  assert.throws(() => assertVoiceRecordingsNotRetained(true), /must not retain voice recordings/);
});

test("P7.2 provider retention policy is surfaced before use", () => {
  assert.doesNotThrow(() => assertProviderRetentionSurfaced(true));
  assert.throws(() => assertProviderRetentionSurfaced(false), /must be surfaced/);
});

test("P7.2 provider privacy change triggers review recommendation", () => {
  assert.equal(providerPrivacyReview("v1", "v2"), "review_recommended");
  assert.equal(providerPrivacyReview("v1", "v1"), "none");
});

test("P7.2 owner personal information is absent from diagnostics", () => {
  assert.doesNotThrow(() => assertNoOwnerPiiInDiagnostics([publicField]));
  assert.throws(() => assertNoOwnerPiiInDiagnostics([publicField, sensitive]), /must not appear in diagnostics/);
});

test("P7.2 no public endpoint returns owner project data", () => {
  assert.doesNotThrow(() => assertNoPublicProjectEndpoint([]));
  assert.throws(() => assertNoPublicProjectEndpoint(["/api/public/projects"]), /must not return owner project data/);
});

test("P7.2 sharing is default-deny", () => {
  assert.equal(sharingDefault(false), "deny");
  assert.throws(() => sharingDefault(true), /default-deny/);
});

test("P7.2 collaboration requires explicit per-role sharing", () => {
  assert.doesNotThrow(() => assertExplicitCollaborationRoles(["viewer"]));
  assert.throws(() => assertExplicitCollaborationRoles([]), /explicit per-role sharing/);
});

test("P7.2 public links are isolated from private context", () => {
  assert.doesNotThrow(() => assertPublicLinkIsolated({ publicContext: true }));
  assert.throws(() => assertPublicLinkIsolated({ publicContext: false }), /isolated from private application context/);
});

test("P7.2 share links expire", () => {
  assert.doesNotThrow(() => assertShareLinkUnexpired(T1, T0));
  assert.throws(() => assertShareLinkUnexpired(T0, T1), /expired/);
});
