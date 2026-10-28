import { validateSpecialistModel, type SpecialistModelContract } from "../brain/specialists.js";

export interface SpecialistFrameworkContract {
  readonly typeKey: string;
  readonly ownerId: string;
  readonly version: number;
  readonly specialistId: string;
  readonly specialistVersion: number;
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
  if (!contract.specialistId.trim()) throw new Error("specialist framework requires canonical specialist identity");
  if (!Number.isSafeInteger(contract.specialistVersion) || contract.specialistVersion < 1) throw new Error("specialist framework canonical specialist version must be positive");
  if (!Number.isSafeInteger(contract.version) || contract.version < 1) throw new Error("specialist framework version must be positive");
  if (Object.keys(contract.capabilityOwners).length === 0) throw new Error("specialist framework requires capability ownership");
  if (contract.dataContracts.length === 0 || contract.detailSections.length === 0 || contract.sourceRefs.length === 0) throw new Error("specialist framework requires data/detail/provenance contracts");
  for (const [capability, owner] of Object.entries(contract.capabilityOwners)) if (!capability.trim() || !owner.trim()) throw new Error("specialist capability ownership invalid");
  const freeze = (values: readonly string[]) => Object.freeze([...new Set(values.map((value) => value.trim()))]);
  return Object.freeze({ ...contract, capabilityOwners: Object.freeze({ ...contract.capabilityOwners }), dataContracts: freeze(contract.dataContracts), brainHooks: freeze(contract.brainHooks), agencyHooks: freeze(contract.agencyHooks), detailSections: freeze(contract.detailSections), metricKeys: freeze(contract.metricKeys), providerAdapters: freeze(contract.providerAdapters), sourceRefs: freeze(contract.sourceRefs) });
}

export function validateCanonicalSpecialistFrameworkContract(contract: SpecialistFrameworkContract, model: SpecialistModelContract): SpecialistFrameworkContract {
  const valid = validateSpecialistFrameworkContract(contract);
  validateSpecialistModel(model);
  if (valid.specialistId !== model.key || valid.specialistVersion !== model.version) throw new Error("specialist framework must reference the exact canonical specialist identity/version");
  if (model.controlPlane !== "command_center") throw new Error("Command Center must remain the specialist framework control plane");
  return valid;
}

export class SpecialistFrameworkRegistry {
  readonly #types = new Map<string, SpecialistFrameworkContract>();

  register(contract: SpecialistFrameworkContract, model: SpecialistModelContract): SpecialistFrameworkContract {
    const valid = validateCanonicalSpecialistFrameworkContract(contract, model);
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
