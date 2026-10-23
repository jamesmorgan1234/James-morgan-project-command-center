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

export function recoveryComplete(report: HistoricalRecoveryReport): boolean {
  if (!report.sourceSetId.trim() || report.sourceRefs.length === 0) return false;
  if (report.expectedConversations < 0 || report.processedConversations !== report.expectedConversations) return false;
  return report.unresolvedUnknowns.length === 0;
}

export function validateRecoveryReport(report: HistoricalRecoveryReport): HistoricalRecoveryReport {
  if (report.processedConversations > report.expectedConversations || report.messageNodes < 0 || report.branchPoints < 0 || report.projectContainers < 0) throw new Error("invalid historical recovery counts");
  return Object.freeze({ ...report, candidateProjects: Object.freeze([...report.candidateProjects]), conflicts: Object.freeze([...report.conflicts]), privacyExclusions: Object.freeze([...report.privacyExclusions]), missingArtifacts: Object.freeze([...report.missingArtifacts]), unresolvedUnknowns: Object.freeze([...report.unresolvedUnknowns]), sourceRefs: Object.freeze([...report.sourceRefs]) });
}
