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
export declare function federatedSearch(request: SearchRequest, documents: readonly SearchDocument[]): readonly SearchHit[];
