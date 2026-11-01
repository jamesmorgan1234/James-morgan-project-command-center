/**
 * Layout compliance: no local CSS overrides, consistent tile sizes, no
 * rounded SaaS cards or arbitrary colour, no horizontal overflow, native
 * scrolling, controls above system UI, and one shared truth system.
 */

export function assertNoLocalOverride(overrides: readonly string[]): void {
  if (overrides.length > 0) throw new Error(`Local CSS overrides are not permitted: ${overrides.join(", ")}`);
}

export function assertConsistentTileSizes(sizes: readonly number[]): void {
  if (sizes.length === 0) throw new Error("Tile sizes are required");
  const first = sizes[0] as number;
  for (const size of sizes) {
    if (!Number.isFinite(size) || size <= 0) throw new Error("Tile sizes must be positive");
    if (size !== first) throw new Error("Inconsistent tile sizes are not permitted");
  }
}

export function assertNoRoundedSaaSCards(radius: number, maxRadius: number): void {
  if (radius > maxRadius) throw new Error("Rounded SaaS cards are not permitted");
}

export function assertSemanticColor(hex: string, palette: readonly string[]): void {
  if (!palette.includes(hex)) throw new Error(`Arbitrary colour is not permitted: ${hex}`);
}

export function assertNoHorizontalOverflow(scrollWidth: number, clientWidth: number): void {
  if (scrollWidth > clientWidth) throw new Error("Horizontal overflow is not permitted");
}

export function assertNativeScrolling(mode: { readonly native: boolean }): void {
  if (!mode.native) throw new Error("Scrolling must be native vertical scrolling");
}

export function assertControlsAboveSystemUi(controlBottom: number, viewportHeight: number, insetBottom: number): void {
  if (viewportHeight <= 0 || insetBottom < 0) throw new Error("Viewport metrics must be positive");
  if (controlBottom > viewportHeight - insetBottom) throw new Error("Controls must not sit underneath Android system UI");
}

export function assertSingleTruthSystem(systems: readonly string[]): void {
  if (systems.length !== 1) throw new Error("There must be exactly one truth system");
}

export function assertSameContracts(contracts: { readonly mobile: string; readonly desktop: string }): void {
  if (contracts.mobile !== contracts.desktop) throw new Error("Mobile and desktop must share the same contracts");
}
