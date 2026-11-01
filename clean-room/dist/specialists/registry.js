import { validateCanonicalSpecialistProjection, validateSpecialistContract } from "./contracts.js";
function freezeProfile(profile) {
    const result = Object.freeze({
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
    #profiles = new Map();
    #types = new Set();
    registerType(typeKey) {
        const key = typeKey.trim();
        if (!key)
            throw new Error("specialist type key required");
        this.#types.add(key);
    }
    /** Legacy C6 projection registration retained until every project has a PIF.3 canonical specialist reference. */
    register(profile) {
        this.#assertBaseProfile(profile);
        this.#store(profile);
    }
    /** PIF.3 path: project profile is only a scoped projection of the canonical Brain-owned specialist. */
    registerCanonical(profile, model) {
        this.#assertBaseProfile(profile);
        validateCanonicalSpecialistProjection(profile, model);
        this.#store(profile);
    }
    get(projectId) { return this.#profiles.get(projectId); }
    remove(projectId) {
        const profile = this.#profiles.get(projectId);
        if (!profile)
            throw new Error(`Unknown specialist project: ${projectId}`);
        this.#profiles.delete(projectId);
        return profile;
    }
    list() { return Object.freeze([...this.#profiles.values()]); }
    #assertBaseProfile(profile) {
        if (!this.#types.has(profile.typeKey))
            throw new Error(`Unregistered specialist type: ${profile.typeKey}`);
        if (!profile.projectId.trim() || !profile.displayName.trim() || profile.sourceRefs.length === 0)
            throw new Error("specialist project identity/display/source required");
        validateSpecialistContract(profile.contract);
        const prior = this.#profiles.get(profile.projectId);
        if (prior && prior.typeKey !== profile.typeKey)
            throw new Error("specialist project type cannot silently change");
        if (prior)
            throw new Error(`specialist project already exists: ${profile.projectId}`);
    }
    #store(profile) {
        this.#profiles.set(profile.projectId, freezeProfile(profile));
    }
}
//# sourceMappingURL=registry.js.map