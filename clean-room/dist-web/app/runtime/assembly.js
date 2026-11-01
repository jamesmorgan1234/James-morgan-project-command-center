import { known, notApplicable, unknown } from "../data/canonical.js";
import { calculateProjectProgress } from "../projects/progress.js";
const BASE_SURFACES = Object.freeze([
    ["home", "Home"], ["projects", "Projects"], ["brain", "Brain"], ["agency", "Agency"], ["needs-me", "Needs Me"],
    ["search", "Search"], ["automations", "Automations"], ["personal", "Personal"], ["finance", "Finance"],
    ["social", "Social & Communications"], ["books", "Books"], ["specialists", "Specialists"], ["analytics", "Analytics"], ["settings", "Settings"]
]);
function sourceEvidence(sourceRef, observedAt) {
    return Object.freeze([Object.freeze({ source: sourceRef, observedAt })]);
}
function projectProgress(projectId, roadmaps) {
    const source = roadmaps?.get(projectId);
    if (!source)
        return unknown();
    const progress = calculateProjectProgress(source.roadmap, source.denominatorTrusted);
    return progress.kind === "percent" ? known(progress.percent) : notApplicable();
}
function projectSnapshot(options, project) {
    const checkpoint = options.checkpoints.latest(project.id);
    const nextAction = checkpoint?.ownerAction ?? checkpoint?.exactNextWorkUnitId;
    return Object.freeze({
        id: project.id,
        name: project.name,
        mission: known(project.mission),
        lifecycle: known(project.lifecycle),
        verification: known(project.verification),
        priority: known(project.priority),
        stage: unknown(),
        status: known(`${project.lifecycle} · ${project.verification}`),
        progressPercent: projectProgress(project.id, options.roadmaps),
        currentCheckpoint: checkpoint ? known(checkpoint.id) : unknown(),
        nextAction: nextAction ? known(nextAction) : unknown(),
        blockers: checkpoint?.blocker ? known(Object.freeze([checkpoint.blocker])) : unknown(),
        needsMeCount: unknown(),
        agencyState: unknown(),
        recentActivity: unknown(),
        evidence: sourceEvidence(options.sourceRef, options.observedAt)
    });
}
function surfaces(options, projectCount, needsCount) {
    const readers = new Map((options.surfaceReaders ?? []).map((reader) => [reader.key, reader]));
    const evidence = sourceEvidence(options.sourceRef, options.observedAt);
    return Object.freeze(BASE_SURFACES.map(([key, label]) => {
        if (key === "home")
            return Object.freeze({ key, label, availability: "available", summary: known("Canonical Command Center runtime connected."), evidence });
        if (key === "projects")
            return Object.freeze({ key, label, availability: "available", summary: known(`${projectCount} canonical project record${projectCount === 1 ? "" : "s"} loaded.`), evidence });
        if (key === "needs-me")
            return Object.freeze({ key, label, availability: "available", summary: known(`${needsCount} open owner-attention item${needsCount === 1 ? "" : "s"}.`), evidence });
        const reader = readers.get(key);
        if (!reader)
            return Object.freeze({ key, label, availability: "unavailable", summary: unknown(), evidence: Object.freeze([]) });
        const value = reader.read();
        return Object.freeze({ key, label: reader.label, availability: value.availability, summary: value.summary, evidence: Object.freeze([...value.evidence]) });
    }));
}
export function assembleCanonicalRuntimeSnapshot(options) {
    if (!options.providerId.trim() || !options.sourceRef.trim())
        throw new Error("Runtime provider/source identity are required");
    if (!Number.isFinite(Date.parse(options.observedAt)))
        throw new Error("Runtime observedAt must be an ISO-compatible timestamp");
    const projects = Object.freeze(options.projects.list().map((project) => projectSnapshot(options, project)));
    const needs = options.needsMe.open();
    return Object.freeze({
        schemaVersion: "cc-runtime-snapshot-v1",
        generatedAt: options.observedAt,
        connection: Object.freeze({ state: "connected", providerId: options.providerId, message: "Canonical clean-room domain snapshot loaded.", lastSuccessfulSyncAt: known(options.observedAt) }),
        owner: Object.freeze({ displayName: options.ownerDisplayName ? known(options.ownerDisplayName) : unknown() }),
        projects,
        surfaces: surfaces(options, projects.length, needs.length),
        release: Object.freeze({ releaseId: options.releaseId ? known(options.releaseId) : unknown(), knownGoodReleaseId: options.knownGoodReleaseId ? known(options.knownGoodReleaseId) : unknown() })
    });
}
//# sourceMappingURL=assembly.js.map