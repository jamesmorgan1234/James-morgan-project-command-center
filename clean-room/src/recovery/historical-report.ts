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
  return ["sourceScopeProcessed","unresolvedConflicts","candidateProjects","missingArtifacts","renameLineage","mergeLineage","supersessionLineage","privacyExclusions","unresolvedUnknowns","recoveryEvidence"].every(key => (coverage as unknown as Record<string,unknown>)[key] === true);
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

import type {HistoricalImportStage} from '../data/historical-export.js';
import {validateConversationGraph,buildHistoricalLineageIndex} from '../data/historical-lineage.js';
import {assertRecoveryAccess,assertRecoveryEvidence,recoveryDigest,recoveryImmutable,recoveryJson,recoveryList,recoveryRef,requireRecovery,type RecoveryAccess,type RecoveryScope} from './contracts.js';
export interface HistoricalRecoveryManifest {readonly id:string;readonly scope:RecoveryScope;readonly expectedConversationIds:readonly string[];readonly expectedStageDigest:string;readonly sourceRefs:readonly string[];readonly evidenceIds:readonly string[]}
/** CCR-05852 report matches the actual staged graph, rather than caller-supplied counts. */
export async function auditStagedHistoricalRecovery(a:RecoveryAccess,m:HistoricalRecoveryManifest,stage:HistoricalImportStage,report:HistoricalRecoveryCompletenessReport){assertRecoveryAccess(a,'read',m.scope,m.id);assertRecoveryEvidence(a,m.scope,m.evidenceIds);recoveryList(m.expectedConversationIds,true);recoveryList(m.sourceRefs,true);requireRecovery(m.id===stage.batchId&&report.sourceSetId===m.id&&m.expectedStageDigest===await recoveryDigest(stage),'historical_source_manifest_mismatch');const valid=validateRecoveryCompletenessReport(report),actualIds=stage.conversations.map(c=>c.conversationId);recoveryList(actualIds,true);requireRecovery(recoveryJson([...actualIds].sort())===recoveryJson([...m.expectedConversationIds].sort())&&stage.conversationCount===actualIds.length,'historical_scope_incomplete');let nodes=0,branches=0,redacted=0;const privacyRefs:string[]=[];for(const c of stage.conversations){const graph=validateConversationGraph(c);requireRecovery(graph.valid,'historical_graph_invalid');nodes+=c.nodes.length;branches+=graph.branchPoints.length;for(const n of c.nodes)if(n.contentState==='redact'){redacted++;privacyRefs.push(c.conversationId+':'+n.id);}}const containers=buildHistoricalLineageIndex(stage.conversations).containers.length;requireRecovery(stage.nodeCount===nodes&&stage.redactedNodeCount===redacted&&valid.messageNodes===nodes&&valid.branchPoints===branches&&valid.projectContainers===containers&&valid.processedConversations===actualIds.length&&valid.expectedConversations===m.expectedConversationIds.length,'historical_report_count_mismatch');requireRecovery(recoveryJson([...valid.sourceRefs].sort())===recoveryJson([...m.sourceRefs].sort())&&privacyRefs.every(ref=>valid.privacyExclusions.includes(ref)),'historical_provenance_or_privacy_omitted');const unresolved=[...valid.conflicts,...valid.missingArtifacts,...valid.unresolvedUnknowns];assertRecoveryAccess(a,'read',m.scope,m.id);return recoveryImmutable({schemaVersion:1,requirementId:'CCR-05852',scope:m.scope,sourceSetId:m.id,stageDigest:m.expectedStageDigest,processedScopeComplete:true,allArtifactsRecovered:unresolved.length===0,unresolved,originalVsReconstruction:'report_preserves_source_classification',report:valid,summary:{conversations:actualIds.length,nodes,branches,containers,redacted},productionImported:false,authorityGranted:false});}
