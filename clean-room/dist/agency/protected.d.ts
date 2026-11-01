export interface JobCredentialReference {
    readonly id: string;
    readonly provider: string;
    readonly allowedScopes: readonly string[];
    readonly projectId: string;
}
export interface ProtectedPreflight {
    readonly projectId: string;
    readonly projectLockProjectId: string;
    readonly requestedScopes: readonly string[];
    readonly credential: JobCredentialReference;
    readonly toolHealthy: boolean;
    readonly authorizationFresh: boolean;
    readonly protectedActionAuthorized: boolean;
}
export declare function assertProtectedPreflight(input: ProtectedPreflight): void;
