/** Design geometry: tokens as code, spacing, glow, bevel, icon frame, ring, pill and locked tile height. */
export function designToken(name, value) {
    if (!/^[a-z][a-z0-9-]*$/.test(name))
        throw new Error("Token names must be lowercase kebab-case");
    if (!Number.isFinite(value) || value <= 0)
        throw new Error("Token values must be positive");
    return Object.freeze({ name, value });
}
export function spacingScale(steps) {
    if (steps.length < 3)
        throw new Error("A spacing scale requires at least three steps");
    let previous = 0;
    for (const step of steps) {
        if (!Number.isFinite(step) || step <= 0 || step <= previous)
            throw new Error("Spacing steps must be positive and ascending");
        previous = step;
    }
    return Object.freeze([...steps]);
}
export function glowScale(steps) {
    if (steps.length === 0 || steps[0] !== 0)
        throw new Error("A glow scale starts at zero");
    let previous = -1;
    for (const step of steps) {
        if (!Number.isFinite(step) || step < 0 || step <= previous)
            throw new Error("Glow steps must be nonnegative and ascending");
        previous = step;
    }
    return Object.freeze([...steps]);
}
export function bevelGeometry(inset, depth) {
    if (!Number.isFinite(inset) || !Number.isFinite(depth) || inset <= 0 || depth <= 0)
        throw new Error("Bevel geometry must be positive");
    if (depth > inset)
        throw new Error("Bevel depth cannot exceed its inset");
    return Object.freeze({ inset, depth });
}
export function iconFrame(size) {
    if (![16, 20, 24, 32].includes(size))
        throw new Error("Icon frames use an approved size");
    return Object.freeze({ size, radius: size / 8 });
}
export function progressRing(radius, stroke) {
    if (!Number.isFinite(radius) || !Number.isFinite(stroke) || radius <= 0 || stroke <= 0)
        throw new Error("Progress-ring geometry must be positive");
    if (stroke >= radius / 2)
        throw new Error("Progress-ring stroke must be thinner than half its radius");
    return Object.freeze({ radius, stroke, circumference: 2 * Math.PI * radius });
}
export function statusPill(label, width) {
    if (!label.trim())
        throw new Error("A status pill requires a label");
    if (width < label.length * 7 + 16)
        throw new Error("A status pill must fit its label");
    return Object.freeze({ label, width, height: 24 });
}
export function homeTileHeight(heights) {
    if (heights.length === 0)
        throw new Error("Home tile heights are required");
    const first = heights[0];
    for (const height of heights)
        if (height !== first)
            throw new Error("Home tile height is locked uniformly");
    return first;
}
//# sourceMappingURL=geometry.js.map