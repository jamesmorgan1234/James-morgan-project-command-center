/** Design geometry: tokens as code, spacing, glow, bevel, icon frame, ring, pill and locked tile height. */
export declare function designToken(name: string, value: number): {
    readonly name: string;
    readonly value: number;
};
export declare function spacingScale(steps: readonly number[]): readonly number[];
export declare function glowScale(steps: readonly number[]): readonly number[];
export declare function bevelGeometry(inset: number, depth: number): {
    readonly inset: number;
    readonly depth: number;
};
export declare function iconFrame(size: number): {
    readonly size: number;
    readonly radius: number;
};
export declare function progressRing(radius: number, stroke: number): {
    readonly radius: number;
    readonly stroke: number;
    readonly circumference: number;
};
export declare function statusPill(label: string, width: number): {
    readonly label: string;
    readonly width: number;
    readonly height: number;
};
export declare function homeTileHeight(heights: readonly number[]): number;
