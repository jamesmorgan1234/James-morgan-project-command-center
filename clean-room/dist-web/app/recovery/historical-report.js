export function recoveryComplete(report) {
    if (!report.sourceSetId.trim() || report.sourceRefs.length === 0)
        return false;
    if (report.expectedConversations < 0 || report.processedConversations !== report.expectedConversations)
        return false;
    return report.unresolvedUnknowns.length === 0;
}
export function validateRecoveryReport(report) {
    if (report.processedConversations > report.expectedConversations || report.messageNodes < 0 || report.branchPoints < 0 || report.projectContainers < 0)
        throw new Error("invalid historical recovery counts");
    return Object.freeze({ ...report, candidateProjects: Object.freeze([...report.candidateProjects]), conflicts: Object.freeze([...report.conflicts]), privacyExclusions: Object.freeze([...report.privacyExclusions]), missingArtifacts: Object.freeze([...report.missingArtifacts]), unresolvedUnknowns: Object.freeze([...report.unresolvedUnknowns]), sourceRefs: Object.freeze([...report.sourceRefs]) });
}
function allCoverageTrue(coverage) {
    return ["sourceScopeProcessed", "unresolvedConflicts", "candidateProjects", "missingArtifacts", "renameLineage", "mergeLineage", "supersessionLineage", "privacyExclusions", "unresolvedUnknowns", "recoveryEvidence"].every(key => coverage[key] === true);
}
function requireUniqueNonBlank(values, label, allowEmpty = false) {
    const normalized = values.map((value) => value.trim());
    if ((!allowEmpty && normalized.length === 0) || normalized.some((value) => !value) || new Set(normalized).size !== normalized.length)
        throw new Error(`${label} must be unique and nonblank`);
    return Object.freeze(normalized);
}
export function validateRecoveryCompletenessReport(report) {
    const base = validateRecoveryReport(report);
    if (!allCoverageTrue(report.coverage))
        throw new Error("historical recovery completeness report must explicitly cover every required dimension");
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
export function recoveryCompletenessReportComplete(report) {
    const valid = validateRecoveryCompletenessReport(report);
    return recoveryComplete(valid) && valid.recoveryEvidenceRefs.length > 0 && allCoverageTrue(valid.coverage);
}
import { validateConversationGraph, buildHistoricalLineageIndex } from '../data/historical-lineage.js';
import { assertRecoveryAccess, assertRecoveryEvidence, recoveryDigest, recoveryImmutable, recoveryJson, recoveryList, requireRecovery } from './contracts.js';
/** CCR-05852 report matches the actual staged graph, rather than caller-supplied counts. */
export async function auditStagedHistoricalRecovery(a, m, stage, report) { assertRecoveryAccess(a, 'read', m.scope, m.id); assertRecoveryEvidence(a, m.scope, m.evidenceIds); recoveryList(m.expectedConversationIds, true); recoveryList(m.sourceRefs, true); requireRecovery(m.id === stage.batchId && report.sourceSetId === m.id && m.expectedStageDigest === await recoveryDigest(stage), 'historical_source_manifest_mismatch'); const valid = validateRecoveryCompletenessReport(report), actualIds = stage.conversations.map(c => c.conversationId); recoveryList(actualIds, true); requireRecovery(recoveryJson([...actualIds].sort()) === recoveryJson([...m.expectedConversationIds].sort()) && stage.conversationCount === actualIds.length, 'historical_scope_incomplete'); let nodes = 0, branches = 0, redacted = 0; const privacyRefs = []; for (const c of stage.conversations) {
    const graph = validateConversationGraph(c);
    requireRecovery(graph.valid, 'historical_graph_invalid');
    nodes += c.nodes.length;
    branches += graph.branchPoints.length;
    for (const n of c.nodes)
        if (n.contentState === 'redact') {
            redacted++;
            privacyRefs.push(c.conversationId + ':' + n.id);
        }
} const containers = buildHistoricalLineageIndex(stage.conversations).containers.length; requireRecovery(stage.nodeCount === nodes && stage.redactedNodeCount === redacted && valid.messageNodes === nodes && valid.branchPoints === branches && valid.projectContainers === containers && valid.processedConversations === actualIds.length && valid.expectedConversations === m.expectedConversationIds.length, 'historical_report_count_mismatch'); requireRecovery(recoveryJson([...valid.sourceRefs].sort()) === recoveryJson([...m.sourceRefs].sort()) && privacyRefs.every(ref => valid.privacyExclusions.includes(ref)), 'historical_provenance_or_privacy_omitted'); const unresolved = [...valid.conflicts, ...valid.missingArtifacts, ...valid.unresolvedUnknowns]; assertRecoveryAccess(a, 'read', m.scope, m.id); return recoveryImmutable({ schemaVersion: 1, requirementId: 'CCR-05852', scope: m.scope, sourceSetId: m.id, stageDigest: m.expectedStageDigest, processedScopeComplete: true, allArtifactsRecovered: unresolved.length === 0, unresolved, originalVsReconstruction: 'report_preserves_source_classification', report: valid, summary: { conversations: actualIds.length, nodes, branches, containers, redacted }, productionImported: false, authorityGranted: false }); }
//# sourceMappingURL=historical-report.js.map