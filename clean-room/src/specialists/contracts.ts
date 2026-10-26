import type { SpecialistModelContract, SpecialistProjectionRequest } from "../brain/specialists.js";
import { validateSpecialistProjection } from "../brain/specialists.js";

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
  /** PIF.3 canonical authority reference. Legacy C6 profiles may omit until migrated. */
  readonly specialistId?: string;
  readonly specialistVersion?: number;
  readonly companyId?: string;
  readonly workClasses?: readonly string[];
  readonly dataClasses?: readonly string[];
  readonly capabilityKeys?: readonly string[];
  readonly permissionKeys?: readonly string[];
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

export function specialistProjectionRequest(profile: SpecialistProjectProfile): SpecialistProjectionRequest {
  if (!profile.specialistId || profile.specialistVersion === undefined) throw new Error("Canonical specialist projection requires specialist identity/version");
  const result: {
    specialistId: string;
    specialistVersion: number;
    companyId?: string;
    projectId?: string;
    workClasses: readonly string[];
    dataClasses: readonly string[];
    capabilityKeys: readonly string[];
    permissionKeys: readonly string[];
  } = {
    specialistId: profile.specialistId,
    specialistVersion: profile.specialistVersion,
    projectId: profile.projectId,
    workClasses: profile.workClasses ?? [],
    dataClasses: profile.dataClasses ?? profile.contract.dataDomains,
    capabilityKeys: profile.capabilityKeys ?? profile.contract.brainCapabilities,
    permissionKeys: profile.permissionKeys ?? profile.contract.providerCapabilities
  };
  if (profile.companyId !== undefined) result.companyId = profile.companyId;
  return Object.freeze(result);
}

export function validateCanonicalSpecialistProjection(profile: SpecialistProjectProfile, model: SpecialistModelContract): SpecialistProjectProfile {
  validateSpecialistProjection(model, specialistProjectionRequest(profile));
  if (profile.contract.truthOwner !== `specialist:${profile.typeKey}`) throw new Error("Project projection cannot override canonical specialist truth ownership");
  if (profile.contract.isolationClass !== `specialist:${profile.typeKey}`) throw new Error("Project projection cannot override canonical specialist isolation class");
  return profile;
}
