import { parseTimestamp } from "../security/types.js";
import { memoryOperationalEligibility, type BrainMemory, type LayeredMemoryMetadata, type MemoryLayer } from "./memory.js";

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

export function buildBrainContext(request: BrainContextRequest, candidates: readonly BrainContextItem[]): BrainContextPacket {
  const now = parseTimestamp(request.now, "now");
  const stale: string[] = [];
  const eligible = candidates.filter((item) => {
    if (item.ownerId !== request.ownerId) return false;
    if (item.projectId && item.projectId !== request.projectId) return false;
    if (item.sensitivityRank > request.maxSensitivityRank || item.relevance < request.minRelevance) return false;
    parseTimestamp(item.observedAt, "observedAt");
    if (item.staleAfter && now > parseTimestamp(item.staleAfter, "staleAfter")) { stale.push(item.id); return false; }
    return true;
  }).sort((a, b) => b.relevance - a.relevance).slice(0, request.maxItems).map((item) => Object.freeze({ ...item, value: Object.freeze({ ...item.value }) }));
  return Object.freeze({ ownerId: request.ownerId, ...(request.projectId ? { projectId: request.projectId } : {}), builtAt: request.now, items: Object.freeze(eligible), omittedStaleIds: Object.freeze(stale) });
}

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

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function omission<T>(candidate: LayeredContextCandidate<T>, reason: string): ContextOmission {
  return Object.freeze({
    memoryId: candidate.memory.id,
    memoryVersion: candidate.memory.version,
    layer: candidate.metadata.layer,
    reason,
    sourceRefs: Object.freeze([...candidate.memory.sourceRefs]),
    dependencyRefs: Object.freeze([...candidate.metadata.dependencyRefs])
  });
}

/**
 * PIF.6 compiler. It extends the existing Brain memory/context path and never reactivates
 * historical, quarantined, expired, invalidated, contradictory, or cross-boundary memory.
 * Every included item pins its exact memory version and every exclusion has an explicit reason.
 */
export function compileLayeredBrainContext<T>(request: LayeredContextCompileRequest, candidates: readonly LayeredContextCandidate<T>[]): LayeredContextPacket<T> {
  parseTimestamp(request.now, "now");
  if (!request.ownerId.trim() || !request.taskClass.trim()) throw new Error("Context owner/task class are required");
  if (!Number.isInteger(request.maxItems) || request.maxItems < 0) throw new Error("Context maxItems must be a non-negative integer");
  if (!Number.isFinite(request.maxBudgetUnits) || request.maxBudgetUnits < 0) throw new Error("Context maxBudgetUnits must be non-negative");
  if (!Number.isFinite(request.minRelevance) || request.minRelevance < 0 || request.minRelevance > 1) throw new Error("Context minRelevance must be 0..1");

  const sorted = [...candidates].sort((a, b) => b.relevance - a.relevance || a.memory.id.localeCompare(b.memory.id));
  const items: CompiledContextItem<T>[] = [];
  const omitted: ContextOmission[] = [];
  let usedBudgetUnits = 0;

  for (const candidate of sorted) {
    if (!Number.isFinite(candidate.relevance) || candidate.relevance < 0 || candidate.relevance > 1) { omitted.push(omission(candidate, "invalid_relevance")); continue; }
    if (!Number.isFinite(candidate.budgetUnits) || candidate.budgetUnits < 0) { omitted.push(omission(candidate, "invalid_budget_units")); continue; }
    const eligibility = memoryOperationalEligibility(candidate.memory as BrainMemory<unknown>, candidate.metadata, {
      ownerId: request.ownerId,
      ...(request.projectId !== undefined ? { projectId: request.projectId } : {}),
      ...(request.companyId !== undefined ? { companyId: request.companyId } : {}),
      taskClass: request.taskClass,
      now: request.now
    });
    if (!eligibility.eligible) { omitted.push(omission(candidate, eligibility.reason)); continue; }
    if (candidate.sensitivityRank > request.maxSensitivityRank) { omitted.push(omission(candidate, "sensitivity_boundary")); continue; }
    if (candidate.relevance < request.minRelevance) { omitted.push(omission(candidate, "relevance_below_threshold")); continue; }
    if (items.length >= request.maxItems) { omitted.push(omission(candidate, "item_limit")); continue; }
    if (usedBudgetUnits + candidate.budgetUnits > request.maxBudgetUnits) { omitted.push(omission(candidate, "budget_overflow")); continue; }

    usedBudgetUnits += candidate.budgetUnits;
    items.push(Object.freeze({
      memoryId: candidate.memory.id,
      memoryVersion: candidate.memory.version,
      layer: candidate.metadata.layer,
      relevance: candidate.relevance,
      budgetUnits: candidate.budgetUnits,
      value: candidate.memory.value,
      sourceRefs: Object.freeze([...candidate.memory.sourceRefs]),
      dependencyRefs: Object.freeze([...candidate.metadata.dependencyRefs]),
      methodRefs: Object.freeze([...candidate.metadata.methodRefs]),
      permissionRefs: Object.freeze([...candidate.metadata.permissionRefs]),
      budgetRefs: Object.freeze([...candidate.metadata.budgetRefs])
    }));
  }

  return Object.freeze({
    ownerId: request.ownerId,
    ...(request.projectId !== undefined ? { projectId: request.projectId } : {}),
    ...(request.companyId !== undefined ? { companyId: request.companyId } : {}),
    taskClass: request.taskClass,
    builtAt: request.now,
    maxBudgetUnits: request.maxBudgetUnits,
    usedBudgetUnits,
    items: Object.freeze(items),
    omitted: Object.freeze(omitted),
    exactVersionRefs: uniqueSorted(items.map((item) => `${item.memoryId}@${item.memoryVersion}`)),
    methodRefs: uniqueSorted(items.flatMap((item) => item.methodRefs)),
    permissionRefs: uniqueSorted(items.flatMap((item) => item.permissionRefs)),
    budgetRefs: uniqueSorted(items.flatMap((item) => item.budgetRefs))
  });
}
