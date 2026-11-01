export interface CapacitySample {
    readonly projects: number;
    readonly books: number;
    readonly accounts: number;
    readonly socialChannels: number;
    readonly agencyJobs: number;
    readonly knowledgeRecords: number;
    readonly cpuPercent: number;
    readonly memoryPercent: number;
    readonly queueDepth: number;
    readonly providerDegraded: boolean;
}
export declare function capacityDecision(sample: CapacitySample): "accept" | "backpressure";
import { type RecoveryScope } from './contracts.js';
export type RecoveryLoadClass = 'projects' | 'businesses' | 'books' | 'accounts' | 'social_channels' | 'agency_jobs' | 'knowledge_records' | 'learning_packets' | 'evaluations' | 'method_history' | 'traces' | 'cross_brain_routes';
export interface RecoveryLoadUnit {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly kind: RecoveryLoadClass;
    readonly version: number;
    readonly dependencyRefs: readonly string[];
}
export interface RecoveryLoadBudget {
    readonly multiplier: 10 | 100;
    readonly baselineUnits: number;
    readonly maximumAccepted: number;
    readonly maximumBytes: number;
    readonly perScopeLimit: number;
    readonly providerDegraded: boolean;
}
/** Admission exercise only, not a competing Agency queue. Every offered unit is accounted for. */
export declare function exerciseRecoveryCapacity(units: readonly RecoveryLoadUnit[], budget: RecoveryLoadBudget): Promise<{
    boundary: string;
    offered: number;
    accepted: string[];
    backpressured: string[];
    lost: number;
    bytesUsed: number;
    maximumBytes: number;
    byClass: {
        [k: string]: number;
    };
    checkpointDigest: string;
    productionCapacityCertified: boolean;
}>;
