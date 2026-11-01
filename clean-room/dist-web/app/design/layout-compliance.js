/**
 * Layout compliance: no local CSS overrides, consistent tile sizes, no
 * rounded SaaS cards or arbitrary colour, no horizontal overflow, native
 * scrolling, controls above system UI, and one shared truth system.
 */
export function assertNoLocalOverride(overrides) {
    if (overrides.length > 0)
        throw new Error(`Local CSS overrides are not permitted: ${overrides.join(", ")}`);
}
export function assertConsistentTileSizes(sizes) {
    if (sizes.length === 0)
        throw new Error("Tile sizes are required");
    const first = sizes[0];
    for (const size of sizes) {
        if (!Number.isFinite(size) || size <= 0)
            throw new Error("Tile sizes must be positive");
        if (size !== first)
            throw new Error("Inconsistent tile sizes are not permitted");
    }
}
export function assertNoRoundedSaaSCards(radius, maxRadius) {
    if (radius > maxRadius)
        throw new Error("Rounded SaaS cards are not permitted");
}
export function assertSemanticColor(hex, palette) {
    if (!palette.includes(hex))
        throw new Error(`Arbitrary colour is not permitted: ${hex}`);
}
export function assertNoHorizontalOverflow(scrollWidth, clientWidth) {
    if (scrollWidth > clientWidth)
        throw new Error("Horizontal overflow is not permitted");
}
export function assertNativeScrolling(mode) {
    if (!mode.native)
        throw new Error("Scrolling must be native vertical scrolling");
}
export function assertControlsAboveSystemUi(controlBottom, viewportHeight, insetBottom) {
    if (viewportHeight <= 0 || insetBottom < 0)
        throw new Error("Viewport metrics must be positive");
    if (controlBottom > viewportHeight - insetBottom)
        throw new Error("Controls must not sit underneath Android system UI");
}
export function assertSingleTruthSystem(systems) {
    if (systems.length !== 1)
        throw new Error("There must be exactly one truth system");
}
export function assertSameContracts(contracts) {
    if (contracts.mobile !== contracts.desktop)
        throw new Error("Mobile and desktop must share the same contracts");
}
//# sourceMappingURL=layout-compliance.js.map