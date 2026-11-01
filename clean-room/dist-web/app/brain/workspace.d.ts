export interface ProjectConversationWorkspace {
    readonly projectId: string;
    readonly version: number;
    readonly specVersion: number;
    readonly turnIds: readonly string[];
    readonly decisionRefs: readonly string[];
    readonly executionRunId?: string;
    readonly blockerRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly verifiedResultRefs: readonly string[];
    readonly updatedAt: string;
}
export declare class ProjectWorkspaceStore {
    #private;
    save(workspace: ProjectConversationWorkspace, expectedVersion?: number): void;
    get(projectId: string): ProjectConversationWorkspace | undefined;
}
