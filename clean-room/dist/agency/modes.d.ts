import type { AgencyExecutor } from "./registry.js";
import type { AgencyRun } from "./types.js";
export interface ProjectAutoActivationInput {
    readonly run: AgencyRun;
    readonly projectAutoEnabled: boolean;
    readonly selectedProjectId: string;
    readonly projectAgentAccessEnabled: boolean;
    readonly executorCandidates: readonly AgencyExecutor[];
    readonly firstTaskId?: string;
}
export type ProjectAutoActivationResult = Readonly<{
    state: "working";
    runId: string;
    projectId: string;
    taskId: string;
    executorKey: string;
}> | Readonly<{
    state: "blocked";
    runId: string;
    projectId: string;
    blocker: string;
}>;
export declare function activateProjectAuto(input: ProjectAutoActivationInput): ProjectAutoActivationResult;
export declare function assertAgentAutoProjectEligible(project: {
    agentAccessEnabled: boolean;
    portfolioAutoEnabled: boolean;
    projectTypeKey: string;
}): void;
