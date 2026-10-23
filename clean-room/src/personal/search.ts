export interface SearchDocument {
  readonly id: string;
  readonly ownerId: string;
  readonly domain: string;
  readonly projectId?: string;
  readonly title: string;
  readonly text: string;
  readonly sensitivityRank: number;
  readonly provenanceRefs: readonly string[];
}

export interface SearchRequest {
  readonly ownerId: string;
  readonly query: string;
  readonly maxSensitivityRank: number;
  readonly allowedDomains: readonly string[];
  readonly allowedProjectIds: readonly string[];
}

export interface SearchHit {
  readonly id: string;
  readonly title: string;
  readonly domain: string;
  readonly score: number;
  readonly provenanceRefs: readonly string[];
}

function terms(value: string): readonly string[] { return value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 1); }

export function federatedSearch(request: SearchRequest, documents: readonly SearchDocument[]): readonly SearchHit[] {
  const queryTerms = terms(request.query);
  if (queryTerms.length === 0) return Object.freeze([]);
  const allowedDomains = new Set(request.allowedDomains);
  const allowedProjects = new Set(request.allowedProjectIds);
  const hits: SearchHit[] = [];
  for (const document of documents) {
    if (document.ownerId !== request.ownerId || document.sensitivityRank > request.maxSensitivityRank || !allowedDomains.has(document.domain)) continue;
    if (document.projectId && !allowedProjects.has(document.projectId)) continue;
    if (document.provenanceRefs.length === 0) continue;
    const haystack = new Set(terms(`${document.title} ${document.text}`));
    const score = queryTerms.filter((term) => haystack.has(term)).length / queryTerms.length;
    if (score > 0) hits.push(Object.freeze({ id: document.id, title: document.title, domain: document.domain, score, provenanceRefs: Object.freeze([...document.provenanceRefs]) }));
  }
  return Object.freeze(hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)));
}
