/**
 * Design scales: canonical margin, typography and border steps, card height
 * classes, and refusal of arbitrary sizing or giant unexplained gaps.
 */
export declare function defineScale(name: string, steps: readonly number[]): readonly number[];
export type CardHeightClass = "compact" | "standard" | "tall";
export declare function cardHeightClass(height: number): CardHeightClass;
export declare function assertTokenValue(value: number, scale: readonly number[]): void;
export declare function assertNoGiantGap(gap: number, maxGap: number): void;
