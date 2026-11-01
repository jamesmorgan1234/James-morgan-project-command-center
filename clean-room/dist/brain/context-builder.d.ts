import { type BrainMemory, type LayeredMemoryMetadata, type MemoryLayer } from "./memory.js";
export interface BrainContextItem {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly kind: string;
    readonly relevance: number;
    readonly sensitivityRank: number;
    readonly observedAt: string;
    readonly staleAfter?: string;
    readonly sourceRef: string;
    readonly value: Readonly<Record<string, unknown>>;
}
export interface BrainContextRequest {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly now: string;
    readonly maxSensitivityRank: number;
    readonly minRelevance: number;
    readonly maxItems: number;
}
export interface BrainContextPacket {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly builtAt: string;
    readonly items: readonly BrainContextItem[];
    readonly omittedStaleIds: readonly string[];
}
export declare function buildBrainContext(request: BrainContextRequest, candidates: readonly BrainContextItem[]): BrainContextPacket;
export interface LayeredContextCandidate<T = unknown> {
    readonly memory: BrainMemory<T>;
    readonly metadata: LayeredMemoryMetadata;
    readonly relevance: number;
    readonly sensitivityRank: number;
    readonly budgetUnits: number;
}
export interface LayeredContextCompileRequest {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly taskClass: string;
    readonly now: string;
    readonly maxSensitivityRank: number;
    readonly minRelevance: number;
    readonly maxItems: number;
    readonly maxBudgetUnits: number;
}
export interface CompiledContextItem<T = unknown> {
    readonly memoryId: string;
    readonly memoryVersion: number;
    readonly layer: MemoryLayer;
    readonly relevance: number;
    readonly budgetUnits: number;
    readonly value: Readonly<T>;
    readonly sourceRefs: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly methodRefs: readonly string[];
    readonly permissionRefs: readonly string[];
    readonly budgetRefs: readonly string[];
}
export interface ContextOmission {
    readonly memoryId: string;
    readonly memoryVersion: number;
    readonly layer: MemoryLayer;
    readonly reason: string;
    readonly sourceRefs: readonly string[];
    readonly dependencyRefs: readonly string[];
}
export interface LayeredContextPacket<T = unknown> {
    readonly ownerId: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly taskClass: string;
    readonly builtAt: string;
    readonly maxBudgetUnits: number;
    readonly usedBudgetUnits: number;
    readonly items: readonly CompiledContextItem<T>[];
    readonly omitted: readonly ContextOmission[];
    readonly exactVersionRefs: readonly string[];
    readonly methodRefs: readonly string[];
    readonly permissionRefs: readonly string[];
    readonly budgetRefs: readonly string[];
}
/**
 * PIF.6 compiler. It extends the existing Brain memory/context path and never reactivates
 * historical, quarantined, expired, invalidated, contradictory, or cross-boundary memory.
 * Every included item pins its exact memory version and every exclusion has an explicit reason.
 */
export declare function compileLayeredBrainContext<T>(request: LayeredContextCompileRequest, candidates: readonly LayeredContextCandidate<T>[]): LayeredContextPacket<T>;
