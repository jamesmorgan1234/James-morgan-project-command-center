export function classifyLayout(profile) {
    if (profile.width <= 0 || profile.height <= 0 || profile.pixelRatio <= 0)
        throw new Error("Device profile dimensions and pixelRatio must be positive");
    const min = Math.min(profile.width, profile.height);
    if (min < 360)
        return "compact_phone";
    if (min < 600)
        return "phone";
    if (min < 900)
        return "tablet";
    return "desktop";
}
export function assertAccessibleControl(control) {
    if (control.width < 48 || control.height < 48)
        throw new Error("Interactive control must meet the Command Center 48px minimum target size");
    if (!control.label?.trim() && !control.ariaLabel?.trim())
        throw new Error("Interactive control requires an accessible label");
}
export function motionDuration(profile, standardMs = 180) {
    if (!Number.isFinite(standardMs) || standardMs < 0)
        throw new Error("Motion duration must be non-negative");
    return profile.reducedMotion ? 0 : standardMs;
}
//# sourceMappingURL=device.js.map