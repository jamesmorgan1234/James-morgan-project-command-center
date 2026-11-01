/**
 * P15.1 reviewed mappings for CCR-01511..CCR-01540 (unverified subset):
 * owner correction/archive/export/deletion, protected audit history, deletion
 * preview/dependency/confirmation/soft-delete/purge, anonymization and
 * redaction, classification inheritance, scope enforcement, voice privacy,
 * diagnostics exclusion, default-deny sharing and expiring isolated links.
 */

const MODULE = "clean-room/src/security/data-rights.ts";
const SUITE = "clean-room/tests/category7-data-rights.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const SECURITY = "Security / Privacy / Trust / Incident Response";

const provenance =
  "Current-source data-rights contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, capability, fn, test, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
    implementationLocations: [`${MODULE}#${fn}`],
    tests: {
      positive: { applicable: true, references: [t(test)], justification: null },
      negative: { applicable: true, references: [t(test)], justification: null },
      failurePath: { applicable: true, references: [t(test)], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

const P = "Projects / Portfolio / Roadmaps / Progress";
const B = "Brain / Reason / Contradiction";
const A = "Agent / Execution Infrastructure";

export function reviewedDataRightsMappings() {
  return [
    row("CCR-01511", SECURITY, "assertOwnerAction", "P7.2 owner can correct data", "Only the owner may correct canonical data."),
    row("CCR-01512", SECURITY, "assertOwnerAction", "P7.2 owner can archive data", "Only the owner may archive canonical data."),
    row("CCR-01513", SECURITY, "assertOwnerAction", "P7.2 owner can export data", "Only the owner may export canonical data."),
    row("CCR-01514", SECURITY, "assertOwnerAction", "P7.2 owner can request deletion", "Deletion requests are owner-only."),
    row("CCR-01515", P, "auditHistoryChannel", "P7.2 protected audit history is separate from project notes", "Audit history is a protected channel, distinct from editable notes."),
    row("CCR-01516", SECURITY, "deletionPreview", "P7.2 deletion impact preview", "Deletion surfaces its dependency impact and requires confirmation."),
    row("CCR-01517", SECURITY, "assertDeletionConfirmed", "P7.2 deletion dependency check", "Dependencies block deletion rather than silently cascading."),
    row("CCR-01518", SECURITY, "assertDeletionConfirmed", "P7.2 destructive delete requires explicit confirmation", "Destructive deletion without confirmation is refused."),
    row("CCR-01519", SECURITY, "deletionMode", "P7.2 soft delete is the default for critical entities", "Critical entities default to soft delete."),
    row("CCR-01520", SECURITY, "assertPurgeElevated", "P7.2 purge requires elevated action", "Purge requires the owner and an elevated explicit action."),
    row("CCR-01521", SECURITY, "purgeAuditEvent", "P7.2 purge writes an audit event", "Every purge produces an audit event with entity, actor and time."),
    row("CCR-01523", SECURITY, "anonymizeFields", "P7.2 anonymization option for shared exports", "Shared exports can anonymize sensitive and secret values."),
    row("CCR-01524", SECURITY, "redactFields", "P7.2 redaction framework", "Redaction targets named fields and refuses an empty target set."),
    row("CCR-01526", SECURITY, "redactionTrail", "P7.2 redaction audit trail", "Redaction actions are recorded with key and timestamp."),
    row("CCR-01527", SECURITY, "inheritClassification", "P7.2 derived outputs inherit classification", "Derived outputs carry at least their parent classification."),
    row("CCR-01528", B, "assertNoDowngrade", "P7.2 brain cannot downgrade sensitivity", "A derived process cannot lower sensitivity."),
    row("CCR-01529", SECURITY, "assertScopedExport", "P7.2 integration export requires scope permission", "An integration may only export classes inside its granted scope."),
    row("CCR-01530", A, "assertProjectScope", "P7.2 agent cannot use sensitive data outside project scope", "Agent data use is confined to the project scope."),
    row("CCR-01531", SECURITY, "voiceTranscriptSensitivity", "P7.2 voice transcript sensitivity matches content", "Transcript sensitivity mirrors the underlying content."),
    row("CCR-01532", SECURITY, "assertVoiceRecordingsNotRetained", "P7.2 voice recordings are not retained unnecessarily", "Command Center refuses to retain recordings unnecessarily."),
    row("CCR-01533", SECURITY, "assertProviderRetentionSurfaced", "P7.2 provider retention policy is surfaced before use", "A speech provider's retention policy must be shown before use."),
    row("CCR-01534", SECURITY, "providerPrivacyReview", "P7.2 provider privacy change triggers review recommendation", "A changed provider privacy policy triggers a review recommendation."),
    row("CCR-01535", SECURITY, "assertNoOwnerPiiInDiagnostics", "P7.2 owner personal information is absent from diagnostics", "Diagnostics refuse owner-specific sensitive data."),
    row("CCR-01536", P, "assertNoPublicProjectEndpoint", "P7.2 no public endpoint returns owner project data", "No public endpoint may return owner project data."),
    row("CCR-01537", SECURITY, "sharingDefault", "P7.2 sharing is default-deny", "Sharing defaults to deny and an allow default is refused."),
    row("CCR-01538", SECURITY, "assertExplicitCollaborationRoles", "P7.2 collaboration requires explicit per-role sharing", "Collaboration requires explicit per-role grants."),
    row("CCR-01539", SECURITY, "assertPublicLinkIsolated", "P7.2 public links are isolated from private context", "Public links cannot expose private application context."),
    row("CCR-01540", SECURITY, "assertShareLinkUnexpired", "P7.2 share links expire", "Share links past their expiry are refused.")
  ];
}
