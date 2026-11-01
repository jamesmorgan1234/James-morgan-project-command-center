/** Scheduling and locks: scheduler role, device acceptance, immersive mode, control lock and resume. */

export function schedulerRole(role: "sole" | "continuation"): string {
  if (role === "sole") throw new Error("The scheduler is a continuation and fallback, not the sole trigger");
  return role;
}

export function assertInstalledDeviceAcceptance(evidence: { readonly physicalDevice: boolean }): void {
  if (!evidence.physicalDevice) throw new Error("Physical installed-device acceptance is required");
}

export function assertNoForcedImmersive(mode: "default" | "immersive"): void {
  if (mode === "immersive") throw new Error("Immersive mode cannot be forced");
}

export function controlModeLock(mode: string, locked: string): void {
  if (mode !== locked) throw new Error("The control mode is hard locked");
}

export function assertExternalVerification(selfReport: { readonly verified: boolean }, hasExternal: boolean): void {
  if (hasExternal && !selfReport.verified) throw new Error("Executor self-report is insufficient when external verification exists");
}

export function resumePoint(tasks: readonly { readonly done: boolean }[]): number {
  const index = tasks.findIndex((task) => !task.done);
  return index < 0 ? tasks.length : index;
}
