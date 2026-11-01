/** Scheduling and locks: scheduler role, device acceptance, immersive mode, control lock and resume. */
export function schedulerRole(role) {
    if (role === "sole")
        throw new Error("The scheduler is a continuation and fallback, not the sole trigger");
    return role;
}
export function assertInstalledDeviceAcceptance(evidence) {
    if (!evidence.physicalDevice)
        throw new Error("Physical installed-device acceptance is required");
}
export function assertNoForcedImmersive(mode) {
    if (mode === "immersive")
        throw new Error("Immersive mode cannot be forced");
}
export function controlModeLock(mode, locked) {
    if (mode !== locked)
        throw new Error("The control mode is hard locked");
}
export function assertExternalVerification(selfReport, hasExternal) {
    if (hasExternal && !selfReport.verified)
        throw new Error("Executor self-report is insufficient when external verification exists");
}
export function resumePoint(tasks) {
    const index = tasks.findIndex((task) => !task.done);
    return index < 0 ? tasks.length : index;
}
//# sourceMappingURL=scheduling.js.map