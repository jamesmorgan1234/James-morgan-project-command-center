export interface ReferenceViewport {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly orientation: "portrait";
}

export const APPROVED_REFERENCE_VIEWPORT: ReferenceViewport = Object.freeze({
  width: 864,
  height: 1536,
  aspectRatio: 864 / 1536,
  orientation: "portrait"
});

export const COMMAND_CENTER_COLORS = Object.freeze({
  canvas: "#050608",
  surface: "#090c10",
  surfaceRaised: "#0d1117",
  orangeCore: "#ff6a00",
  orangeHot: "#ff8a00",
  gold: "#ffc12e",
  heading: "#fff7f0",
  support: "#a9bed0",
  cyan: "#18b9ff",
  green: "#17f29a",
  yellow: "#ffc400",
  red: "#ff293c",
  muted: "#9ab0c2"
});

export const COMMAND_CENTER_GEOMETRY = Object.freeze({
  outerInset: 18,
  cardGap: 12,
  cardRadius: 18,
  clippedCorner: 16,
  borderWidth: 2,
  iconFrameSize: 116,
  iconInnerSize: 72,
  primaryTapTarget: 48,
  statusPillHeight: 38,
  compactStatusPillHeight: 30,
  progressRingDiameter: 88,
  progressRingStroke: 10
});

export const COMMAND_CENTER_TYPE = Object.freeze({
  hero: Object.freeze({ size: 48, lineHeight: 54, weight: 800 }),
  screenTitle: Object.freeze({ size: 44, lineHeight: 50, weight: 800 }),
  cardTitle: Object.freeze({ size: 30, lineHeight: 36, weight: 750 }),
  sectionTitle: Object.freeze({ size: 26, lineHeight: 32, weight: 800 }),
  body: Object.freeze({ size: 22, lineHeight: 30, weight: 450 }),
  support: Object.freeze({ size: 20, lineHeight: 27, weight: 450 }),
  label: Object.freeze({ size: 18, lineHeight: 22, weight: 700 })
});

export const COMMAND_CENTER_EFFECTS = Object.freeze({
  borderGlowPx: 10,
  hotGlowPx: 18,
  backgroundArtOpacity: 0.48,
  cardArtOpacity: 0.72,
  reducedMotionDurationMs: 0,
  standardMotionDurationMs: 180
});

export function scaleReferencePx(referencePx: number, viewportWidth: number): number {
  if (!Number.isFinite(referencePx) || referencePx < 0) throw new Error("referencePx must be a non-negative finite number");
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) throw new Error("viewportWidth must be positive");
  return referencePx * (viewportWidth / APPROVED_REFERENCE_VIEWPORT.width);
}

export function assertPhoneFirstViewport(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error("Viewport dimensions must be positive");
  if (height <= width) throw new Error("Primary Command Center shell is phone-first portrait");
}
