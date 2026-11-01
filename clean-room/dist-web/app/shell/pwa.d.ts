/** PWA lifecycle: manifest identity, scope, freshness, offline separation, updates and health. */
export declare function manifestId(id: string): string;
export declare function scopeStrategy(scope: string, startUrl: string): {
    readonly scope: string;
    readonly startUrl: string;
};
export declare function staleDataIndicator(lastSync: string, now: string, maxAgeMs: number): {
    readonly stale: boolean;
    readonly ageMs: number;
};
export declare function offlineStateSeparated(state: string): string;
export declare function updateFailureHandling(attempt: number): "retry" | "manual";
export declare function detectStaleClient(clientBuild: string, serverBuild: string): "current" | "stale";
export declare function healthDiagnostics(record: {
    readonly manifest: boolean;
    readonly serviceWorker: boolean;
    readonly cache: string;
}): {
    readonly healthy: boolean;
    readonly cache: string;
};
export declare function blackSystemSurface(color: string): string;
