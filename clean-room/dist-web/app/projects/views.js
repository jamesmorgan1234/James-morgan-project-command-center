import { parseTimestamp } from "../security/types.js";
function normalizedSet(values) {
    if (!values)
        return undefined;
    return new Set(values.map((value) => value.trim()).filter(Boolean));
}
export function projectsView(items, filter = {}) {
    const query = filter.query?.trim().toLocaleLowerCase();
    const lifecycle = normalizedSet(filter.lifecycle);
    const priorities = normalizedSet(filter.priorities);
    const verification = normalizedSet(filter.verification);
    const typeKeys = normalizedSet(filter.typeKeys);
    const companyIds = normalizedSet(filter.companyIds);
    return Object.freeze([...items]
        .filter((item) => filter.includeArchived === true || item.project.lifecycle !== "archived")
        .filter((item) => !query || `${item.project.name}\n${item.project.mission}`.toLocaleLowerCase().includes(query))
        .filter((item) => !lifecycle || lifecycle.has(item.project.lifecycle))
        .filter((item) => !priorities || priorities.has(item.project.priority))
        .filter((item) => !verification || verification.has(item.project.verification))
        .filter((item) => !typeKeys || typeKeys.has(item.project.typeKey))
        .filter((item) => !companyIds || (item.project.companyId ? companyIds.has(item.project.companyId) : false))
        .sort((a, b) => a.project.name.localeCompare(b.project.name)));
}
export function groupProjects(items, groupBy) {
    const groups = new Map();
    for (const item of items) {
        const key = groupBy === "type" ? item.project.typeKey
            : groupBy === "company" ? item.project.companyId ?? "company:unassigned"
                : groupBy === "lifecycle" ? item.project.lifecycle
                    : item.project.priority;
        const group = groups.get(key) ?? [];
        group.push(item);
        groups.set(key, group);
    }
    return Object.freeze([...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, values]) => Object.freeze({ key, items: Object.freeze([...values].sort((a, b) => a.project.name.localeCompare(b.project.name))) })));
}
export function activeLiveView(projects, activities, now, staleAfterMs = 120_000) {
    if (!Number.isFinite(staleAfterMs) || staleAfterMs <= 0)
        throw new Error("Active/live stale threshold must be positive");
    const nowMs = parseTimestamp(now, "now");
    const byProject = new Map(projects.map((project) => [project.id, project]));
    const freshest = new Map();
    for (const activity of activities) {
        if (activity.status !== "working" || !activity.executorClaimed || !activity.lastHeartbeatAt)
            continue;
        const heartbeat = parseTimestamp(activity.lastHeartbeatAt, "lastHeartbeatAt");
        if (heartbeat > nowMs || nowMs - heartbeat > staleAfterMs)
            continue;
        const project = byProject.get(activity.projectId);
        if (!project || ["archived", "superseded", "completed"].includes(project.lifecycle))
            continue;
        const current = freshest.get(project.id);
        if (!current || heartbeat > current.heartbeat)
            freshest.set(project.id, Object.freeze({ activity, heartbeat }));
    }
    return Object.freeze([...freshest.entries()]
        .map(([projectId, current]) => Object.freeze({ project: byProject.get(projectId), activity: current.activity }))
        .sort((a, b) => a.project.name.localeCompare(b.project.name)));
}
export function nextUpView(candidates) {
    return Object.freeze([...candidates]
        .filter((candidate) => Number.isFinite(candidate.priorityRank))
        .filter((candidate) => candidate.readiness.ready && candidate.evidenceRefs.length > 0 && candidate.evidenceRefs.every((ref) => ref.trim().length > 0) && !["archived", "superseded", "completed"].includes(candidate.project.lifecycle))
        .sort((a, b) => a.priorityRank - b.priorityRank || a.project.name.localeCompare(b.project.name) || a.workUnitId.localeCompare(b.workUnitId)));
}
//# sourceMappingURL=views.js.map