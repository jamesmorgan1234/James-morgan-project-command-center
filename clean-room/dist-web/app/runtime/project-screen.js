function knownText(value) {
    return value.state === "known" ? String(value.value).trim() || undefined : undefined;
}
function optionalKnownText(value) {
    return value?.state === "known" ? String(value.value).trim() || undefined : undefined;
}
function normalize(value) {
    const cleaned = value?.trim();
    return cleaned ? cleaned.toLocaleLowerCase() : undefined;
}
export function projectFilterFromSearch(search) {
    const params = new URLSearchParams(search);
    const group = params.get("group")?.trim();
    const groupBy = group && ["none", "type", "company", "lifecycle", "priority"].includes(group) ? group : "none";
    const clean = (key) => params.get(key)?.trim() || undefined;
    return Object.freeze({
        query: clean("q"),
        lifecycle: clean("lifecycle"),
        priority: clean("priority"),
        typeKey: clean("type"),
        companyId: clean("company"),
        groupBy
    });
}
export function filterRuntimeProjects(projects, filter) {
    const query = normalize(filter.query);
    const lifecycle = normalize(filter.lifecycle);
    const priority = normalize(filter.priority);
    const typeKey = normalize(filter.typeKey);
    const companyId = normalize(filter.companyId);
    return Object.freeze([...projects]
        .filter((project) => {
        if (!query)
            return true;
        const haystack = [
            project.name,
            project.mission.state === "known" ? project.mission.value : "",
            optionalKnownText(project.typeKey) ?? "",
            optionalKnownText(project.companyId) ?? ""
        ].join("\n").toLocaleLowerCase();
        return haystack.includes(query);
    })
        .filter((project) => !lifecycle || normalize(knownText(project.lifecycle)) === lifecycle)
        .filter((project) => !priority || normalize(knownText(project.priority)) === priority)
        .filter((project) => !typeKey || normalize(optionalKnownText(project.typeKey)) === typeKey)
        .filter((project) => !companyId || normalize(optionalKnownText(project.companyId)) === companyId)
        .sort((a, b) => a.name.localeCompare(b.name)));
}
function groupValue(project, groupBy) {
    if (groupBy === "type")
        return optionalKnownText(project.typeKey) ?? "type:unavailable";
    if (groupBy === "company")
        return optionalKnownText(project.companyId) ?? "company:unassigned";
    if (groupBy === "lifecycle")
        return knownText(project.lifecycle) ?? "lifecycle:unavailable";
    if (groupBy === "priority")
        return knownText(project.priority) ?? "priority:unavailable";
    return "all";
}
export function groupRuntimeProjects(projects, groupBy = "none") {
    if (groupBy === "none")
        return Object.freeze([{ key: "all", label: "All projects", projects: Object.freeze([...projects]) }]);
    const groups = new Map();
    for (const project of projects) {
        const key = groupValue(project, groupBy);
        const bucket = groups.get(key) ?? [];
        bucket.push(project);
        groups.set(key, bucket);
    }
    return Object.freeze([...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, items]) => Object.freeze({ key, label: key.replace(/^.*?:/, "").replaceAll("_", " "), projects: Object.freeze(items.sort((a, b) => a.name.localeCompare(b.name))) })));
}
export function projectFacetValues(projects) {
    const unique = (values) => Object.freeze([...new Set(values.filter((value) => !!value))].sort((a, b) => a.localeCompare(b)));
    return Object.freeze({
        lifecycles: unique(projects.map((project) => knownText(project.lifecycle))),
        priorities: unique(projects.map((project) => knownText(project.priority))),
        typeKeys: unique(projects.map((project) => optionalKnownText(project.typeKey))),
        companyIds: unique(projects.map((project) => optionalKnownText(project.companyId)))
    });
}
//# sourceMappingURL=project-screen.js.map