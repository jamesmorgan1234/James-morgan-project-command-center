export interface ReferenceViewport {
    readonly width: number;
    readonly height: number;
    readonly aspectRatio: number;
    readonly orientation: "portrait";
}
export declare const APPROVED_REFERENCE_VIEWPORT: ReferenceViewport;
export declare const COMMAND_CENTER_COLORS: Readonly<{
    canvas: "#050608";
    surface: "#090c10";
    surfaceRaised: "#0d1117";
    orangeCore: "#ff6a00";
    orangeHot: "#ff8a00";
    gold: "#ffc12e";
    heading: "#fff7f0";
    support: "#a9bed0";
    cyan: "#18b9ff";
    green: "#17f29a";
    yellow: "#ffc400";
    red: "#ff293c";
    muted: "#9ab0c2";
}>;
export declare const COMMAND_CENTER_GEOMETRY: Readonly<{
    outerInset: 18;
    cardGap: 12;
    cardRadius: 18;
    clippedCorner: 16;
    borderWidth: 2;
    iconFrameSize: 116;
    iconInnerSize: 72;
    primaryTapTarget: 48;
    statusPillHeight: 38;
    compactStatusPillHeight: 30;
    progressRingDiameter: 88;
    progressRingStroke: 10;
}>;
export declare const COMMAND_CENTER_TYPE: Readonly<{
    hero: Readonly<{
        size: 48;
        lineHeight: 54;
        weight: 800;
    }>;
    screenTitle: Readonly<{
        size: 44;
        lineHeight: 50;
        weight: 800;
    }>;
    cardTitle: Readonly<{
        size: 30;
        lineHeight: 36;
        weight: 750;
    }>;
    sectionTitle: Readonly<{
        size: 26;
        lineHeight: 32;
        weight: 800;
    }>;
    body: Readonly<{
        size: 22;
        lineHeight: 30;
        weight: 450;
    }>;
    support: Readonly<{
        size: 20;
        lineHeight: 27;
        weight: 450;
    }>;
    label: Readonly<{
        size: 18;
        lineHeight: 22;
        weight: 700;
    }>;
}>;
export declare const COMMAND_CENTER_EFFECTS: Readonly<{
    borderGlowPx: 10;
    hotGlowPx: 18;
    backgroundArtOpacity: 0.48;
    cardArtOpacity: 0.72;
    reducedMotionDurationMs: 0;
    standardMotionDurationMs: 180;
}>;
export declare const COMMAND_CENTER_SPACING: Readonly<{
    xs: 4;
    sm: 8;
    md: 12;
    lg: 18;
    xl: 24;
    xxl: 32;
}>;
export declare const COMMAND_CENTER_RADIUS: Readonly<{
    control: 10;
    card: 18;
    panel: 20;
    pill: 999;
}>;
export declare const COMMAND_CENTER_ELEVATION: Readonly<{
    flat: "none";
    raised: "0 10px 26px rgba(0,0,0,.28)";
    overlay: "0 18px 48px rgba(0,0,0,.42)";
}>;
export declare const COMMAND_CENTER_SEMANTIC_STATES: Readonly<{
    healthy: Readonly<{
        color: "#17f29a";
        label: "Healthy";
    }>;
    informational: Readonly<{
        color: "#18b9ff";
        label: "Informational";
    }>;
    warning: Readonly<{
        color: "#ffc400";
        label: "Warning";
    }>;
    blocked: Readonly<{
        color: "#ff293c";
        label: "Blocked";
    }>;
    neutral: Readonly<{
        color: "#9ab0c2";
        label: "Neutral";
    }>;
}>;
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
export declare function commandCenterThemeContract(mode?: CommandCenterThemeMode): CommandCenterThemeContract;
export declare function scaleReferencePx(referencePx: number, viewportWidth: number): number;
export declare function assertPhoneFirstViewport(width: number, height: number): void;
