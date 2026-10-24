import type { EnvironmentName } from "./config.js";

export interface ExecutionScope {
  readonly ownerId: string;
  readonly environment: EnvironmentName;
  readonly projectId?: string;
  readonly companyId?: string;
  readonly accountId?: string;
}

export function validateExecutionScope(scope: ExecutionScope): ExecutionScope {
  if (!scope.ownerId.trim()) throw new Error("Execution scope ownerId is required");
  if (scope.projectId !== undefined && !scope.projectId.trim()) throw new Error("Execution scope projectId cannot be empty");
  if (scope.companyId !== undefined && !scope.companyId.trim()) throw new Error("Execution scope companyId cannot be empty");
  if (scope.accountId !== undefined && !scope.accountId.trim()) throw new Error("Execution scope accountId cannot be empty");
  return Object.freeze({ ...scope });
}

export function executionScopeKey(scope: ExecutionScope): string {
  validateExecutionScope(scope);
  return [scope.ownerId, scope.companyId ?? "-", scope.projectId ?? "-", scope.accountId ?? "-", scope.environment].join("|");
}

export function scopeContains(parent: ExecutionScope, child: ExecutionScope): boolean {
  validateExecutionScope(parent);
  validateExecutionScope(child);
  if (parent.ownerId !== child.ownerId || parent.environment !== child.environment) return false;
  if (parent.companyId !== undefined && parent.companyId !== child.companyId) return false;
  if (parent.projectId !== undefined && parent.projectId !== child.projectId) return false;
  if (parent.accountId !== undefined && parent.accountId !== child.accountId) return false;
  return true;
}

export function assertScopeContains(parent: ExecutionScope, child: ExecutionScope): void {
  if (!scopeContains(parent, child)) throw new Error("Execution scope amplification or mismatch blocked");
}
