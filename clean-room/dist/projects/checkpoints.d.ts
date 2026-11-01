export interface ProjectCheckpoint {
    readonly id: string;
    readonly projectId: string;
    readonly roadmapVersion: number;
    readonly createdAt: string;
    readonly exactNextWorkUnitId?: string;
    readonly blocker?: string;
    readonly requiredEnvironment?: "pc" | "phone" | "local_browser" | "any_device";
    readonly ownerAction?: string;
    readonly verificationMethod: string;
    readonly evidenceRefs: readonly string[];
    readonly resumeStateHash: string;
}
export declare class ProjectCheckpointStore {
    #private;
    append(checkpoint: ProjectCheckpoint): void;
    latest(projectId: string): ProjectCheckpoint | undefined;
    history(projectId: string): readonly ProjectCheckpoint[];
}
