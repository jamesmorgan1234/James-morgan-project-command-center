export interface SearchDocument {
  readonly id: string;
  readonly ownerId: string;
  readonly domain: string;
  readonly projectId?: string;
  readonly title: string;
  readonly text: string;
  readonly sensitivityRank: number;
  readonly provenanceRefs: readonly string[];
  readonly permissionRefs?: readonly string[];
  readonly updatedAt?: string;
  readonly staleAfter?: string;
  readonly deletedAt?: string;
  readonly sourceVersion?: number;
}

export interface SearchRequest {
  readonly ownerId: string;
  readonly query: string;
  readonly maxSensitivityRank: number;
  readonly allowedDomains: readonly string[];
  readonly allowedProjectIds: readonly string[];
  readonly authorizedPermissionRefs?: readonly string[];
  readonly now?: string;
}

export interface SearchHit {
  readonly id: string;
  readonly title: string;
  readonly domain: string;
  readonly score: number;
  readonly provenanceRefs: readonly string[];
  readonly sourceVersion?: number;
  readonly updatedAt?: string;
}

function terms(value: string): readonly string[] { return value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 1); }
function timestamp(value: string, label: string): number { const parsed = Date.parse(value); if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp`); return parsed; }

export function federatedSearch(request: SearchRequest, documents: readonly SearchDocument[]): readonly SearchHit[] {
  const queryTerms = terms(request.query);
  if (queryTerms.length === 0) return Object.freeze([]);
  if (!request.ownerId.trim() || !Number.isFinite(request.maxSensitivityRank) || request.maxSensitivityRank < 0) throw new Error("Search owner/sensitivity bound are required");
  const allowedDomains = new Set(request.allowedDomains);
  const allowedProjects = new Set(request.allowedProjectIds);
  const authorizedPermissions = new Set(request.authorizedPermissionRefs ?? []);
  const now = request.now ? timestamp(request.now, "Search now") : Date.now();
  const hits: SearchHit[] = [];
  for (const document of documents) {
    if (!document.id.trim() || !document.ownerId.trim() || !document.domain.trim() || !document.title.trim()) continue;
    if (!Number.isFinite(document.sensitivityRank) || document.sensitivityRank < 0) continue;
    if (document.ownerId !== request.ownerId || document.sensitivityRank > request.maxSensitivityRank || !allowedDomains.has(document.domain)) continue;
    if (document.projectId && !allowedProjects.has(document.projectId)) continue;
    if (document.provenanceRefs.length === 0 || document.provenanceRefs.some((ref) => !ref.trim())) continue;
    if (document.sourceVersion !== undefined && (!Number.isSafeInteger(document.sourceVersion) || document.sourceVersion < 1)) continue;
    if (document.updatedAt) timestamp(document.updatedAt, "Search document updatedAt");
    if (document.deletedAt && timestamp(document.deletedAt, "Search document deletedAt") <= now) continue;
    if (document.staleAfter && timestamp(document.staleAfter, "Search document staleAfter") <= now) continue;
    const requiredPermissions = document.permissionRefs ?? [];
    if (requiredPermissions.some((permission) => !permission.trim()) || requiredPermissions.some((permission) => !authorizedPermissions.has(permission))) continue;
    const haystack = new Set(terms(`${document.title} ${document.text}`));
    const score = queryTerms.filter((term) => haystack.has(term)).length / queryTerms.length;
    if (score > 0) hits.push(Object.freeze({ id: document.id, title: document.title, domain: document.domain, score, provenanceRefs: Object.freeze([...document.provenanceRefs]), ...(document.sourceVersion !== undefined ? { sourceVersion: document.sourceVersion } : {}), ...(document.updatedAt !== undefined ? { updatedAt: document.updatedAt } : {}) }));
  }
  return Object.freeze(hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)));
}
