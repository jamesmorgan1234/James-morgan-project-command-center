export type ProjectLineageKind = "created" | "renamed" | "mission_changed" | "alias_added" | "merged" | "superseded" | "forked" | "branched" | "reactivated" | "retired";
export interface ProjectLineageEvent {
    readonly id: string;
    readonly projectId: string;
    readonly kind: ProjectLineageKind;
    readonly occurredAt: string;
    readonly ownerDecisionRef?: string;
    readonly fromName?: string;
    readonly toName?: string;
    readonly fromMission?: string;
    readonly toMission?: string;
    readonly alias?: string;
    readonly relatedProjectId?: string;
    readonly evidenceRefs: readonly string[];
}
export declare class ProjectLineageLedger {
    #private;
    append(event: ProjectLineageEvent): void;
    history(projectId: string): readonly ProjectLineageEvent[];
    currentName(projectId: string, originalName: string): string;
    currentMission(projectId: string, originalMission: string): string;
    aliases(projectId: string): readonly string[];
}
