export interface AgencyExecutor {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly environments: readonly ("normal_chat" | "work" | "deterministic")[];
  readonly capabilities: readonly string[];
  readonly projectTypeKeys: readonly string[];
  readonly permissionScopes: readonly string[];
  readonly costClass: "free" | "paid" | "unknown";
  readonly health: "available" | "degraded" | "unavailable";
  readonly verificationStrategy: "self_evidence" | "independent" | "external";
  readonly maxRisk: "low" | "medium" | "high";
}

const RISK_RANK = Object.freeze({ low: 0, medium: 1, high: 2, critical: 3 } as const);

export class AgencyExecutorRegistry {
  readonly #executors = new Map<string, AgencyExecutor>();

  register(executor: AgencyExecutor): void {
    if (!executor.key.startsWith("executor:")) throw new Error(`Executor key must start with executor:: ${executor.key}`);
    if (!Number.isSafeInteger(executor.version) || executor.version < 1) throw new Error("Executor version must be positive");
    if (this.#executors.has(executor.key)) throw new Error(`Executor already exists: ${executor.key}`);
    this.#executors.set(executor.key, Object.freeze({ ...executor, environments: Object.freeze([...executor.environments]), capabilities: Object.freeze([...executor.capabilities]), projectTypeKeys: Object.freeze([...executor.projectTypeKeys]), permissionScopes: Object.freeze([...executor.permissionScopes]) }));
  }

  remove(key: string, expectedVersion: number): AgencyExecutor {
    const executor = this.#executors.get(key);
    if (!executor) throw new Error(`Unknown executor: ${key}`);
    if (executor.version !== expectedVersion) throw new Error(`Executor version conflict: ${key}`);
    this.#executors.delete(key);
    return executor;
  }

  eligible(input: { capability: string; projectTypeKey: string; environment: "normal_chat" | "work" | "deterministic"; risk: "low" | "medium" | "high" | "critical"; allowPaid: boolean }): readonly AgencyExecutor[] {
    return Object.freeze([...this.#executors.values()].filter((executor) => executor.enabled && executor.health !== "unavailable" && executor.capabilities.includes(input.capability) && executor.environments.includes(input.environment) && (executor.projectTypeKeys.length === 0 || executor.projectTypeKeys.includes(input.projectTypeKey)) && (input.allowPaid || executor.costClass !== "paid") && RISK_RANK[input.risk] <= RISK_RANK[executor.maxRisk]));
  }
}
