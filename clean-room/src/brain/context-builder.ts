import { parseTimestamp } from "../security/types.js";

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
