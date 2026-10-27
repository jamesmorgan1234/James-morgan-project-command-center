import { Registry, type RegistryRecord } from "./registry.js";

export type CapabilityMaturity = "local" | "cross_company_evidence" | "portfolio_candidate" | "portfolio_proven" | "critical_shared_proven";
export type CapabilityProofStatus = "verified" | "rejected" | "stale" | "unknown";
export type CapabilityProofResult = "passed" | "failed" | "inapplicable" | "unknown";

export interface CapabilityProofReceipt {
  readonly id: string;
  readonly evidenceId: string;
  readonly capabilityKey: string;
  readonly capabilityVersion: number;
  readonly methodVersion: string;
  readonly companyId: string;
  readonly independenceKey: string;
  readonly applicability: readonly string[];
  readonly result: CapabilityProofResult;
  readonly status: CapabilityProofStatus;
}

export type CapabilityProofResolver = (proofId: string) => CapabilityProofReceipt | undefined;

export interface CapabilityContract extends RegistryRecord {
  readonly inputVersion: number;
  readonly outputVersion: number;
  readonly compatibleInputVersions: readonly number[];
  readonly compatibleOutputVersions: readonly number[];
  readonly maturity: CapabilityMaturity;
  /** Compatibility/display metadata only. Never qualifies maturity by itself. */
  readonly proofCompanyIds?: readonly string[];
  /** Canonical evidence-backed proof receipts used to qualify non-local maturity. */
  readonly proofEvidenceIds?: readonly string[];
  readonly criticalEvidenceId?: string;
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

function requiredProofCount(maturity: CapabilityMaturity): number {
  if (maturity === "cross_company_evidence") return 2;
  if (maturity === "portfolio_candidate" || maturity === "portfolio_proven" || maturity === "critical_shared_proven") return 3;
  return 0;
}

function resolveQualifiedProofs(contract: CapabilityContract, proofResolver?: CapabilityProofResolver): readonly CapabilityProofReceipt[] {
  const required = requiredProofCount(contract.maturity);
  const proofIds = [...new Set((contract.proofEvidenceIds ?? []).map((item) => item.trim()).filter(Boolean))];
  if (required === 0) return Object.freeze([]);
  if (!proofResolver) throw new Error(`${contract.key} ${contract.maturity} requires a capability proof resolver`);
  if (proofIds.length < required) throw new Error(`${contract.key} ${contract.maturity} requires at least ${required} resolvable proof receipts`);

  const receipts = proofIds.map((id) => {
    const receipt = proofResolver(id);
    if (!receipt) throw new Error(`Capability proof receipt not found: ${id}`);
    if (receipt.id !== id) throw new Error(`Capability proof resolver identity mismatch: ${id}`);
    if (receipt.status !== "verified" || receipt.result !== "passed") throw new Error(`Capability proof is not verified/passed: ${id}`);
    if (receipt.capabilityKey !== contract.key || receipt.capabilityVersion !== contract.version) throw new Error(`Capability proof targets a different capability/version: ${id}`);
    if (!receipt.evidenceId.trim() || !receipt.methodVersion.trim() || !receipt.companyId.trim() || !receipt.independenceKey.trim()) throw new Error(`Capability proof is incomplete: ${id}`);
    if (receipt.applicability.length === 0 || receipt.applicability.some((value) => !value.trim())) throw new Error(`Capability proof lacks applicability: ${id}`);
    return receipt;
  });

  const companies = new Set(receipts.map((receipt) => receipt.companyId));
  const independence = new Set(receipts.map((receipt) => receipt.independenceKey));
  if (companies.size < required) throw new Error(`${contract.key} ${contract.maturity} requires at least ${required} independent company proofs`);
  if (independence.size < required) throw new Error(`${contract.key} ${contract.maturity} requires at least ${required} independent evidence sources`);

  const declaredCompanies = new Set((contract.proofCompanyIds ?? []).map((item) => item.trim()).filter(Boolean));
  if (declaredCompanies.size > 0) {
    if (declaredCompanies.size !== companies.size || [...companies].some((companyId) => !declaredCompanies.has(companyId))) {
      throw new Error(`${contract.key}.proofCompanyIds must match resolved proof receipts`);
    }
  }
  return Object.freeze(receipts.map((receipt) => Object.freeze({ ...receipt, applicability: Object.freeze([...receipt.applicability]) })));
}

export function validateCapabilityContract(contract: CapabilityContract, proofResolver?: CapabilityProofResolver): readonly CapabilityProofReceipt[] {
  if (!contract.key.startsWith("capability:")) throw new Error(`Capability key must start with capability:: ${contract.key}`);
  if (!Number.isSafeInteger(contract.inputVersion) || contract.inputVersion < 1) throw new Error("Capability inputVersion must be positive");
  if (!Number.isSafeInteger(contract.outputVersion) || contract.outputVersion < 1) throw new Error("Capability outputVersion must be positive");
  uniqueNonEmpty(contract.proofCompanyIds ?? [], `${contract.key}.proofCompanyIds`);
  uniqueNonEmpty(contract.proofEvidenceIds ?? [], `${contract.key}.proofEvidenceIds`);
  validateVersions(contract.compatibleInputVersions, `${contract.key}.compatibleInputVersions`);
  validateVersions(contract.compatibleOutputVersions, `${contract.key}.compatibleOutputVersions`);
  if (!contract.compatibleInputVersions.includes(contract.inputVersion)) throw new Error("Current inputVersion must be compatible");
  if (!contract.compatibleOutputVersions.includes(contract.outputVersion)) throw new Error("Current outputVersion must be compatible");
  if (contract.criticalShared && contract.maturity === "local") throw new Error("Critical shared capability cannot be treated as local-only maturity");
  if (contract.maturity === "critical_shared_proven" && (!contract.criticalShared || !contract.criticalEvidenceId?.trim())) {
    throw new Error("Critical shared maturity requires criticalShared=true and stronger critical evidence");
  }
  return resolveQualifiedProofs(contract, proofResolver);
}

export class CapabilityRegistry {
  readonly #registry = new Registry<CapabilityContract>();
  readonly #proofResolver: CapabilityProofResolver | undefined;

  constructor(options: { readonly proofResolver?: CapabilityProofResolver } = {}) {
    this.#proofResolver = options.proofResolver;
  }

  register(contract: CapabilityContract): void {
    const proofs = validateCapabilityContract(contract, this.#proofResolver);
    const proofCompanyIds = proofs.length ? [...new Set(proofs.map((receipt) => receipt.companyId))].sort() : [...(contract.proofCompanyIds ?? [])];
    this.#registry.register(Object.freeze({
      ...contract,
      compatibleInputVersions: Object.freeze([...contract.compatibleInputVersions]),
      compatibleOutputVersions: Object.freeze([...contract.compatibleOutputVersions]),
      proofCompanyIds: Object.freeze(proofCompanyIds),
      ...(contract.proofEvidenceIds ? { proofEvidenceIds: Object.freeze([...contract.proofEvidenceIds]) } : {})
    }));
  }

  replace(contract: CapabilityContract, expectedVersion: number): void {
    const proofs = validateCapabilityContract(contract, this.#proofResolver);
    const proofCompanyIds = proofs.length ? [...new Set(proofs.map((receipt) => receipt.companyId))].sort() : [...(contract.proofCompanyIds ?? [])];
    this.#registry.replace(Object.freeze({
      ...contract,
      compatibleInputVersions: Object.freeze([...contract.compatibleInputVersions]),
      compatibleOutputVersions: Object.freeze([...contract.compatibleOutputVersions]),
      proofCompanyIds: Object.freeze(proofCompanyIds),
      ...(contract.proofEvidenceIds ? { proofEvidenceIds: Object.freeze([...contract.proofEvidenceIds]) } : {})
    }), expectedVersion);
  }

  get(key: string): CapabilityContract | undefined { return this.#registry.get(key); }
  list(): readonly CapabilityContract[] { return this.#registry.list(); }
  has(key: string): boolean { return this.#registry.get(key) !== undefined; }

  enable(key: string, expectedVersion: number, nextVersion: number): CapabilityContract {
    const current = this.#registry.get(key);
    if (!current) throw new Error(`Capability does not exist: ${key}`);
    if (current.enabled) throw new Error(`Capability already enabled: ${key}`);
    this.replace({ ...current, version: nextVersion, enabled: true }, expectedVersion);
    return this.#registry.get(key)!;
  }

  disable(key: string, expectedVersion: number, nextVersion: number): CapabilityContract {
    const current = this.#registry.get(key);
    if (!current) throw new Error(`Capability does not exist: ${key}`);
    if (!current.enabled) throw new Error(`Capability already disabled: ${key}`);
    this.replace({ ...current, version: nextVersion, enabled: false }, expectedVersion);
    return this.#registry.get(key)!;
  }

  unregister(key: string, expectedVersion: number): CapabilityContract {
    return this.#registry.remove(key, expectedVersion);
  }

  assertCompatible(key: string, inputVersion: number, outputVersion: number): CapabilityContract {
    const contract = this.#registry.get(key);
    if (!contract || !contract.enabled) throw new Error(`Capability unavailable: ${key}`);
    if (!contract.compatibleInputVersions.includes(inputVersion)) throw new Error(`Capability input version incompatible: ${key}:${inputVersion}`);
    if (!contract.compatibleOutputVersions.includes(outputVersion)) throw new Error(`Capability output version incompatible: ${key}:${outputVersion}`);
    return contract;
  }
}
