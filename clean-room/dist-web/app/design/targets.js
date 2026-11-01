/**
 * Device targets and measurement: Samsung-class mobile width, portrait-first
 * layout, exact approved screenshot measurements and the startup budget.
 */
export function assertMobileTarget(viewport) {
    if (!Number.isFinite(viewport.width) || viewport.width < 320 || viewport.width > 480) {
        throw new Error("Target viewport must be a Samsung-class mobile width");
    }
}
export function assertPortrait(orientation) {
    if (orientation !== "portrait")
        throw new Error("Layout is portrait-first");
}
export function exactMeasurements(boxes) {
    if (boxes.length === 0)
        throw new Error("Approved screenshot measurements are required");
    const out = [];
    for (const box of boxes) {
        for (const value of [box.x, box.y, box.w, box.h]) {
            if (!Number.isSafeInteger(value))
                throw new Error("Measurements must be exact integers");
        }
        if (box.w <= 0 || box.h <= 0)
            throw new Error("Measurements must be positive");
        out.push(Object.freeze({ ...box }));
    }
    return Object.freeze(out);
}
export function assertStartupBudget(ms, budget) {
    if (!Number.isFinite(ms) || ms < 0)
        throw new Error("A startup duration must be nonnegative");
    if (ms > budget)
        throw new Error("Startup performance budget exceeded");
}
//# sourceMappingURL=targets.js.map