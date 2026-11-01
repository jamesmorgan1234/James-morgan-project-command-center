export function knownMoney(cents, currency = "USD") {
    if (!Number.isSafeInteger(cents))
        throw new Error("Money cents must be a safe integer");
    if (!/^[A-Z]{3}$/.test(currency))
        throw new Error("Money currency must be an ISO-style three-letter code");
    return Object.freeze({ state: "known", cents, currency });
}
export function unknownMoney(reason) {
    if (!reason.trim())
        throw new Error("Unknown money value requires a reason");
    return Object.freeze({ state: "unknown", reason });
}
export function addKnownMoney(values) {
    const known = values.filter((value) => value.state === "known");
    if (known.length !== values.length)
        return unknownMoney("one_or_more_inputs_unknown");
    const currencies = new Set(known.map((value) => value.currency));
    if (currencies.size !== 1)
        return unknownMoney("mixed_currencies_require_conversion");
    return knownMoney(known.reduce((sum, value) => sum + value.cents, 0), known[0]?.currency ?? "USD");
}
//# sourceMappingURL=money.js.map