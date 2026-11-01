function text(value) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function numeric(value) {
    const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : undefined;
}
function textArray(value) {
    if (!Array.isArray(value))
        return Object.freeze([]);
    return Object.freeze(value.map(text).filter((item) => !!item));
}
function evidence(source, observedAt, reference) {
    return Object.freeze([Object.freeze({ source, observedAt, reference })]);
}
function runSnapshots(rows, observedAt) {
    return Object.freeze(rows.flatMap((row) => {
        const runId = text(row.run_id);
        const projectId = text(row.project_id);
        const objective = text(row.objective);
        const controlMode = text(row.control_mode);
        const state = text(row.state);
        const generation = numeric(row.generation);
        const priority = numeric(row.priority);
        const updatedAt = text(row.updated_at);
        if (!runId || !projectId || !objective || !controlMode || !state || generation === undefined || priority === undefined || !updatedAt)
            return [];
        const blocker = text(row.blocker);
        const checkpointId = text(row.checkpoint_id);
        const snapshot = Object.freeze({
            runId,
            projectId,
            objective,
            controlMode,
            state,
            generation,
            priority,
            stopRequested: row.stop_requested === true,
            pauseRequested: row.pause_requested === true,
            ...(blocker ? { blocker } : {}),
            ...(checkpointId ? { checkpointId } : {}),
            updatedAt,
            evidence: evidence("supabase:command_center_agency_runs", updatedAt || observedAt, runId)
        });
        return [snapshot];
    }));
}
function jobSnapshots(rows, observedAt) {
    return Object.freeze(rows.flatMap((row) => {
        const jobId = text(row.job_id);
        const runId = text(row.run_id);
        const projectId = text(row.project_id);
        const objective = text(row.objective);
        const state = text(row.state);
        const risk = text(row.risk);
        const costClass = text(row.cost_class);
        const preferredEnvironment = text(row.preferred_environment);
        const capability = text(row.capability);
        const retryCount = numeric(row.retry_count);
        const updatedAt = text(row.updated_at);
        if (!jobId || !runId || !projectId || !objective || !state || !risk || !costClass || !preferredEnvironment || !capability || retryCount === undefined || !updatedAt)
            return [];
        const blocker = text(row.blocker);
        const checkpointRef = text(row.checkpoint_ref);
        const snapshot = Object.freeze({
            jobId,
            runId,
            projectId,
            objective,
            state,
            risk,
            costClass,
            preferredEnvironment,
            capability,
            retryCount,
            ...(blocker ? { blocker } : {}),
            ...(checkpointRef ? { checkpointRef } : {}),
            updatedAt,
            evidence: evidence("supabase:command_center_agency_jobs", updatedAt || observedAt, jobId)
        });
        return [snapshot];
    }));
}
function taskSnapshots(rows, observedAt) {
    return Object.freeze(rows.flatMap((row) => {
        const taskId = text(row.task_id);
        const jobId = text(row.job_id);
        const runId = text(row.run_id);
        const projectId = text(row.project_id);
        const title = text(row.title);
        const state = text(row.state);
        const capability = text(row.capability);
        const risk = text(row.risk);
        const costClass = text(row.cost_class);
        const preferredEnvironment = text(row.preferred_environment);
        const retryCount = numeric(row.retry_count);
        const updatedAt = text(row.updated_at);
        if (!taskId || !jobId || !runId || !projectId || !title || !state || !capability || !risk || !costClass || !preferredEnvironment || retryCount === undefined || !updatedAt)
            return [];
        const blocker = text(row.blocker);
        const checkpointRef = text(row.checkpoint_ref);
        const snapshot = Object.freeze({
            taskId,
            jobId,
            runId,
            projectId,
            title,
            state,
            capability,
            risk,
            costClass,
            preferredEnvironment,
            retryCount,
            ...(blocker ? { blocker } : {}),
            ...(checkpointRef ? { checkpointRef } : {}),
            verificationRefs: textArray(row.verification_refs),
            updatedAt,
            evidence: evidence("supabase:command_center_agency_tasks", updatedAt || observedAt, taskId)
        });
        return [snapshot];
    }));
}
export function buildRuntimeAgencySnapshot(input) {
    if (input.unavailable) {
        return Object.freeze({
            availability: "unavailable",
            runs: Object.freeze([]),
            jobs: Object.freeze([]),
            tasks: Object.freeze([]),
            evidence: Object.freeze([])
        });
    }
    const runs = runSnapshots(input.runs, input.observedAt);
    const jobs = jobSnapshots(input.jobs, input.observedAt);
    const tasks = taskSnapshots(input.tasks, input.observedAt);
    return Object.freeze({
        availability: "available",
        runs,
        jobs,
        tasks,
        evidence: Object.freeze([
            Object.freeze({ source: "supabase:command_center_agency_runs", observedAt: input.observedAt }),
            Object.freeze({ source: "supabase:command_center_agency_jobs", observedAt: input.observedAt }),
            Object.freeze({ source: "supabase:command_center_agency_tasks", observedAt: input.observedAt })
        ])
    });
}
//# sourceMappingURL=agency-runtime-projection.js.map