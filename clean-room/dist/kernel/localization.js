function assertNonBlank(value, label) {
    if (!value.trim())
        throw new Error(`${label} is required`);
    return value;
}
export function canonicalizeLocale(locale) {
    assertNonBlank(locale, "locale");
    try {
        const canonical = Intl.getCanonicalLocales(locale)[0];
        if (!canonical)
            throw new Error("empty locale result");
        return canonical;
    }
    catch {
        throw new Error(`Invalid locale: ${locale}`);
    }
}
function freezeCatalog(catalog, locale) {
    const entries = Object.entries(catalog);
    const normalized = {};
    for (const [key, value] of entries) {
        assertNonBlank(key, `translation key for ${locale}`);
        if (typeof value !== "string" || !value.trim())
            throw new Error(`Translation value is required for ${locale}:${key}`);
        normalized[key] = value;
    }
    return Object.freeze(normalized);
}
export class LocalizationRegistry {
    #defaultLocale;
    #catalogs;
    constructor(defaultLocale, catalogs) {
        const canonicalDefault = canonicalizeLocale(defaultLocale);
        const normalized = new Map();
        for (const [rawLocale, catalog] of Object.entries(catalogs)) {
            const locale = canonicalizeLocale(rawLocale);
            if (normalized.has(locale))
                throw new Error(`Duplicate canonical locale: ${locale}`);
            normalized.set(locale, freezeCatalog(catalog, locale));
        }
        if (!normalized.has(canonicalDefault))
            throw new Error(`Default locale catalog is required: ${canonicalDefault}`);
        this.#defaultLocale = canonicalDefault;
        this.#catalogs = normalized;
    }
    defaultLocale() {
        return this.#defaultLocale;
    }
    supportedLocales() {
        return Object.freeze([...this.#catalogs.keys()].sort());
    }
    hasLocale(locale) {
        return this.#catalogs.has(canonicalizeLocale(locale));
    }
    resolve(requestedLocale, key) {
        const canonicalRequested = canonicalizeLocale(requestedLocale);
        assertNonBlank(key, "translation key");
        const language = canonicalRequested.split("-")[0];
        const candidates = [canonicalRequested];
        if (language !== canonicalRequested)
            candidates.push(language);
        if (!candidates.includes(this.#defaultLocale))
            candidates.push(this.#defaultLocale);
        for (const locale of candidates) {
            const catalog = this.#catalogs.get(locale);
            const value = catalog?.[key];
            if (value !== undefined) {
                return Object.freeze({
                    key,
                    value,
                    requestedLocale: canonicalRequested,
                    resolvedLocale: locale,
                    usedFallback: locale !== canonicalRequested
                });
            }
        }
        throw new Error(`Missing translation key: ${key}`);
    }
}
//# sourceMappingURL=localization.js.map