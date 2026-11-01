export const DEFAULT_BOOK_AUTHOR_BYLINE = "James Morgan";
function metadataTimestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function nonblankUnique(values, label, requireOne = true) {
    if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank values`);
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
    return Object.freeze(normalized);
}
export function validateBookPublicationMetadata(metadata) {
    if (!metadata.id.trim() || !metadata.ownerId.trim() || !metadata.projectId.trim() || !metadata.bookId.trim() || !metadata.title.trim() || !metadata.edition.trim() || !metadata.authorIdentityRef.trim() || !metadata.authorDisplayName.trim() || !metadata.trimSize.trim() || !metadata.printSpecificationsRef.trim() || !metadata.packageManifestRef.trim())
        throw new Error("book publication metadata identity/title/edition/author/print/package fields are required");
    if (!Number.isSafeInteger(metadata.version) || metadata.version < 1)
        throw new Error("book publication metadata version must be positive");
    metadataTimestamp(metadata.observedAt, "book publication metadata observedAt");
    if (metadata.subtitle !== null && !metadata.subtitle.trim())
        throw new Error("book subtitle must be nonblank when present");
    if (metadata.isbnRef !== undefined && !metadata.isbnRef.trim())
        throw new Error("book ISBN/reference must be nonblank when present");
    const formats = nonblankUnique(metadata.formats, "book publication formats");
    const sourceRefs = nonblankUnique(metadata.sourceRefs, "book publication metadata source refs");
    const mappedFormats = new Set();
    const fileMappings = metadata.fileMappings.map((mapping) => {
        if (!formats.includes(mapping.format))
            throw new Error("file mapping format must be declared by metadata");
        if (mappedFormats.has(mapping.format))
            throw new Error("each publication format must have exactly one canonical file mapping");
        if (!mapping.fileRef.trim() || !mapping.contentHash.trim() || !Number.isSafeInteger(mapping.assetVersion) || mapping.assetVersion < 1)
            throw new Error("file mapping requires file/hash/positive asset version");
        mappedFormats.add(mapping.format);
        return Object.freeze({ ...mapping });
    });
    for (const format of formats)
        if (!mappedFormats.has(format))
            throw new Error(`publication format lacks canonical file mapping: ${format}`);
    const priceKeys = new Set();
    const prices = metadata.prices.map((price) => {
        if (!formats.includes(price.format) || !Number.isFinite(price.amount) || price.amount < 0 || !price.currency.trim())
            throw new Error("book format price requires declared format/nonnegative amount/currency");
        const key = `${price.format}:${price.state}`;
        if (priceKeys.has(key))
            throw new Error("book format price state must be unique per format");
        priceKeys.add(key);
        if (price.state === "recommended" && !price.recommendationRef?.trim())
            throw new Error("recommended book price requires recommendation evidence");
        if (price.state === "approved" && !price.approvalRef?.trim())
            throw new Error("approved book price requires explicit approval evidence");
        return Object.freeze({ ...price });
    });
    return Object.freeze({ ...metadata, formats, fileMappings: Object.freeze(fileMappings), prices: Object.freeze(prices), sourceRefs });
}
export function approvedPriceFor(metadata, format) {
    const valid = validateBookPublicationMetadata(metadata);
    return valid.prices.find((price) => price.format === format && price.state === "approved");
}
//# sourceMappingURL=publication-metadata.js.map