/**
 * Design scales: canonical margin, typography and border steps, card height
 * classes, and refusal of arbitrary sizing or giant unexplained gaps.
 */

export function defineScale(name: string, steps: readonly number[]): readonly number[] {
  if (steps.length === 0) throw new Error(`The ${name} scale requires steps`);
  let previous = 0;
  for (const step of steps) {
    if (!Number.isFinite(step) || step <= 0) throw new Error(`${name} steps must be positive`);
    if (step <= previous) throw new Error(`${name} steps must ascend`);
    previous = step;
  }
  return Object.freeze([...steps]);
}

export type CardHeightClass = "compact" | "standard" | "tall";

export function cardHeightClass(height: number): CardHeightClass {
  if (!Number.isFinite(height) || height <= 0) throw new Error("Card height must be positive");
  if (height <= 96) return "compact";
  if (height <= 160) return "standard";
  return "tall";
}

export function assertTokenValue(value: number, scale: readonly number[]): void {
  if (!Number.isFinite(value)) throw new Error("A token value must be finite");
  if (!scale.includes(value)) throw new Error(`Arbitrary component sizing is not permitted: ${value}`);
}

export function assertNoGiantGap(gap: number, maxGap: number): void {
  if (!Number.isFinite(gap) || gap < 0) throw new Error("A gap must be nonnegative");
  if (gap > maxGap) throw new Error("A giant unexplained vertical gap is not permitted");
}
