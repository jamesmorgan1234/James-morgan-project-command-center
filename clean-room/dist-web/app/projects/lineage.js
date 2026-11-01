import { parseTimestamp } from "../security/types.js";
const OWNER_DECISION_KINDS = new Set(["renamed", "mission_changed", "alias_added", "merged", "superseded", "forked", "branched", "reactivated", "retired"]);
function compareLineageEvents(a, b) {
    const time = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
    return time || a.id.localeCompare(b.id);
}
export class ProjectLineageLedger {
    #events = [];
    #ids = new Set();
    append(event) {
        if (!event.id.trim() || !event.projectId.trim())
            throw new Error("Lineage event identity is required");
        if (this.#ids.has(event.id))
            throw new Error(`Lineage event already exists: ${event.id}`);
        parseTimestamp(event.occurredAt, "occurredAt");
        if (event.evidenceRefs.length === 0 || event.evidenceRefs.some((ref) => !ref.trim()))
            throw new Error("Lineage event requires nonblank evidence");
        if (new Set(event.evidenceRefs).size !== event.evidenceRefs.length)
            throw new Error("Lineage evidence must be unique");
        if (OWNER_DECISION_KINDS.has(event.kind) && !event.ownerDecisionRef?.trim())
            throw new Error(`${event.kind} requires owner decision evidence`);
        if (event.kind === "renamed" && (!event.fromName?.trim() || !event.toName?.trim() || event.fromName === event.toName))
            throw new Error("Rename requires distinct fromName and toName");
        if (event.kind === "mission_changed" && (!event.fromMission?.trim() || !event.toMission?.trim() || event.fromMission === event.toMission))
            throw new Error("Mission change requires distinct fromMission and toMission");
        if (event.kind === "alias_added" && !event.alias?.trim())
            throw new Error("Alias event requires alias");
        if (["merged", "superseded", "forked", "branched"].includes(event.kind) && (!event.relatedProjectId?.trim() || event.relatedProjectId === event.projectId))
            throw new Error(`${event.kind} requires a different relatedProjectId`);
        this.#ids.add(event.id);
        this.#events.push(Object.freeze({ ...event, evidenceRefs: Object.freeze([...event.evidenceRefs]) }));
    }
    history(projectId) {
        return Object.freeze(this.#ordered(projectId));
    }
    currentName(projectId, originalName) {
        let name = originalName;
        for (const event of this.#ordered(projectId).filter((candidate) => candidate.kind === "renamed")) {
            if (event.toName)
                name = event.toName;
        }
        return name;
    }
    currentMission(projectId, originalMission) {
        let mission = originalMission;
        for (const event of this.#ordered(projectId).filter((candidate) => candidate.kind === "mission_changed")) {
            if (event.toMission)
                mission = event.toMission;
        }
        return mission;
    }
    aliases(projectId) {
        const values = this.#ordered(projectId)
            .filter((event) => event.kind === "alias_added" && event.alias)
            .map((event) => event.alias);
        return Object.freeze([...new Set(values)]);
    }
    #ordered(projectId) {
        return this.#events.filter((event) => event.projectId === projectId).sort(compareLineageEvents);
    }
}
//# sourceMappingURL=lineage.js.map