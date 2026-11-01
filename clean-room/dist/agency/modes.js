export function activateProjectAuto(input) {
    if (!input.projectAutoEnabled)
        return Object.freeze({ state: "blocked", runId: input.run.id, projectId: input.run.projectId, blocker: "project_auto_disabled" });
    if (input.run.controlMode !== "project_auto" || input.run.projectId !== input.selectedProjectId)
        return Object.freeze({ state: "blocked", runId: input.run.id, projectId: input.run.projectId, blocker: "project_auto_run_scope_mismatch" });
    if (!input.projectAgentAccessEnabled)
        return Object.freeze({ state: "blocked", runId: input.run.id, projectId: input.run.projectId, blocker: "project_agent_access_disabled" });
    if (input.run.stopRequested || input.run.pauseRequested)
        return Object.freeze({ state: "blocked", runId: input.run.id, projectId: input.run.projectId, blocker: input.run.stopRequested ? "owner_stop_requested" : "owner_pause_requested" });
    if (!input.firstTaskId)
        return Object.freeze({ state: "blocked", runId: input.run.id, projectId: input.run.projectId, blocker: "no_ready_task" });
    const executor = input.executorCandidates.find((candidate) => candidate.enabled && candidate.health !== "unavailable");
    if (!executor)
        return Object.freeze({ state: "blocked", runId: input.run.id, projectId: input.run.projectId, blocker: "no_eligible_executor" });
    return Object.freeze({ state: "working", runId: input.run.id, projectId: input.run.projectId, taskId: input.firstTaskId, executorKey: executor.key });
}
export function assertAgentAutoProjectEligible(project) {
    if (!project.agentAccessEnabled || !project.portfolioAutoEnabled)
        throw new Error("Project is excluded from Agent Auto portfolio execution");
    if (project.projectTypeKey.startsWith("project-type:book"))
        throw new Error("Books are portfolio-auto excluded unless owner changes policy");
}
//# sourceMappingURL=modes.js.map