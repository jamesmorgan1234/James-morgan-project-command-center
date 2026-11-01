export function evaluateOwnerPrecedent(precedent, current) {
    const differences = Object.entries(precedent.context).filter(([key, value]) => current[key] !== value).map(([key]) => key);
    if (!precedent.reusableAsDefault)
        return Object.freeze({ applies: false, reason: "precedent_not_reusable", authorizationInherited: false });
    if (differences.length > 0)
        return Object.freeze({ applies: false, reason: `material_context_difference:${differences.join(",")}`, authorizationInherited: false });
    return Object.freeze({ applies: true, reason: "same_material_context_default_only", authorizationInherited: false });
}
//# sourceMappingURL=precedent.js.map