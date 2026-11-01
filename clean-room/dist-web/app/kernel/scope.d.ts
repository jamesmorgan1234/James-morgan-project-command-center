import type { EnvironmentName } from "./config.js";
export interface ExecutionScope {
    readonly ownerId: string;
    readonly environment: EnvironmentName;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly accountId?: string;
}
export declare function validateExecutionScope(scope: ExecutionScope): ExecutionScope;
export declare function executionScopeKey(scope: ExecutionScope): string;
export declare function scopeContains(parent: ExecutionScope, child: ExecutionScope): boolean;
export declare function assertScopeContains(parent: ExecutionScope, child: ExecutionScope): void;
