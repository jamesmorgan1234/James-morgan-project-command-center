/**
 * Device targets and measurement: Samsung-class mobile width, portrait-first
 * layout, exact approved screenshot measurements and the startup budget.
 */
export declare function assertMobileTarget(viewport: {
    readonly width: number;
    readonly height: number;
}): void;
export declare function assertPortrait(orientation: string): void;
export interface Box {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
}
export declare function exactMeasurements(boxes: readonly Box[]): readonly Box[];
export declare function assertStartupBudget(ms: number, budget: number): void;
