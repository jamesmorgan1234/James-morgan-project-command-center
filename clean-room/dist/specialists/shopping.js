export const SHOPPING_SPECIALIST_PROFILE = Object.freeze({
    key: "shopping",
    truthOwner: "specialist:shopping",
    privacyClass: "personal_family",
    providerCapabilities: Object.freeze(["offers_read", "loyalty_read"]),
    sourceRefs: Object.freeze(["roadmap:P12.2"])
});
function ts(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} invalid`);
    return parsed;
}
function refs(values, label) {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => !value.trim()))
        throw new Error(`${label} required`);
    return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
export function validateShoppingOffer(offer, now) {
    if (!offer.id.trim() || !offer.ownerId.trim() || !offer.providerKey.trim() || !offer.merchantRef.trim() || !offer.itemRef.trim())
        throw new Error("shopping offer identity required");
    if (!Number.isFinite(offer.amount) || offer.amount < 0)
        throw new Error("shopping offer amount invalid");
    const observedAt = ts(offer.observedAt, "shopping offer observedAt");
    if (offer.expiresAt !== undefined && ts(offer.expiresAt, "shopping offer expiresAt") < observedAt)
        throw new Error("shopping offer expires before observation");
    if (now !== undefined && offer.expiresAt !== undefined && ts(offer.expiresAt, "shopping offer expiresAt") < ts(now, "shopping offer now") && offer.truth === "verified")
        throw new Error("expired shopping offer cannot remain verified");
    return Object.freeze({ ...offer, sourceRefs: refs(offer.sourceRefs, "shopping offer source refs") });
}
export function assessShoppingTrip(option, priority, now) {
    if (!option.merchantRef.trim() || !Number.isFinite(option.baseCost) || option.baseCost < 0 || !Number.isFinite(option.travelCost) || option.travelCost < 0)
        throw new Error("shopping trip option invalid");
    if (option.travelMinutes !== undefined && (!Number.isFinite(option.travelMinutes) || option.travelMinutes < 0))
        throw new Error("shopping trip travel minutes invalid");
    const offers = option.offers.map((offer) => validateShoppingOffer(offer, now)).filter((offer) => offer.truth === "verified");
    const immediate = offers.filter((offer) => offer.timing === "immediate").reduce((sum, offer) => sum + offer.amount, 0);
    const delayed = offers.filter((offer) => offer.timing !== "immediate").reduce((sum, offer) => sum + offer.amount, 0);
    const outOfPocketToday = Math.max(0, option.baseCost + option.travelCost - immediate);
    const effectiveFinalCost = Math.max(0, outOfPocketToday - delayed);
    return Object.freeze({ merchantRef: option.merchantRef, outOfPocketToday, delayedSavings: delayed, effectiveFinalCost, ...(option.travelMinutes === undefined ? {} : { travelMinutes: option.travelMinutes }), priority, evidenceRefs: Object.freeze(offers.flatMap((offer) => offer.sourceRefs)) });
}
export function rankShoppingTrips(options, priority, now) {
    const assessed = options.map((option) => assessShoppingTrip(option, priority, now));
    if (priority === "closest_practical" && assessed.some((item) => item.travelMinutes === undefined))
        throw new Error("closest practical priority requires travel minutes for every trip option");
    const score = (item) => priority === "preserve_cash_today" ? item.outOfPocketToday : priority === "lowest_final_cost" ? item.effectiveFinalCost : item.travelMinutes;
    return Object.freeze([...assessed].sort((a, b) => score(a) - score(b) || a.outOfPocketToday - b.outOfPocketToday || a.merchantRef.localeCompare(b.merchantRef)));
}
export function assertShoppingTruthOwnership(truthOwner) {
    if (truthOwner !== SHOPPING_SPECIALIST_PROFILE.truthOwner)
        throw new Error("Command Center may orchestrate shopping but cannot duplicate specialist shopping truth ownership");
}
//# sourceMappingURL=shopping.js.map