export interface SpecialistFrameworkContract {
  readonly typeKey: string;
  readonly ownerId: string;
  readonly version: number;
  readonly capabilityOwners: Readonly<Record<string, string>>;
  readonly dataContracts: readonly string[];
  readonly brainHooks: readonly string[];
  readonly agencyHooks: readonly string[];
  readonly detailSections: readonly string[];
  readonly metricKeys: readonly string[];
  readonly providerAdapters: readonly string[];
  readonly isolationClass: string;
  readonly sourceRefs: readonly string[];
}

export function validateSpecialistFrameworkContract(contract: SpecialistFrameworkContract): SpecialistFrameworkContract {
  if (!contract.typeKey.trim() || !contract.ownerId.trim() || !contract.isolationClass.trim()) throw new Error("specialist framework identity/owner/isolation required");
  if (!Number.isSafeInteger(contract.version) || contract.version < 1) throw new Error("specialist framework version must be positive");
  if (Object.keys(contract.capabilityOwners).length === 0) throw new Error("specialist framework requires capability ownership");
  if (contract.dataContracts.length === 0 || contract.detailSections.length === 0 || contract.sourceRefs.length === 0) throw new Error("specialist framework requires data/detail/provenance contracts");
  for (const [capability, owner] of Object.entries(contract.capabilityOwners)) if (!capability.trim() || !owner.trim()) throw new Error("specialist capability ownership invalid");
  const freeze = (values: readonly string[]) => Object.freeze([...new Set(values.map((value) => value.trim()))]);
  return Object.freeze({ ...contract, capabilityOwners: Object.freeze({ ...contract.capabilityOwners }), dataContracts: freeze(contract.dataContracts), brainHooks: freeze(contract.brainHooks), agencyHooks: freeze(contract.agencyHooks), detailSections: freeze(contract.detailSections), metricKeys: freeze(contract.metricKeys), providerAdapters: freeze(contract.providerAdapters), sourceRefs: freeze(contract.sourceRefs) });
}

export class SpecialistFrameworkRegistry {
  readonly #types = new Map<string, SpecialistFrameworkContract>();

  register(contract: SpecialistFrameworkContract): SpecialistFrameworkContract {
    const valid = validateSpecialistFrameworkContract(contract);
    const key = `${valid.ownerId}:${valid.typeKey}`;
    const prior = this.#types.get(key);
    if (prior && valid.version <= prior.version) throw new Error("specialist framework version must advance");
    this.#types.set(key, valid);
    return valid;
  }

  require(ownerId: string, typeKey: string): SpecialistFrameworkContract {
    const contract = this.#types.get(`${ownerId}:${typeKey}`);
    if (!contract) throw new Error("unknown specialist framework type");
    return contract;
  }
}
