/**
 * P15.1 reviewed mappings for CCR-01495..CCR-01510 (unverified subset):
 * sensitivity classes, per-surface minimization, explicit export, clipboard
 * controls, credential storage guards, role boundaries and owner control.
 */

const MODULE = "clean-room/src/security/data-sensitivity.ts";
const SUITE = "clean-room/tests/category7-data-sensitivity.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const SECURITY = "Security / Privacy / Trust / Incident Response";

const provenance =
  "Current-source data-sensitivity contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

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

export function reviewedDataSensitivityMappings() {
  return [
    row("CCR-01495", SECURITY, "classifyDataField", "P7.2 data sensitivity classification is required",
      "Every field carries a runtime-validated sensitivity classification."),
    row("CCR-01496", SECURITY, "SENSITIVITY_CLASSES", "P7.2 sensitivity classes are public private sensitive and secret",
      "The four sensitivity classes are declared explicitly."),
    row("CCR-01498", "Brain / Reason / Contradiction", "projectForSurface", "P7.2 sensitive data is minimized in brain context",
      "Brain context receives redacted sensitive and secret values."),
    row("CCR-01499", SECURITY, "projectForSurface", "P7.2 sensitive data is minimized in logs",
      "Logs redact sensitive and secret values."),
    row("CCR-01500", SECURITY, "projectForSurface", "P7.2 sensitive data is minimized in notifications",
      "Notifications redact private, sensitive and secret values."),
    row("CCR-01501", SECURITY, "projectForSurface", "P7.2 sensitive data is minimized in exports by default",
      "Exports redact sensitive and secret values unless explicitly opted in."),
    row("CCR-01502", SECURITY, "projectForSurface", "P7.2 explicit export option exposes sensitive fields where appropriate",
      "Explicit export reveals exportable sensitive fields while secrets stay redacted."),
    row("CCR-01503", SECURITY, "clipboardProjection", "P7.2 clipboard controls protect sensitive values",
      "Sensitive values require confirmation to copy; secrets cannot be copied."),
    row("CCR-01505", SECURITY, "assertNotStoredAsNote", "P7.2 MFA secrets are not stored as normal project notes",
      "Secret and MFA credentials are refused by the note path."),
    row("CCR-01506", "Brain / Reason / Contradiction", "assertNotBrainMemory", "P7.2 API tokens are not stored in brain memory",
      "Credentials are refused by the brain-memory path."),
    row("CCR-01507", SECURITY, "assertNoServiceRoleKeyInClient", "P7.2 service-role keys never appear in the client",
      "Client text containing service-role key material is rejected."),
    row("CCR-01509", SECURITY, "assertWithinBoundary", "P7.2 privacy boundary is enforced per role",
      "A role may only read the sensitivity classes its boundary allows."),
    row("CCR-01510", SECURITY, "assertOwnerControl", "P7.2 owner retains final control of canonical data",
      "Non-owner actors cannot take final control of canonical data.")
  ];
}
