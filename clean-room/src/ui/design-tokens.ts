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

export const COMMAND_CENTER_SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32
});

export const COMMAND_CENTER_RADIUS = Object.freeze({
  control: 10,
  card: COMMAND_CENTER_GEOMETRY.cardRadius,
  panel: 20,
  pill: 999
});

export const COMMAND_CENTER_ELEVATION = Object.freeze({
  flat: "none",
  raised: "0 10px 26px rgba(0,0,0,.28)",
  overlay: "0 18px 48px rgba(0,0,0,.42)"
});

export const COMMAND_CENTER_SEMANTIC_STATES = Object.freeze({
  healthy: Object.freeze({ color: COMMAND_CENTER_COLORS.green, label: "Healthy" }),
  informational: Object.freeze({ color: COMMAND_CENTER_COLORS.cyan, label: "Informational" }),
  warning: Object.freeze({ color: COMMAND_CENTER_COLORS.yellow, label: "Warning" }),
  blocked: Object.freeze({ color: COMMAND_CENTER_COLORS.red, label: "Blocked" }),
  neutral: Object.freeze({ color: COMMAND_CENTER_COLORS.muted, label: "Neutral" })
});

export type CommandCenterThemeMode = "dark" | "light" | "system";

export interface CommandCenterThemeContract {
  readonly mode: CommandCenterThemeMode;
  readonly semanticStateSource: "COMMAND_CENTER_SEMANTIC_STATES";
  readonly spacingSource: "COMMAND_CENTER_SPACING";
  readonly radiusSource: "COMMAND_CENTER_RADIUS";
  readonly elevationSource: "COMMAND_CENTER_ELEVATION";
  readonly typographySource: "COMMAND_CENTER_TYPE";
  readonly sharedPrimitiveStylingRequired: true;
  readonly oneOffStylingPolicy: "minimized_and_traceable";
  readonly denseReadableLayoutRequired: true;
  readonly actionableControlsObvious: true;
}

export function commandCenterThemeContract(mode: CommandCenterThemeMode = "system"): CommandCenterThemeContract {
  return Object.freeze({
    mode,
    semanticStateSource: "COMMAND_CENTER_SEMANTIC_STATES",
    spacingSource: "COMMAND_CENTER_SPACING",
    radiusSource: "COMMAND_CENTER_RADIUS",
    elevationSource: "COMMAND_CENTER_ELEVATION",
    typographySource: "COMMAND_CENTER_TYPE",
    sharedPrimitiveStylingRequired: true,
    oneOffStylingPolicy: "minimized_and_traceable",
    denseReadableLayoutRequired: true,
    actionableControlsObvious: true
  });
}

export function scaleReferencePx(referencePx: number, viewportWidth: number): number {
  if (!Number.isFinite(referencePx) || referencePx < 0) throw new Error("referencePx must be a non-negative finite number");
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) throw new Error("viewportWidth must be positive");
  return referencePx * (viewportWidth / APPROVED_REFERENCE_VIEWPORT.width);
}

export function assertPhoneFirstViewport(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error("Viewport dimensions must be positive");
  if (height <= width) throw new Error("Primary Command Center shell is phone-first portrait");
}
