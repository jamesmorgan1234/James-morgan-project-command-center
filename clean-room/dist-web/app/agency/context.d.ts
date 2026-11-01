export interface AgencyContextSourceRef {
    readonly id: string;
    readonly version: number;
    readonly contentHash: string;
    readonly sensitivityRank: number;
}
export interface AgencyContextPacket {
    readonly id: string;
    readonly runId: string;
    readonly taskId: string;
    readonly projectId: string;
    readonly builtAt: string;
    readonly staleAfter: string;
    readonly maxSensitivityRank: number;
    readonly sourceRefs: readonly AgencyContextSourceRef[];
    readonly artifactRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
}
export interface AgencyExecutionContextPacket extends AgencyContextPacket {
    readonly missionRef: string;
    readonly ownerRuleRefs: readonly string[];
    readonly protectedAssetRefs: readonly string[];
    readonly allowedToolRefs: readonly string[];
    readonly readScopes: readonly string[];
    readonly writeScopes: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly acceptanceCriteriaRefs: readonly string[];
    readonly authorizationSnapshotRef: string;
}
export declare function createAgencyContextPacket(packet: AgencyContextPacket): AgencyContextPacket;
export declare function createAgencyExecutionContextPacket(packet: AgencyExecutionContextPacket): AgencyExecutionContextPacket;
export declare function assertContextFresh(packet: AgencyContextPacket, now: string): void;
