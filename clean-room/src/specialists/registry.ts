import { validateCanonicalSpecialistProjection, validateSpecialistContract, type SpecialistProjectProfile } from "./contracts.js";
import type { SpecialistModelContract } from "../brain/specialists.js";

function freezeProfile(profile: SpecialistProjectProfile): SpecialistProjectProfile {
  const result: SpecialistProjectProfile = Object.freeze({
    ...profile,
    contract: validateSpecialistContract(profile.contract),
    sourceRefs: Object.freeze([...profile.sourceRefs]),
    ...(profile.workClasses === undefined ? {} : { workClasses: Object.freeze([...profile.workClasses]) }),
    ...(profile.dataClasses === undefined ? {} : { dataClasses: Object.freeze([...profile.dataClasses]) }),
    ...(profile.capabilityKeys === undefined ? {} : { capabilityKeys: Object.freeze([...profile.capabilityKeys]) }),
    ...(profile.permissionKeys === undefined ? {} : { permissionKeys: Object.freeze([...profile.permissionKeys]) })
  });
  return result;
}

export class SpecialistRegistry {
  readonly #profiles = new Map<string, SpecialistProjectProfile>();
  readonly #types = new Set<string>();

  registerType(typeKey: string): void {
    const key = typeKey.trim();
    if (!key) throw new Error("specialist type key required");
    this.#types.add(key);
  }

  /** Legacy C6 projection registration retained until every project has a PIF.3 canonical specialist reference. */
  register(profile: SpecialistProjectProfile): void {
    this.#assertBaseProfile(profile);
    this.#store(profile);
  }

  /** PIF.3 path: project profile is only a scoped projection of the canonical Brain-owned specialist. */
  registerCanonical(profile: SpecialistProjectProfile, model: SpecialistModelContract): void {
    this.#assertBaseProfile(profile);
    validateCanonicalSpecialistProjection(profile, model);
    this.#store(profile);
  }

  get(projectId: string): SpecialistProjectProfile | undefined { return this.#profiles.get(projectId); }

  remove(projectId: string): SpecialistProjectProfile {
    const profile = this.#profiles.get(projectId);
    if (!profile) throw new Error(`Unknown specialist project: ${projectId}`);
    this.#profiles.delete(projectId);
    return profile;
  }

  list(): readonly SpecialistProjectProfile[] { return Object.freeze([...this.#profiles.values()]); }

  #assertBaseProfile(profile: SpecialistProjectProfile): void {
    if (!this.#types.has(profile.typeKey)) throw new Error(`Unregistered specialist type: ${profile.typeKey}`);
    if (!profile.projectId.trim() || !profile.displayName.trim() || profile.sourceRefs.length === 0) throw new Error("specialist project identity/display/source required");
    validateSpecialistContract(profile.contract);
    const prior = this.#profiles.get(profile.projectId);
    if (prior && prior.typeKey !== profile.typeKey) throw new Error("specialist project type cannot silently change");
    if (prior) throw new Error(`specialist project already exists: ${profile.projectId}`);
  }

  #store(profile: SpecialistProjectProfile): void {
    this.#profiles.set(profile.projectId, freezeProfile(profile));
  }
}
