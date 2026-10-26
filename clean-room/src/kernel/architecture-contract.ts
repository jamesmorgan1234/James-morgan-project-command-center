export interface ArchitectureResponsibilityContract {
  readonly responsibility: string;
  readonly owner: string;
  readonly truthSource: string;
  readonly expandable: boolean;
  readonly extensionPath?: string;
  readonly critical: boolean;
  readonly recoveryPath?: string;
  readonly failureBehavior: string;
  readonly verificationPath: string;
}

const CORE_ARCHITECTURE_RESPONSIBILITIES = Object.freeze([
  "startup",
  "router",
  "renderer",
  "scroll",
  "command-runtime",
  "side-effects",
  "module-registry",
  "capability-registry",
  "configuration",
  "governance",
  "authority-ledger",
  "evidence"
] as const);

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

export function validateArchitectureResponsibility(contract: ArchitectureResponsibilityContract): ArchitectureResponsibilityContract {
  required(contract.responsibility, "responsibility");
  required(contract.owner, `${contract.responsibility}.owner`);
  required(contract.truthSource, `${contract.responsibility}.truthSource`);
  required(contract.failureBehavior, `${contract.responsibility}.failureBehavior`);
  required(contract.verificationPath, `${contract.responsibility}.verificationPath`);
  if (contract.expandable) required(contract.extensionPath ?? "", `${contract.responsibility}.extensionPath`);
  if (!contract.expandable && contract.extensionPath?.trim()) throw new Error(`${contract.responsibility}.extensionPath is invalid for a non-expandable responsibility`);
  if (contract.critical) required(contract.recoveryPath ?? "", `${contract.responsibility}.recoveryPath`);
  return Object.freeze({ ...contract });
}

export class ArchitectureResponsibilityRegistry {
  readonly #contracts = new Map<string, ArchitectureResponsibilityContract>();

  register(contract: ArchitectureResponsibilityContract): ArchitectureResponsibilityContract {
    const validated = validateArchitectureResponsibility(contract);
    if (this.#contracts.has(validated.responsibility)) {
      throw new Error(`Architectural responsibility already has an owner: ${validated.responsibility}`);
    }
    this.#contracts.set(validated.responsibility, validated);
    return validated;
  }

  get(responsibility: string): ArchitectureResponsibilityContract | undefined {
    return this.#contracts.get(responsibility);
  }

  list(): readonly ArchitectureResponsibilityContract[] {
    return Object.freeze([...this.#contracts.values()]);
  }

  assertCoreCoverage(): void {
    const missing = CORE_ARCHITECTURE_RESPONSIBILITIES.filter((responsibility) => !this.#contracts.has(responsibility));
    if (missing.length) throw new Error(`Missing architectural responsibility contracts: ${missing.join(",")}`);
    for (const responsibility of CORE_ARCHITECTURE_RESPONSIBILITIES) validateArchitectureResponsibility(this.#contracts.get(responsibility)!);
  }
}

export function createCoreArchitectureResponsibilityRegistry(): ArchitectureResponsibilityRegistry {
  const registry = new ArchitectureResponsibilityRegistry();
  const contracts: readonly ArchitectureResponsibilityContract[] = [
    { responsibility: "startup", owner: "kernel-recovery-shell", truthSource: "runtime startup state", expandable: false, critical: true, recoveryPath: "kernel recovery shell", failureBehavior: "fail closed to recovery", verificationPath: "startup recovery tests" },
    { responsibility: "router", owner: "application-shell", truthSource: "route registry", expandable: true, extensionPath: "route registry registration", critical: true, recoveryPath: "safe route state", failureBehavior: "unknown routes fail safely", verificationPath: "route-state closure tests" },
    { responsibility: "renderer", owner: "application-shell", truthSource: "browser renderer", expandable: true, extensionPath: "registered surface/detail contracts", critical: true, recoveryPath: "single-root shell recovery", failureBehavior: "reject competing renderer ownership", verificationPath: "visual structure tests" },
    { responsibility: "scroll", owner: "navigation-coordinator", truthSource: "navigation coordinator", expandable: false, critical: false, failureBehavior: "reject competing scroll ownership", verificationPath: "navigation ownership tests" },
    { responsibility: "command-runtime", owner: "kernel-command-runtime", truthSource: "typed command/event runtime", expandable: true, extensionPath: "typed handler registration", critical: true, recoveryPath: "deterministic replay/checkpoint", failureBehavior: "unknown commands fail closed", verificationPath: "command runtime tests" },
    { responsibility: "side-effects", owner: "controlled-side-effect-executor", truthSource: "operation journal", expandable: true, extensionPath: "controlled executor dispatch contract", critical: true, recoveryPath: "unknown-outcome reconciliation", failureBehavior: "uncertain effects fail closed", verificationPath: "controlled side-effect tests" },
    { responsibility: "module-registry", owner: "kernel-module-registry", truthSource: "module registry", expandable: true, extensionPath: "ModuleRegistry.register", critical: false, failureBehavior: "invalid ownership/dependency contracts reject", verificationPath: "module registry tests" },
    { responsibility: "capability-registry", owner: "kernel-capability-registry", truthSource: "capability registry", expandable: true, extensionPath: "CapabilityRegistry.register", critical: false, failureBehavior: "incompatible/unproven capabilities reject", verificationPath: "capability registry tests" },
    { responsibility: "configuration", owner: "kernel-config", truthSource: "validated runtime configuration", expandable: true, extensionPath: "versioned configuration contract", critical: true, recoveryPath: "fail-closed recovery startup", failureBehavior: "invalid or mixed environment blocks startup", verificationPath: "configuration compatibility tests" },
    { responsibility: "governance", owner: "kernel-governance", truthSource: "governance decision", expandable: true, extensionPath: "governance policy contract", critical: true, recoveryPath: "deny by default", failureBehavior: "unresolved authority denies action", verificationPath: "governance tests" },
    { responsibility: "authority-ledger", owner: "kernel-authority-ledger", truthSource: "versioned ledger", expandable: true, extensionPath: "versioned ledger append/supersede", critical: true, recoveryPath: "explicit conflict resolution", failureBehavior: "conflicts remain unresolved and non-governing", verificationPath: "authority ledger tests" },
    { responsibility: "evidence", owner: "kernel-evidence", truthSource: "verified evidence records", expandable: true, extensionPath: "evidence record/closure contracts", critical: true, recoveryPath: "resume from verified checkpoint", failureBehavior: "completion without evidence rejects", verificationPath: "evidence verification tests" }
  ];
  for (const contract of contracts) registry.register(contract);
  registry.assertCoreCoverage();
  return registry;
}

export { CORE_ARCHITECTURE_RESPONSIBILITIES };
