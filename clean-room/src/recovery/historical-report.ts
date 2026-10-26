export interface HistoricalRecoveryReport {
  readonly sourceSetId: string;
  readonly expectedConversations: number;
  readonly processedConversations: number;
  readonly messageNodes: number;
  readonly branchPoints: number;
  readonly projectContainers: number;
  readonly candidateProjects: readonly string[];
  readonly conflicts: readonly string[];
  readonly privacyExclusions: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly unresolvedUnknowns: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface HistoricalRecoveryCoverage {
  readonly sourceScopeProcessed: true;
  readonly unresolvedConflicts: true;
  readonly candidateProjects: true;
  readonly missingArtifacts: true;
  readonly renameLineage: true;
  readonly mergeLineage: true;
  readonly supersessionLineage: true;
  readonly privacyExclusions: true;
  readonly unresolvedUnknowns: true;
  readonly recoveryEvidence: true;
}

export interface HistoricalRecoveryCompletenessReport extends HistoricalRecoveryReport {
  readonly renameLineage: readonly string[];
  readonly mergeLineage: readonly string[];
  readonly supersessionLineage: readonly string[];
  readonly recoveryEvidenceRefs: readonly string[];
  readonly coverage: HistoricalRecoveryCoverage;
}

export function recoveryComplete(report: HistoricalRecoveryReport): boolean {
  if (!report.sourceSetId.trim() || report.sourceRefs.length === 0) return false;
  if (report.expectedConversations < 0 || report.processedConversations !== report.expectedConversations) return false;
  return report.unresolvedUnknowns.length === 0;
}

export function validateRecoveryReport(report: HistoricalRecoveryReport): HistoricalRecoveryReport {
  if (report.processedConversations > report.expectedConversations || report.messageNodes < 0 || report.branchPoints < 0 || report.projectContainers < 0) throw new Error("invalid historical recovery counts");
  return Object.freeze({ ...report, candidateProjects: Object.freeze([...report.candidateProjects]), conflicts: Object.freeze([...report.conflicts]), privacyExclusions: Object.freeze([...report.privacyExclusions]), missingArtifacts: Object.freeze([...report.missingArtifacts]), unresolvedUnknowns: Object.freeze([...report.unresolvedUnknowns]), sourceRefs: Object.freeze([...report.sourceRefs]) });
}

function allCoverageTrue(coverage: HistoricalRecoveryCoverage): boolean {
  return Object.values(coverage).every((value) => value === true);
}

function requireUniqueNonBlank(values: readonly string[], label: string, allowEmpty = false): readonly string[] {
  const normalized = values.map((value) => value.trim());
  if ((!allowEmpty && normalized.length === 0) || normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

export function validateRecoveryCompletenessReport(report: HistoricalRecoveryCompletenessReport): HistoricalRecoveryCompletenessReport {
  const base = validateRecoveryReport(report);
  if (!allCoverageTrue(report.coverage)) throw new Error("historical recovery completeness report must explicitly cover every required dimension");
  const recoveryEvidenceRefs = requireUniqueNonBlank(report.recoveryEvidenceRefs, "historical recovery evidence refs");
  return Object.freeze({
    ...base,
    renameLineage: requireUniqueNonBlank(report.renameLineage, "rename lineage", true),
    mergeLineage: requireUniqueNonBlank(report.mergeLineage, "merge lineage", true),
    supersessionLineage: requireUniqueNonBlank(report.supersessionLineage, "supersession lineage", true),
    recoveryEvidenceRefs,
    coverage: Object.freeze({ ...report.coverage })
  });
}

export function recoveryCompletenessReportComplete(report: HistoricalRecoveryCompletenessReport): boolean {
  const valid = validateRecoveryCompletenessReport(report);
  return recoveryComplete(valid) && valid.recoveryEvidenceRefs.length > 0 && allCoverageTrue(valid.coverage);
}
