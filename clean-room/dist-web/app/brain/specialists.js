import { assertIdentifierKind } from "../kernel/identifiers.js";
import { Registry } from "../kernel/registry.js";
const freezeStrings = (values) => Object.freeze([...values]);
function requireUniqueNonblank(values, label, requireOne = false) {
    if (requireOne && values.length === 0)
        throw new Error(`${label} requires at least one value`);
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => value.length === 0))
        throw new Error(`${label} cannot contain blank values`);
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
}
function requireScore(value, label) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
        throw new Error(`${label} must be between 0 and 1`);
}
function requireIso(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be a valid timestamp`);
}
function assertEvidenceIds(values, label, requireOne = false) {
    requireUniqueNonblank(values, label, requireOne);
    for (const id of values)
        assertIdentifierKind(id, "evidence");
}
function assertAuthority(authority) {
    if (authority.actor !== "owner" && authority.actor !== "command_center")
        throw new Error("Specialists cannot mutate, self-promote, or expand their own authority");
    assertEvidenceIds(authority.evidenceIds, "Specialist control authority evidence", true);
}
function freezeModel(model) {
    return Object.freeze({
        ...model,
        subdomains: freezeStrings(model.subdomains),
        supportedCompanyIds: freezeStrings(model.supportedCompanyIds),
        supportedProjectIds: freezeStrings(model.supportedProjectIds),
        supportedWorkClasses: freezeStrings(model.supportedWorkClasses),
        strengths: freezeStrings(model.strengths),
        weaknesses: freezeStrings(model.weaknesses),
        capabilityKeys: freezeStrings(model.capabilityKeys),
        methodIds: freezeStrings(model.methodIds),
        permissionKeys: freezeStrings(model.permissionKeys),
        protectedActionBoundaries: freezeStrings(model.protectedActionBoundaries),
        dataClasses: freezeStrings(model.dataClasses),
        toolKeys: freezeStrings(model.toolKeys),
        providerKeys: freezeStrings(model.providerKeys),
        modelAssignments: Object.freeze(model.modelAssignments.map((assignment) => Object.freeze({ ...assignment }))),
        dependencyVersionRefs: freezeStrings(model.dependencyVersionRefs),
        evaluationEvidenceIds: freezeStrings(model.evaluationEvidenceIds),
        failureModes: freezeStrings(model.failureModes),
        degradedModes: freezeStrings(model.degradedModes),
        fallbackSpecialistIds: freezeStrings(model.fallbackSpecialistIds),
        delegationTargets: freezeStrings(model.delegationTargets),
        provenanceEvidenceIds: freezeStrings(model.provenanceEvidenceIds)
    });
}
export function validateSpecialistModel(model) {
    assertIdentifierKind(model.key, "brain");
    if (model.controlPlane !== "command_center")
        throw new Error("Command Center must remain the controlling specialist control plane");
    if (!model.domain.trim())
        throw new Error("Specialist domain is required");
    if (!Number.isInteger(model.version) || model.version < 1)
        throw new Error("Specialist version must be a positive integer");
    const arrays = [
        [model.subdomains, "Specialist subdomains", false],
        [model.supportedCompanyIds, "Specialist company scopes", false],
        [model.supportedProjectIds, "Specialist project scopes", false],
        [model.supportedWorkClasses, "Specialist work classes", true],
        [model.strengths, "Specialist strengths", true],
        [model.weaknesses, "Specialist weaknesses", true],
        [model.capabilityKeys, "Specialist capabilities", true],
        [model.permissionKeys, "Specialist permissions", false],
        [model.protectedActionBoundaries, "Specialist protected-action boundaries", true],
        [model.dataClasses, "Specialist data classes", true],
        [model.toolKeys, "Specialist tools", false],
        [model.providerKeys, "Specialist providers", false],
        [model.dependencyVersionRefs, "Specialist dependency versions", true],
        [model.failureModes, "Specialist failure modes", true],
        [model.degradedModes, "Specialist degraded modes", true],
        [model.delegationTargets, "Specialist delegation targets", false]
    ];
    for (const [values, label, requireOne] of arrays)
        requireUniqueNonblank(values, label, requireOne);
    for (const methodId of model.methodIds)
        assertIdentifierKind(methodId, "method");
    for (const fallbackId of model.fallbackSpecialistIds) {
        assertIdentifierKind(fallbackId, "brain");
        if (fallbackId === model.key)
            throw new Error("Specialist cannot fall back to itself");
    }
    assertEvidenceIds(model.evaluationEvidenceIds, "Specialist evaluation evidence", true);
    assertEvidenceIds(model.provenanceEvidenceIds, "Specialist provenance evidence", true);
    assertIdentifierKind(model.rollbackEvidenceId, "evidence");
    requireScore(model.calibrationScore, "Specialist calibration score");
    requireScore(model.historicalAccuracy, "Specialist historical accuracy");
    requireScore(model.reliabilityScore, "Specialist reliability score");
    if (!Number.isFinite(model.latencyMs) || model.latencyMs < 0)
        throw new Error("Specialist latency must be non-negative");
    requireIso(model.revalidatedAt, "Specialist revalidatedAt");
    requireIso(model.revalidateAfter, "Specialist revalidateAfter");
    if (Date.parse(model.revalidateAfter) <= Date.parse(model.revalidatedAt))
        throw new Error("Specialist revalidateAfter must be later than revalidatedAt");
    if (model.lifecycle !== "active" && model.enabled)
        throw new Error("Suspended or retired specialist cannot remain enabled");
    if (model.lifecycle === "retired" && model.learningEligibility !== "none")
        throw new Error("Retired specialist cannot remain learning-eligible");
    for (const assignment of model.modelAssignments) {
        if (!assignment.providerKey.trim() || !assignment.modelId.trim() || !assignment.versionRef.trim())
            throw new Error("Specialist model assignment requires provider/model/version");
        if (!model.providerKeys.includes(assignment.providerKey))
            throw new Error(`Model assignment provider is outside specialist provider scope: ${assignment.providerKey}`);
    }
}
function assertSubset(values, allowed, label) {
    const outside = values.filter((value) => !allowed.includes(value));
    if (outside.length > 0)
        throw new Error(`${label} exceeds canonical specialist authority: ${outside.join(",")}`);
}
export function validateSpecialistProjection(model, projection) {
    if (projection.specialistId !== model.key || projection.specialistVersion !== model.version)
        throw new Error("Project projection must reference the exact canonical specialist identity/version");
    if (model.lifecycle !== "active" || !model.enabled)
        throw new Error("Project projection requires an active canonical specialist");
    if (projection.companyId !== undefined && !model.supportedCompanyIds.includes(projection.companyId))
        throw new Error("Project projection cannot inherit an unrelated company scope");
    if (projection.projectId !== undefined && !model.supportedProjectIds.includes(projection.projectId))
        throw new Error("Project projection cannot inherit an unrelated project scope");
    assertSubset(projection.workClasses, model.supportedWorkClasses, "Project work classes");
    assertSubset(projection.dataClasses, model.dataClasses, "Project data classes");
    assertSubset(projection.capabilityKeys, model.capabilityKeys, "Project capabilities");
    assertSubset(projection.permissionKeys, model.permissionKeys, "Project permissions");
}
export class SpecialistBrainRegistry {
    #brains = new Map();
    #patterns = new Map();
    #models = new Registry();
    /** Legacy C6 registration retained for compatibility; it is not the PIF.3 canonical authority contract. */
    registerBrain(brain) {
        if (!brain.key.startsWith("brain:"))
            throw new Error(`Brain key must start with brain:: ${brain.key}`);
        if (this.#brains.has(brain.key))
            throw new Error(`Brain already exists: ${brain.key}`);
        this.#brains.set(brain.key, Object.freeze({ ...brain, capabilities: Object.freeze([...brain.capabilities]), allowedMemoryKinds: Object.freeze([...brain.allowedMemoryKinds]) }));
    }
    removeBrain(key) {
        const brain = this.#brains.get(key);
        if (!brain)
            throw new Error(`Unknown Brain: ${key}`);
        this.#brains.delete(key);
        return brain;
    }
    registerModel(model, authority) {
        assertAuthority(authority);
        validateSpecialistModel(model);
        this.#models.register(freezeModel(model));
    }
    replaceModel(model, expectedVersion, authority) {
        assertAuthority(authority);
        validateSpecialistModel(model);
        this.#models.replace(freezeModel(model), expectedVersion);
    }
    suspendModel(key, expectedVersion, authority) {
        assertAuthority(authority);
        const current = this.#models.get(key);
        if (!current)
            throw new Error(`Unknown specialist model: ${key}`);
        if (current.lifecycle === "retired")
            throw new Error("Retired specialist cannot be suspended");
        const next = freezeModel({ ...current, version: current.version + 1, enabled: false, lifecycle: "suspended" });
        this.#models.replace(next, expectedVersion);
        return next;
    }
    retireModel(key, expectedVersion, authority) {
        assertAuthority(authority);
        const current = this.#models.get(key);
        if (!current)
            throw new Error(`Unknown specialist model: ${key}`);
        const next = freezeModel({ ...current, version: current.version + 1, enabled: false, lifecycle: "retired", learningEligibility: "none" });
        this.#models.replace(next, expectedVersion);
        return next;
    }
    /** Atomic synchronous canonical batch for evidence-governed split/merge/evolution.
     * Validate every precondition before mutation; JavaScript cannot interleave these writes. */
    applyModelBatch(changes, authority) {
        assertAuthority(authority);
        if (changes.length === 0 || new Set(changes.map(c => c.model.key)).size !== changes.length)
            throw new Error("Specialist batch requires distinct models");
        const frozen = changes.map(change => {
            validateSpecialistModel(change.model);
            const current = this.#models.get(change.model.key);
            if (change.expectedVersion === null ? current !== undefined || change.model.version !== 1 : !current || current.version !== change.expectedVersion || change.model.version !== current.version + 1 || current.lifecycle === "retired")
                throw new Error("Specialist batch version/lifecycle conflict");
            return { model: freezeModel(change.model), expectedVersion: change.expectedVersion };
        });
        for (const change of frozen) {
            if (change.expectedVersion === null)
                this.#models.register(change.model);
            else
                this.#models.replace(change.model, change.expectedVersion);
        }
        return Object.freeze(frozen.map(c => c.model));
    }
    getModel(key) { return this.#models.get(key); }
    listModels() { return this.#models.list(); }
    validateProjection(projection) {
        const model = this.#models.get(projection.specialistId);
        if (!model)
            throw new Error(`Unknown canonical specialist: ${projection.specialistId}`);
        validateSpecialistProjection(model, projection);
    }
    registerPattern(pattern) {
        if (pattern.provenanceRefs.length === 0 || pattern.applicableScopes.length === 0)
            throw new Error("Shared pattern requires provenance and applicability");
        if (this.#patterns.has(pattern.id))
            throw new Error(`Pattern already exists: ${pattern.id}`);
        this.#patterns.set(pattern.id, Object.freeze({ ...pattern, provenanceRefs: Object.freeze([...pattern.provenanceRefs]), applicableScopes: Object.freeze([...pattern.applicableScopes]) }));
    }
    usablePatterns(scope) { return Object.freeze([...this.#patterns.values()].filter((pattern) => !pattern.deprecated && pattern.applicableScopes.includes(scope))); }
}
//# sourceMappingURL=specialists.js.map