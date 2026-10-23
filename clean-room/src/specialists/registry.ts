import { validateSpecialistContract, type SpecialistProjectProfile } from "./contracts.js";

export class SpecialistRegistry {
  readonly #profiles = new Map<string, SpecialistProjectProfile>();
  readonly #types = new Set<string>();

  registerType(typeKey: string): void {
    if (!typeKey.trim()) throw new Error("specialist type key required");
    this.#types.add(typeKey);
  }

  register(profile: SpecialistProjectProfile): SpecialistProjectProfile {
    if (!this.#types.has(profile.typeKey)) throw new Error("unregistered specialist type");
    if (!profile.projectId.trim() || !profile.displayName.trim() || profile.sourceRefs.length === 0) throw new Error("specialist project identity/provenance required");
    const contract = validateSpecialistContract(profile.contract);
    const prior = this.#profiles.get(profile.projectId);
    if (prior && prior.typeKey !== profile.typeKey) throw new Error("specialist project type cannot silently change");
    const frozen = Object.freeze({ ...profile, contract, sourceRefs: Object.freeze([...profile.sourceRefs]) });
    this.#profiles.set(profile.projectId, frozen);
    return frozen;
  }

  get(projectId: string): SpecialistProjectProfile {
    const profile = this.#profiles.get(projectId);
    if (!profile) throw new Error(`unknown specialist project: ${projectId}`);
    return profile;
  }

  remove(projectId: string): SpecialistProjectProfile {
    const profile = this.get(projectId);
    this.#profiles.delete(projectId);
    return profile;
  }

  list(): readonly SpecialistProjectProfile[] {
    return Object.freeze([...this.#profiles.values()]);
  }
}
