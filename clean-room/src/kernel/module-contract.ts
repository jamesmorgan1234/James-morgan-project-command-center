import { Registry } from "./registry.js";

export type SecurityClass = "public" | "internal" | "sensitive" | "protected" | "secret";

export interface ModuleContract {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly ownsData: readonly string[];
  readonly ownsCapabilities: readonly string[];
  readonly dependencies: readonly string[];
  readonly permissions: readonly string[];
  readonly routes: readonly string[];
  readonly events: readonly string[];
  readonly migrations: readonly string[];
  readonly healthCheckKey: string;
  readonly securityClass: SecurityClass;
  readonly canDisable: boolean;
  readonly canUninstall: boolean;
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value.trim()) throw new Error(`${label} cannot contain an empty value`);
    if (seen.has(value)) throw new Error(`${label} contains duplicate value: ${value}`);
    seen.add(value);
  }
}

export function validateModuleContract(contract: ModuleContract): void {
  if (!contract.key.startsWith("mod:")) throw new Error(`Module key must start with mod:: ${contract.key}`);
  if (contract.dependencies.includes(contract.key)) throw new Error(`Module cannot depend on itself: ${contract.key}`);
  if (!contract.healthCheckKey.trim()) throw new Error(`Module healthCheckKey is required: ${contract.key}`);
  assertUnique(contract.ownsData, `${contract.key}.ownsData`);
  assertUnique(contract.ownsCapabilities, `${contract.key}.ownsCapabilities`);
  assertUnique(contract.dependencies, `${contract.key}.dependencies`);
  assertUnique(contract.permissions, `${contract.key}.permissions`);
  assertUnique(contract.routes, `${contract.key}.routes`);
  assertUnique(contract.events, `${contract.key}.events`);
  assertUnique(contract.migrations, `${contract.key}.migrations`);
}

export class ModuleRegistry {
  readonly #registry = new Registry<ModuleContract>();

  install(contract: ModuleContract): void { this.register(contract); }

  register(contract: ModuleContract): void {
    validateModuleContract(contract);
    for (const dependency of contract.dependencies) {
      if (!this.#registry.get(dependency)) throw new Error(`Unknown module dependency ${dependency} for ${contract.key}`);
    }
    this.#registry.register(contract);
    this.#assertAcyclic();
  }

  replace(contract: ModuleContract, expectedVersion: number): void {
    validateModuleContract(contract);
    const current = this.#registry.get(contract.key);
    if (current?.enabled && !contract.enabled && !current.canDisable) throw new Error(`Module cannot be disabled: ${contract.key}`);
    for (const dependency of contract.dependencies) {
      if (dependency !== contract.key && !this.#registry.get(dependency)) throw new Error(`Unknown module dependency ${dependency} for ${contract.key}`);
    }
    this.#registry.replace(contract, expectedVersion);
    this.#assertAcyclic();
  }

  enable(key: string, expectedVersion: number, nextVersion: number): ModuleContract {
    const current = this.#required(key);
    if (current.enabled) throw new Error(`Module is already enabled: ${key}`);
    const next = Object.freeze({ ...current, version: nextVersion, enabled: true });
    this.replace(next, expectedVersion);
    return this.#required(key);
  }

  disable(key: string, expectedVersion: number, nextVersion: number): ModuleContract {
    const current = this.#required(key);
    if (!current.enabled) throw new Error(`Module is already disabled: ${key}`);
    if (!current.canDisable) throw new Error(`Module cannot be disabled: ${key}`);
    const next = Object.freeze({ ...current, version: nextVersion, enabled: false });
    this.replace(next, expectedVersion);
    return this.#required(key);
  }

  get(key: string): ModuleContract | undefined { return this.#registry.get(key); }
  list(): readonly ModuleContract[] { return this.#registry.list(); }

  uninstall(key: string, expectedVersion: number): ModuleContract { return this.remove(key, expectedVersion); }

  remove(key: string, expectedVersion: number): ModuleContract {
    const current = this.#required(key);
    if (!current.canUninstall) throw new Error(`Module cannot be uninstalled: ${key}`);
    const dependents = this.#registry.list().filter((entry) => entry.dependencies.includes(key));
    if (dependents.length > 0) throw new Error(`Cannot remove ${key}; dependents exist: ${dependents.map((d) => d.key).join(",")}`);
    return this.#registry.remove(key, expectedVersion);
  }

  #required(key: string): ModuleContract {
    const current = this.#registry.get(key);
    if (!current) throw new Error(`Unknown module: ${key}`);
    return current;
  }

  #assertAcyclic(): void {
    const records = new Map(this.#registry.list().map((record) => [record.key, record]));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (key: string): void => {
      if (visited.has(key)) return;
      if (visiting.has(key)) throw new Error(`Module dependency cycle detected at ${key}`);
      visiting.add(key);
      const record = records.get(key);
      for (const dependency of record?.dependencies ?? []) visit(dependency);
      visiting.delete(key);
      visited.add(key);
    };
    for (const key of records.keys()) visit(key);
  }
}
