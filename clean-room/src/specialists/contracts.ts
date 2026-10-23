export interface SpecialistCapabilityContract {
  readonly key: string;
  readonly truthOwner: string;
  readonly dataDomains: readonly string[];
  readonly brainCapabilities: readonly string[];
  readonly agencyCapabilities: readonly string[];
  readonly projectDetailSections: readonly string[];
  readonly metricKeys: readonly string[];
  readonly providerCapabilities: readonly string[];
  readonly isolationClass: string;
}

export interface SpecialistProjectProfile {
  readonly projectId: string;
  readonly typeKey: string;
  readonly displayName: string;
  readonly contract: SpecialistCapabilityContract;
  readonly sourceRefs: readonly string[];
  readonly active: boolean;
}

export function validateSpecialistContract(contract: SpecialistCapabilityContract): SpecialistCapabilityContract {
  if (!contract.key.trim() || !contract.truthOwner.trim() || !contract.isolationClass.trim()) throw new Error("specialist contract identity/ownership/isolation required");
  if (contract.dataDomains.length === 0 || contract.projectDetailSections.length === 0) throw new Error("specialist contract must declare owned data and detail surfaces");
  return Object.freeze({
    ...contract,
    dataDomains: Object.freeze([...contract.dataDomains]),
    brainCapabilities: Object.freeze([...contract.brainCapabilities]),
    agencyCapabilities: Object.freeze([...contract.agencyCapabilities]),
    projectDetailSections: Object.freeze([...contract.projectDetailSections]),
    metricKeys: Object.freeze([...contract.metricKeys]),
    providerCapabilities: Object.freeze([...contract.providerCapabilities])
  });
}
