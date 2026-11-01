export function createImprovementProposal(input) {
    if (!input.id.trim() || !input.title.trim() || input.evidenceRefs.length === 0)
        throw new Error("Improvement proposal requires identity/title/evidence");
    if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
        throw new Error("Improvement confidence must be 0..1");
    return Object.freeze({ ...input, evidenceRefs: Object.freeze([...input.evidenceRefs]), installsAutomatically: false });
}
//# sourceMappingURL=improvements.js.map