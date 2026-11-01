export class BrainCore {
    classifyAction(intent) {
        if (["question", "research"].includes(intent))
            return "informational";
        if (["idea", "proposal", "owner_input", "decision", "rule_change"].includes(intent))
            return "proposal";
        if (intent === "protected_action_request")
            return "protected";
        return "execution_request";
    }
    wrap(request, output, evidenceRefs) {
        if (!request.id.trim() || !request.ownerId.trim() || !request.text.trim() || !request.contextSnapshotId.trim())
            throw new Error("Brain request identity/text/context are required");
        return Object.freeze({ requestId: request.id, actionClass: this.classifyAction(request.intent), output: Object.freeze({ ...output }), evidenceRefs: Object.freeze([...evidenceRefs]), canonicalWritesAuthorized: false });
    }
}
//# sourceMappingURL=core.js.map