/** Run resumption: trustworthy plans, evidence-linked progress and no recreation. */
export function assertTrustworthyPlan(plan) {
    if (plan.tasks.length === 0)
        throw new Error("A plan requires tasks");
    if (!plan.tasks.every((task) => task.verified))
        throw new Error("Only verified tasks form a trustworthy plan");
}
export function taskWeight(task) {
    if (task.weight === null)
        throw new Error("Task weights exist only where legitimately defined");
    if (!Number.isFinite(task.weight) || task.weight <= 0)
        throw new Error("A task weight must be positive");
    return task.weight;
}
export function linkProgressToEvidence(progress) {
    if (progress.evidenceIds.length === 0)
        throw new Error("Roadmap progress must link to evidence");
}
export function checkpointReverify(downstream) {
    return Object.freeze(downstream.map((item) => item.id));
}
export function resumeSameRun(runId, blockerTaskId) {
    if (!runId.trim() || !blockerTaskId.trim())
        throw new Error("Resumption requires a run and a blocker");
    return Object.freeze({ runId, resumeAt: blockerTaskId });
}
export function assertNoRunRecreation(before, after) {
    if (before !== after)
        throw new Error("The same run must resume after verification");
}
export function assertNoProjectSwitch(before, after) {
    if (before !== after)
        throw new Error("No project switching after a blocker");
}
export function smallestBlockedOperation(tasks) {
    if (tasks.length === 0)
        throw new Error("A blocked operation requires tasks");
    return [...tasks].sort((a, b) => a.size - b.size)[0]?.id;
}
//# sourceMappingURL=run-resume.js.map