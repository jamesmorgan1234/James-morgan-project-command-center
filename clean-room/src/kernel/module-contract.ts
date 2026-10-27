import { Registry } from "./registry.js";

export type SecurityClass = "public" | "internal" | "sensitive" | "protected" | "secret";
export type ModuleActivation = "startup" | "on-demand" | "manual";
export type ModuleFailureBehavior = "fail-closed" | "isolate" | "degrade";

export interface ModuleContract {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly owner: string;
  readonly ownsData: readonly string[];
  readonly ownsCapabilities: readonly string[];
  readonly usesData: readonly string[];
  readonly usesCapabilities: readonly string[];
  readonly dependencies: readonly string[];
  readonly permissions: readonly string[];
  readonly routes: readonly string[];
  readonly events: readonly string[];
  readonly migrations: readonly string[];
  readonly healthCheckKey: string;
  readonly securityClass: SecurityClass;
  readonly activation: ModuleActivation;
  readonly failureBehavior: ModuleFailureBehavior;
  readonly canDisable: boolean;
  readonly canUninstall: boolean;
  readonly tests: readonly string[];
}

const SECURITY_CLASSES = new Set<SecurityClass>(["public", "internal", "sensitive", "protected", "secret"]);
const ACTIVATION_POLICIES = new Set<ModuleActivation>(["startup", "on-demand", "manual"]);
const FAILURE_BEHAVIORS = new Set<ModuleFailureBehavior>(["fail-closed", "isolate", "degrade"]);

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
  if (!contract.owner.trim()) throw new Error(`Module owner is required: ${contract.key}`);
  if (contract.dependencies.includes(contract.key)) throw new Error(`Module cannot depend on itself: ${contract.key}`);
  if (!contract.healthCheckKey.trim()) throw new Error(`Module healthCheckKey is required: ${contract.key}`);
  if (!SECURITY_CLASSES.has(contract.securityClass)) throw new Error(`Invalid module securityClass for ${contract.key}: ${contract.securityClass}`);
  if (!ACTIVATION_POLICIES.has(contract.activation)) throw new Error(`Invalid module activation policy for ${contract.key}: ${contract.activation}`);
  if (!FAILURE_BEHAVIORS.has(contract.failureBehavior)) throw new Error(`Invalid module failure behavior for ${contract.key}: ${contract.failureBehavior}`);
  assertUnique(contract.ownsData, `${contract.key}.ownsData`);
  assertUnique(contract.ownsCapabilities, `${contract.key}.ownsCapabilities`);
  assertUnique(contract.usesData, `${contract.key}.usesData`);
  assertUnique(contract.usesCapabilities, `${contract.key}.usesCapabilities`);
  assertUnique(contract.dependencies, `${contract.key}.dependencies`);
  assertUnique(contract.permissions, `${contract.key}.permissions`);
  assertUnique(contract.routes, `${contract.key}.routes`);
  assertUnique(contract.events, `${contract.key}.events`);
  assertUnique(contract.migrations, `${contract.key}.migrations`);
  assertUnique(contract.tests, `${contract.key}.tests`);
  if (contract.tests.length === 0) throw new Error(`Module tests are required: ${contract.key}`);
}

function assertNoOwnershipOverlap(candidate: ModuleContract, records: readonly ModuleContract[]): void {
  for (const record of records) {
    if (record.key === candidate.key) continue;
    const dataOverlap = candidate.ownsData.find((item) => record.ownsData.includes(item));
    if (dataOverlap) throw new Error(`Module data ownership conflict for ${dataOverlap}: ${candidate.key} vs ${record.key}`);
    const capabilityOverlap = candidate.ownsCapabilities.find((item) => record.ownsCapabilities.includes(item));
    if (capabilityOverlap) throw new Error(`Module capability ownership conflict for ${capabilityOverlap}: ${candidate.key} vs ${record.key}`);
  }
}

function assertAcyclicRecords(records: readonly ModuleContract[]): void {
  const byKey = new Map(records.map((record) => [record.key, record]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): void => {
    if (visited.has(key)) return;
    if (visiting.has(key)) throw new Error(`Module dependency cycle detected at ${key}`);
    visiting.add(key);
    const record = byKey.get(key);
    for (const dependency of record?.dependencies ?? []) visit(dependency);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of byKey.keys()) visit(key);
}

function findDataOwner(records: readonly ModuleContract[], dataKey: string): ModuleContract | undefined {
  return records.find((record) => record.ownsData.includes(dataKey));
}

function findCapabilityOwner(records: readonly ModuleContract[], capabilityKey: string): ModuleContract | undefined {
  return records.find((record) => record.ownsCapabilities.includes(capabilityKey));
}

function assertDeclaredReachIns(records: readonly ModuleContract[]): void {
  for (const record of records) {
    for (const dataKey of record.usesData) {
      const owner = findDataOwner(records, dataKey);
      if (!owner) throw new Error(`Unknown module data reach-in ${dataKey} declared by ${record.key}`);
      if (owner.key !== record.key && !record.dependencies.includes(owner.key)) {
        throw new Error(`Hidden cross-module data reach-in ${dataKey}: ${record.key} must depend on ${owner.key}`);
      }
    }
    for (const capabilityKey of record.usesCapabilities) {
      const owner = findCapabilityOwner(records, capabilityKey);
      if (!owner) throw new Error(`Unknown module capability reach-in ${capabilityKey} declared by ${record.key}`);
      if (owner.key !== record.key && !record.dependencies.includes(owner.key)) {
        throw new Error(`Hidden cross-module capability reach-in ${capabilityKey}: ${record.key} must depend on ${owner.key}`);
      }
    }
  }
}

function assertEnabledDependencies(records: readonly ModuleContract[]): void {
  const byKey = new Map(records.map((record) => [record.key, record]));
  for (const record of records) {
    if (!record.enabled) continue;
    for (const dependencyKey of record.dependencies) {
      const dependency = byKey.get(dependencyKey);
      if (!dependency?.enabled) throw new Error(`Enabled module dependency is not enabled: ${record.key} -> ${dependencyKey}`);
    }
  }
}

function assertRecordSet(records: readonly ModuleContract[]): void {
  assertAcyclicRecords(records);
  assertDeclaredReachIns(records);
  assertEnabledDependencies(records);
}

export class ModuleRegistry {
  readonly #registry = new Registry<ModuleContract>();

  install(contract: ModuleContract): void { this.register(contract); }

  register(contract: ModuleContract): void {
    validateModuleContract(contract);
    const currentRecords = this.#registry.list();
    for (const dependency of contract.dependencies) {
      if (!this.#registry.get(dependency)) throw new Error(`Unknown module dependency ${dependency} for ${contract.key}`);
    }
    assertNoOwnershipOverlap(contract, currentRecords);
    assertRecordSet([...currentRecords, contract]);
    this.#registry.register(contract);
  }

  replace(contract: ModuleContract, expectedVersion: number): void {
    validateModuleContract(contract);
    const current = this.#registry.get(contract.key);
    if (current?.enabled && !contract.enabled && !current.canDisable) throw new Error(`Module cannot be disabled: ${contract.key}`);
    for (const dependency of contract.dependencies) {
      if (dependency !== contract.key && !this.#registry.get(dependency)) throw new Error(`Unknown module dependency ${dependency} for ${contract.key}`);
    }
    const currentRecords = this.#registry.list();
    assertNoOwnershipOverlap(contract, currentRecords);
    const proposedRecords = currentRecords.map((record) => record.key === contract.key ? contract : record);
    assertRecordSet(proposedRecords);
    this.#registry.replace(contract, expectedVersion);
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

  assertDataAccess(moduleKey: string, dataKey: string): void {
    const module = this.#required(moduleKey);
    if (module.ownsData.includes(dataKey)) return;
    if (!module.usesData.includes(dataKey)) throw new Error(`Undeclared cross-module data reach-in ${dataKey} by ${moduleKey}`);
    const owner = findDataOwner(this.#registry.list(), dataKey);
    if (!owner || !module.dependencies.includes(owner.key)) throw new Error(`Unauthorized cross-module data reach-in ${dataKey} by ${moduleKey}`);
  }

  assertCapabilityAccess(moduleKey: string, capabilityKey: string): void {
    const module = this.#required(moduleKey);
    if (module.ownsCapabilities.includes(capabilityKey)) return;
    if (!module.usesCapabilities.includes(capabilityKey)) throw new Error(`Undeclared cross-module capability reach-in ${capabilityKey} by ${moduleKey}`);
    const owner = findCapabilityOwner(this.#registry.list(), capabilityKey);
    if (!owner || !module.dependencies.includes(owner.key)) throw new Error(`Unauthorized cross-module capability reach-in ${capabilityKey} by ${moduleKey}`);
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
}
