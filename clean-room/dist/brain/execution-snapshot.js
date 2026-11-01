export function freezeExecutionSnapshot(proposal, authorizationRef, snapshotId) {
    if (!authorizationRef.trim() || !snapshotId.trim())
        throw new Error("Execution snapshot requires authorization and stable id");
    if (proposal.actionRefs.length === 0)
        throw new Error("Executable proposal requires at least one action");
    return Object.freeze({ id: snapshotId, projectId: proposal.projectId, proposalId: proposal.id, proposalVersion: proposal.version, authorizationRef, decisionRefs: Object.freeze([...proposal.decisionRefs]), requirementRefs: Object.freeze([...proposal.requirementRefs]), actionRefs: Object.freeze([...proposal.actionRefs]) });
}
export function resolveReferent(referenceText, currentProposal, candidates) {
    if (/^(that|it|go ahead|go ahead with that|do that)$/i.test(referenceText.trim())) {
        if (!currentProposal)
            throw new Error("Material referent is ambiguous: no current proposal");
        return currentProposal;
    }
    const matches = candidates.filter((candidate) => candidate.id === referenceText || candidate.title.toLowerCase() === referenceText.toLowerCase());
    if (matches.length !== 1)
        throw new Error("Material referent is ambiguous");
    const match = matches[0];
    if (!match)
        throw new Error("Material referent is ambiguous");
    return match;
}
//# sourceMappingURL=execution-snapshot.js.map