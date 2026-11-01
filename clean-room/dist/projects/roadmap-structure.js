/** Roadmap structure: stable IDs, ancestry, first-incomplete pointer and lifecycle. */
export function unitId(prefix, index) {
    if (!prefix.trim())
        throw new Error("A unit requires a prefix");
    if (!Number.isSafeInteger(index) || index < 1)
        throw new Error("A unit index must be positive");
    return `${prefix}-${String(index).padStart(3, "0")}`;
}
export function checkpointAncestry(ancestry, child) {
    if (!child.trim())
        throw new Error("A checkpoint requires a child unit");
    if (ancestry.includes(child))
        throw new Error("Checkpoint ancestry cannot cycle");
    return Object.freeze([...ancestry, child]);
}
export function firstIncomplete(units) {
    const index = units.findIndex((unit) => !unit.done);
    return index < 0 ? units.length : index;
}
export function reopenAffected(units) {
    return Object.freeze(units.filter((unit) => unit.affected).map((unit) => unit.id));
}
export function recordScopeExpansion(history, entry) {
    if (!entry.trim())
        throw new Error("A scope expansion requires a reason");
    if (history.includes(entry))
        throw new Error("Scope expansion history must be append-only");
    return Object.freeze([...history, entry]);
}
export function recalculatePercentage(units) {
    const total = units.reduce((sum, unit) => sum + unit.weight, 0);
    if (total <= 0)
        throw new Error("Weights must be positive");
    const done = units.reduce((sum, unit) => sum + (unit.done ? unit.weight : 0), 0);
    return Math.round((done / total) * 100);
}
const TRANSITIONS = Object.freeze({
    planned: { start: "active" },
    active: { block: "blocked", finish: "complete" },
    blocked: { unblock: "active" },
    complete: {}
});
export function projectTransition(state, event) {
    const next = TRANSITIONS[state][event];
    if (next === undefined)
        throw new Error(`Invalid project transition: ${state} + ${event}`);
    return next;
}
export function sectionAdapter(kind, allowed) {
    if (!allowed.includes(kind))
        throw new Error(`Unknown project-detail section adapter: ${kind}`);
    return kind;
}
//# sourceMappingURL=roadmap-structure.js.map