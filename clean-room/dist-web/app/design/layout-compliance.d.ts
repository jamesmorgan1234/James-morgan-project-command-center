/**
 * Layout compliance: no local CSS overrides, consistent tile sizes, no
 * rounded SaaS cards or arbitrary colour, no horizontal overflow, native
 * scrolling, controls above system UI, and one shared truth system.
 */
export declare function assertNoLocalOverride(overrides: readonly string[]): void;
export declare function assertConsistentTileSizes(sizes: readonly number[]): void;
export declare function assertNoRoundedSaaSCards(radius: number, maxRadius: number): void;
export declare function assertSemanticColor(hex: string, palette: readonly string[]): void;
export declare function assertNoHorizontalOverflow(scrollWidth: number, clientWidth: number): void;
export declare function assertNativeScrolling(mode: {
    readonly native: boolean;
}): void;
export declare function assertControlsAboveSystemUi(controlBottom: number, viewportHeight: number, insetBottom: number): void;
export declare function assertSingleTruthSystem(systems: readonly string[]): void;
export declare function assertSameContracts(contracts: {
    readonly mobile: string;
    readonly desktop: string;
}): void;
