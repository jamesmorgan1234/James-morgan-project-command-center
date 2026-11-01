export interface DeviceProfile {
    readonly width: number;
    readonly height: number;
    readonly pixelRatio: number;
    readonly reducedMotion: boolean;
    readonly highContrast: boolean;
}
export type LayoutClass = "compact_phone" | "phone" | "tablet" | "desktop";
export declare function classifyLayout(profile: DeviceProfile): LayoutClass;
export declare function assertAccessibleControl(control: {
    width: number;
    height: number;
    label?: string;
    ariaLabel?: string;
}): void;
export declare function motionDuration(profile: DeviceProfile, standardMs?: number): number;
