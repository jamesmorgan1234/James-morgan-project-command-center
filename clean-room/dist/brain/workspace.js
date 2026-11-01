import { parseTimestamp } from "../security/types.js";
export class ProjectWorkspaceStore {
    #items = new Map();
    save(workspace, expectedVersion) {
        if (!workspace.projectId.trim() || !Number.isSafeInteger(workspace.version) || workspace.version < 1)
            throw new Error("Workspace project/version are required");
        parseTimestamp(workspace.updatedAt, "updatedAt");
        const current = this.#items.get(workspace.projectId);
        if (!current) {
            if (workspace.version !== 1 || expectedVersion !== undefined)
                throw new Error("New workspace must start at version 1 without expectedVersion");
        }
        else {
            if (expectedVersion !== current.version || workspace.version !== current.version + 1)
                throw new Error(`Workspace version conflict: ${workspace.projectId}`);
        }
        this.#items.set(workspace.projectId, Object.freeze({ ...workspace, turnIds: Object.freeze([...workspace.turnIds]), decisionRefs: Object.freeze([...workspace.decisionRefs]), blockerRefs: Object.freeze([...workspace.blockerRefs]), evidenceRefs: Object.freeze([...workspace.evidenceRefs]), verifiedResultRefs: Object.freeze([...workspace.verifiedResultRefs]) }));
    }
    get(projectId) { return this.#items.get(projectId); }
}
//# sourceMappingURL=workspace.js.map