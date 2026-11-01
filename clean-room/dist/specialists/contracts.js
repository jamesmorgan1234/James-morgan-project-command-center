import { validateSpecialistProjection } from "../brain/specialists.js";
export function validateSpecialistContract(contract) {
    if (!contract.key.trim() || !contract.truthOwner.trim() || !contract.isolationClass.trim())
        throw new Error("specialist contract identity/ownership/isolation required");
    if (contract.dataDomains.length === 0 || contract.projectDetailSections.length === 0)
        throw new Error("specialist contract must declare owned data and detail surfaces");
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
export function specialistProjectionRequest(profile) {
    if (!profile.specialistId || profile.specialistVersion === undefined)
        throw new Error("Canonical specialist projection requires specialist identity/version");
    const result = {
        specialistId: profile.specialistId,
        specialistVersion: profile.specialistVersion,
        projectId: profile.projectId,
        workClasses: profile.workClasses ?? [],
        dataClasses: profile.dataClasses ?? profile.contract.dataDomains,
        capabilityKeys: profile.capabilityKeys ?? profile.contract.brainCapabilities,
        permissionKeys: profile.permissionKeys ?? profile.contract.providerCapabilities
    };
    if (profile.companyId !== undefined)
        result.companyId = profile.companyId;
    return Object.freeze(result);
}
export function validateCanonicalSpecialistProjection(profile, model) {
    validateSpecialistProjection(model, specialistProjectionRequest(profile));
    if (profile.contract.truthOwner !== `specialist:${profile.typeKey}`)
        throw new Error("Project projection cannot override canonical specialist truth ownership");
    if (profile.contract.isolationClass !== `specialist:${profile.typeKey}`)
        throw new Error("Project projection cannot override canonical specialist isolation class");
    return profile;
}
//# sourceMappingURL=contracts.js.map