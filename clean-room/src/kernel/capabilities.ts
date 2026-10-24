import { Registry, type RegistryRecord } from "./registry.js";

export type CapabilityMaturity = "local" | "cross_company_evidence" | "portfolio_candidate" | "portfolio_proven" | "critical_shared_proven";

export interface CapabilityContract extends RegistryRecord {
  readonly inputVersion: number;
  readonly outputVersion: number;
  readonly compatibleInputVersions: readonly number[];
  readonly compatibleOutputVersions: readonly number[];
  readonly maturity: CapabilityMaturity;
  readonly proofCompanyIds: readonly string[];
  readonly criticalShared: boolean;
  readonly securityClass: "internal" | "sensitive" | "protected" | "secret";
  readonly canPin: boolean;
  readonly canFork: boolean;
}

function uniqueNonEmpty(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
  if (values.some((value) => !value.trim())) throw new Error(`${label} cannot contain empty values`);
}

function validateVersions(values: readonly number[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
  if (values.some((value) => !Number.isSafeInteger(value) || value < 1)) throw new Error(`${label} must contain positive safe integers`);
}

export function validateCapabilityContract(contract: CapabilityContract): void {
  if (!contract.key.startsWith("capability:")) throw new Error(`Capability key must start with capability:: ${contract.key}`);
  if (!Number.isSafeInteger(contract.inputVersion) || contract.inputVersion < 1) throw new Error("Capability inputVersion must be positive");
  if (!Number.isSafeInteger(contract.outputVersion) || contract.outputVersion < 1) throw new Error("Capability outputVersion must be positive");
  uniqueNonEmpty(contract.proofCompanyIds, `${contract.key}.proofCompanyIds`);
  validateVersions(contract.compatibleInputVersions, `${contract.key}.compatibleInputVersions`);
  validateVersions(contract.compatibleOutputVersions, `${contract.key}.compatibleOutputVersions`);
  if (!contract.compatibleInputVersions.includes(contract.inputVersion)) throw new Error("Current inputVersion must be compatible");
  if (!contract.compatibleOutputVersions.includes(contract.outputVersion)) throw new Error("Current outputVersion must be compatible");
  const proofCount = contract.proofCompanyIds.length;
  if (contract.maturity === "cross_company_evidence" && proofCount < 2) throw new Error("Cross-company maturity requires at least two independent company proofs");
  if ((contract.maturity === "portfolio_candidate" || contract.maturity === "portfolio_proven") && proofCount < 3) throw new Error("Portfolio maturity requires at least three independent company proofs");
  if (contract.maturity === "critical_shared_proven" && (proofCount < 3 || !contract.criticalShared)) throw new Error("Critical shared maturity requires criticalShared=true and at least three independent proofs");
  if (contract.criticalShared && contract.maturity === "local") throw new Error("Critical shared capability cannot be treated as local-only maturity");
}

export class CapabilityRegistry {
  readonly #registry = new Registry<CapabilityContract>();

  register(contract: CapabilityContract): void {
    validateCapabilityContract(contract);
    this.#registry.register(Object.freeze({ ...contract, compatibleInputVersions: Object.freeze([...contract.compatibleInputVersions]), compatibleOutputVersions: Object.freeze([...contract.compatibleOutputVersions]), proofCompanyIds: Object.freeze([...contract.proofCompanyIds]) }));
  }

  replace(contract: CapabilityContract, expectedVersion: number): void {
    validateCapabilityContract(contract);
    this.#registry.replace(Object.freeze({ ...contract, compatibleInputVersions: Object.freeze([...contract.compatibleInputVersions]), compatibleOutputVersions: Object.freeze([...contract.compatibleOutputVersions]), proofCompanyIds: Object.freeze([...contract.proofCompanyIds]) }), expectedVersion);
  }

  get(key: string): CapabilityContract | undefined { return this.#registry.get(key); }
  list(): readonly CapabilityContract[] { return this.#registry.list(); }

  assertCompatible(key: string, inputVersion: number, outputVersion: number): CapabilityContract {
    const contract = this.#registry.get(key);
    if (!contract || !contract.enabled) throw new Error(`Capability unavailable: ${key}`);
    if (!contract.compatibleInputVersions.includes(inputVersion)) throw new Error(`Capability input version incompatible: ${key}:${inputVersion}`);
    if (!contract.compatibleOutputVersions.includes(outputVersion)) throw new Error(`Capability output version incompatible: ${key}:${outputVersion}`);
    return contract;
  }
}
