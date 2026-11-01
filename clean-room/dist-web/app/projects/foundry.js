const NEXT = {
    idea: ["research"],
    research: ["ultimate_spec"],
    ultimate_spec: ["architecture"],
    architecture: ["roadmap"],
    roadmap: ["owner_authorization"],
    owner_authorization: ["agency_execution"],
    agency_execution: ["evidence"],
    evidence: ["acceptance"],
    acceptance: ["post_launch"],
    post_launch: []
};
export function advanceFoundry(snapshot, to, evidenceRef, ownerAuthorizationRef) {
    if (!NEXT[snapshot.stage].includes(to))
        throw new Error(`Invalid Foundry transition: ${snapshot.stage} -> ${to}`);
    if (!evidenceRef.trim())
        throw new Error("Foundry transition requires evidence");
    let authorization = snapshot.ownerAuthorizationRef;
    if (to === "agency_execution") {
        authorization = ownerAuthorizationRef ?? snapshot.ownerAuthorizationRef;
        if (!authorization?.trim())
            throw new Error("Agency execution requires exact owner authorization reference");
    }
    return Object.freeze({ ...snapshot, stage: to, artifactRefs: Object.freeze([...snapshot.artifactRefs, evidenceRef]), ...(authorization ? { ownerAuthorizationRef: authorization } : {}) });
}
//# sourceMappingURL=foundry.js.map