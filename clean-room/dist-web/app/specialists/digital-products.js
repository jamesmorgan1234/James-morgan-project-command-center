function refs(values, label, required = true) {
    if (!Array.isArray(values) || (required && values.length === 0) || values.some((value) => !value.trim()))
        throw new Error(`${label} required`);
    return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
export class DigitalProductVentureRegistry {
    #ventures = new Map();
    #storefronts = new Map();
    register(input) {
        if (!input.id.trim() || !input.ownerId.trim() || !input.projectId.trim() || !input.companyId.trim() || !input.storefrontRef.trim() || !input.deliveryProviderRef.trim())
            throw new Error("digital-product venture identity/company/storefront/delivery required");
        const analyticsProviderRefs = refs(input.analyticsProviderRefs, "digital-product analytics providers", false);
        const sourceRefs = refs(input.sourceRefs, "digital-product source refs");
        const key = `${input.ownerId}:${input.projectId}`;
        const prior = this.#ventures.get(key);
        if (prior && (prior.companyId !== input.companyId || prior.storefrontRef !== input.storefrontRef || prior.deliveryProviderRef !== input.deliveryProviderRef))
            throw new Error("digital-product venture provider binding cannot be silently substituted");
        const storefrontOwner = this.#storefronts.get(`${input.ownerId}:${input.storefrontRef}`);
        if (storefrontOwner && storefrontOwner !== input.projectId)
            throw new Error("digital-product storefront is isolated to another venture");
        const frozen = Object.freeze({ ...input, analyticsProviderRefs, sourceRefs });
        this.#ventures.set(key, frozen);
        this.#storefronts.set(`${input.ownerId}:${input.storefrontRef}`, input.projectId);
        return frozen;
    }
    require(ownerId, projectId) { const value = this.#ventures.get(`${ownerId}:${projectId}`); if (!value)
        throw new Error("unknown digital-product venture"); return value; }
}
export function validateDigitalProductArtifact(input, binding) {
    if (input.ownerId !== binding.ownerId || input.projectId !== binding.projectId)
        throw new Error("digital-product artifact cannot cross venture boundary");
    if (!input.id.trim() || !input.productRef.trim() || !input.fileRef.trim() || !input.contentHash.trim() || !input.deliveryRef.trim() || !input.currency.trim())
        throw new Error("digital-product artifact identity/file/hash/delivery/price required");
    if (!Number.isFinite(input.price) || input.price < 0)
        throw new Error("digital-product price invalid");
    return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "digital-product artifact source refs") });
}
export function validateDigitalProductState(input, binding) {
    if (input.ownerId !== binding.ownerId || input.projectId !== binding.projectId)
        throw new Error("digital-product state cannot cross venture boundary");
    if (!input.id.trim() || !input.canonicalRef.trim() || !input.state.trim())
        throw new Error("digital-product state identity/ref/state required");
    return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "digital-product state source refs") });
}
export const DIGITAL_PRODUCT_TRUTH_OWNER = "specialist:digital_products";
//# sourceMappingURL=digital-products.js.map