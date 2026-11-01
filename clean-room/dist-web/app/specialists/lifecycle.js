import { assertIdentifierKind } from "../kernel/identifiers.js";
function refs(values, label, required = true) {
    if (!Array.isArray(values) || (required && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} required`);
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
    return Object.freeze(normalized);
}
export class SpecialistLifecycleRegistry {
    #types = new Map();
    #projects = new Map();
    #canonicalOwners = new Map();
    registerType(input) {
        if (input.truthOwner !== `specialist:${input.typeKey}` || input.isolationClass !== `specialist:${input.typeKey}`)
            throw new Error("specialist registration cannot override canonical truth ownership or isolation class");
        if (!input.typeKey.trim() || !input.truthOwner.trim() || !input.isolationClass.trim())
            throw new Error("specialist type identity/truth owner/isolation class required");
        const requiredProviderCapabilities = refs(input.requiredProviderCapabilities, "specialist required provider capabilities", false);
        const sourceRefs = refs(input.sourceRefs, "specialist type source refs");
        const prior = this.#types.get(input.typeKey);
        if (prior && (prior.truthOwner !== input.truthOwner || prior.isolationClass !== input.isolationClass))
            throw new Error("specialist type authority cannot be silently substituted");
        const frozen = Object.freeze({ ...input, requiredProviderCapabilities, sourceRefs });
        this.#types.set(input.typeKey, frozen);
        return frozen;
    }
    registerProject(input) {
        if (!input.id.trim() || !input.ownerId.trim() || !input.projectId.trim() || !input.typeKey.trim() || !input.displayName.trim() || !input.canonicalRef.trim())
            throw new Error("specialist lifecycle project identity/type/display/canonical ref required");
        if (!["active", "dormant"].includes(input.status) || input.replacedByProjectId !== undefined)
            throw new Error("new specialist project must start active or dormant without forged replacement lineage");
        if (!this.#types.has(input.typeKey))
            throw new Error("unregistered specialist type");
        const providerCapabilities = refs(input.providerCapabilities, "specialist provider capabilities", false);
        const sourceRefs = refs(input.sourceRefs, "specialist lifecycle source refs");
        const key = JSON.stringify([input.ownerId, input.projectId]);
        const prior = this.#projects.get(key);
        if (prior)
            throw new Error("specialist lifecycle project already exists");
        const canonicalKey = JSON.stringify([input.ownerId, input.canonicalRef]);
        const canonicalOwner = this.#canonicalOwners.get(canonicalKey);
        if (canonicalOwner && canonicalOwner !== input.projectId)
            throw new Error("specialist canonical truth is isolated to another project");
        const frozen = Object.freeze({ ...input, providerCapabilities, sourceRefs });
        this.#projects.set(key, frozen);
        this.#canonicalOwners.set(canonicalKey, input.projectId);
        return frozen;
    }
    get(ownerId, projectId) {
        const project = this.#projects.get(JSON.stringify([ownerId, projectId]));
        if (!project)
            throw new Error("unknown specialist lifecycle project");
        return project;
    }
    rename(ownerId, projectId, displayName, authorization) {
        const current = this.get(ownerId, projectId);
        this.assertAuthorization(authorization, current, "rename");
        if (current.status === "archived" || current.status === "replaced")
            throw new Error("inactive specialist cannot be renamed");
        if (!displayName.trim())
            throw new Error("specialist display name required");
        return this.replace(current, Object.freeze({ ...current, displayName: displayName.trim() }));
    }
    setDormant(ownerId, projectId) {
        const current = this.get(ownerId, projectId);
        if (current.status === "archived" || current.status === "replaced")
            throw new Error("archived/replaced specialist cannot become dormant");
        return this.replace(current, Object.freeze({ ...current, status: "dormant" }));
    }
    activate(ownerId, projectId, availableProviderCapabilities, authorization) {
        const current = this.get(ownerId, projectId);
        this.assertAuthorization(authorization, current, "activate");
        if (current.status !== "dormant")
            throw new Error("only dormant specialist can be activated");
        const type = this.#types.get(current.typeKey);
        const available = new Set(availableProviderCapabilities);
        if (!type.requiredProviderCapabilities.every((capability) => available.has(capability)))
            throw new Error("specialist activation blocked by unavailable required provider capability");
        return this.replace(current, Object.freeze({ ...current, status: "active", providerCapabilities: Object.freeze([...new Set(availableProviderCapabilities)]) }));
    }
    assessProvider(ownerId, projectId, providerCapability, health, sourceRefs) {
        const current = this.get(ownerId, projectId);
        if (!providerCapability.trim() || !current.providerCapabilities.includes(providerCapability))
            throw new Error("provider capability is not bound to specialist project");
        return Object.freeze({ projectId, providerCapability, health, isolatedFailure: health !== "available", sourceRefs: refs(sourceRefs, "specialist provider assessment source refs") });
    }
    merge(ownerId, sourceProjectId, targetProjectId, authorization) {
        const source = this.get(ownerId, sourceProjectId);
        const target = this.get(ownerId, targetProjectId);
        this.assertAuthorization(authorization, source, "merge", targetProjectId);
        if (sourceProjectId === targetProjectId || target.status === "archived" || target.status === "replaced")
            throw new Error("specialist merge requires distinct live target");
        if (source.typeKey !== target.typeKey)
            throw new Error("specialist merge cannot cross specialist types");
        if (source.status === "archived" || source.status === "replaced")
            throw new Error("inactive source specialist cannot be merged");
        const replaced = this.replace(source, Object.freeze({ ...source, status: "replaced", replacedByProjectId: targetProjectId }));
        return Object.freeze([replaced, target]);
    }
    replaceProject(ownerId, projectId, replacement, authorization) {
        const current = this.get(ownerId, projectId);
        this.assertAuthorization(authorization, current, "replace", replacement.projectId);
        if (current.status === "archived" || current.status === "replaced")
            throw new Error("inactive specialist cannot be replaced");
        if (replacement.ownerId !== ownerId || replacement.typeKey !== current.typeKey)
            throw new Error("specialist replacement must preserve owner and specialist type");
        const next = this.registerProject(replacement);
        const replaced = this.replace(current, Object.freeze({ ...current, status: "replaced", replacedByProjectId: next.projectId }));
        return Object.freeze([replaced, next]);
    }
    archive(ownerId, projectId, authorization) {
        const current = this.get(ownerId, projectId);
        this.assertAuthorization(authorization, current, "archive");
        return this.replace(current, Object.freeze({ ...current, status: "archived" }));
    }
    list(ownerId) {
        const values = [...this.#projects.values()];
        return Object.freeze(ownerId === undefined ? values : values.filter((value) => value.ownerId === ownerId));
    }
    assertAuthorization(authorization, project, action, targetProjectId) {
        try {
            assertIdentifierKind(authorization.authorizationRef, "evidence");
            if (authorization.authorizationRef !== authorization.authorizationRef.trim())
                throw new Error("canonical evidence reference cannot contain surrounding whitespace");
        }
        catch {
            throw new Error("specialist lifecycle action requires exact owner/project/action authorization with canonical evidence reference");
        }
        if (authorization.ownerId !== project.ownerId || authorization.projectId !== project.projectId || authorization.action !== action || (targetProjectId !== undefined && authorization.targetProjectId !== targetProjectId))
            throw new Error("specialist lifecycle action requires exact owner/project/action authorization");
    }
    replace(current, next) {
        this.#projects.set(JSON.stringify([current.ownerId, current.projectId]), next);
        return next;
    }
}
//# sourceMappingURL=lifecycle.js.map