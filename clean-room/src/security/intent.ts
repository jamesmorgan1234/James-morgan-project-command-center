import { executionScopeKey, validateExecutionScope, type ExecutionScope } from "../kernel/scope.js";

export interface ProtectedIntent {
  readonly action: string;
  readonly ownerId: string;
  readonly scope: ExecutionScope;
  readonly targetResourceId: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly maximumCostCents: number;
}

function normalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Intent parameters cannot contain non-finite numbers");
    return value;
  }
  if (value === undefined || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") throw new Error("Intent parameters contain unsupported value");
  if (typeof value !== "object") throw new Error("Intent parameter type is unsupported");
  if (seen.has(value)) throw new Error("Intent parameters cannot contain cycles");
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => normalize(item, seen));
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) result[key] = normalize((value as Record<string, unknown>)[key], seen);
  return result;
}

export function createIntentBinding(intent: ProtectedIntent): string {
  if (!intent.action.trim() || !intent.ownerId.trim() || !intent.targetResourceId.trim()) throw new Error("Protected intent identity fields are required");
  validateExecutionScope(intent.scope);
  if (intent.ownerId !== intent.scope.ownerId) throw new Error("Protected intent owner/scope mismatch");
  if (!Number.isSafeInteger(intent.maximumCostCents) || intent.maximumCostCents < 0) throw new Error("Protected intent maximumCostCents must be a non-negative safe integer");
  const normalized = normalize({ action: intent.action, ownerId: intent.ownerId, scopeKey: executionScopeKey(intent.scope), targetResourceId: intent.targetResourceId, maximumCostCents: intent.maximumCostCents, parameters: intent.parameters }, new WeakSet<object>());
  return JSON.stringify(normalized);
}

export function assertIntentBinding(intent: ProtectedIntent, authorizedBinding: string): void {
  if (!authorizedBinding.trim()) throw new Error("Authorized intent binding is required");
  if (createIntentBinding(intent) !== authorizedBinding) throw new Error("Protected intent changed after authorization");
}
