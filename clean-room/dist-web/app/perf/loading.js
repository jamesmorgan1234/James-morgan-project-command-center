/** Loading strategy: splitting, lazy modules and artwork, images, incremental load, prefetch. */
export function splitEntrypoints(routes) {
    if (routes.length === 0)
        throw new Error("At least one route is required");
    const chunks = {};
    for (const route of routes) {
        if (!route.startsWith("/"))
            throw new Error("Routes must be absolute");
        chunks[route] = `chunk-${route.replace(/\//g, "-")}`;
    }
    return Object.freeze(chunks);
}
export function lazyOptionalModule(name, core) {
    if (!name.trim())
        throw new Error("A module requires a name");
    if (core)
        throw new Error("Core modules cannot be lazily loaded");
    return `lazy:${name}`;
}
export function lazyArtwork(source) {
    if (source.startsWith("data:") || source.includes("base64"))
        throw new Error("Artwork must load lazily from a file, not inline");
    return source;
}
export function optimizedImage(image, displayWidth) {
    if (!["webp", "avif"].includes(image.format))
        throw new Error("Images must use an optimized format");
    if (image.width > displayWidth * 2)
        throw new Error("Images must not exceed twice their display width");
    return Object.freeze({ ...image });
}
export function incrementalBatch(total, batchSize, cursor = 0) {
    if (total < 0 || batchSize < 1 || cursor < 0 || cursor > total)
        throw new Error("Invalid incremental cursor");
    const items = Math.min(batchSize, total - cursor);
    const nextCursor = cursor + items < total ? cursor + items : null;
    return Object.freeze({ items, nextCursor });
}
export function shouldPrefetch(route) {
    if (route.costKb < 0)
        throw new Error("Prefetch cost must be nonnegative");
    return route.likely && route.costKb <= 100;
}
//# sourceMappingURL=loading.js.map