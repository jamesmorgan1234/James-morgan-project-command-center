export type CapabilityLifecycleState = "configure" | "connect" | "authorize" | "enable" | "disabled" | "dormant";

export interface DormantCapability {
  readonly key: string;
  readonly state: CapabilityLifecycleState;
  readonly contractVersion: number;
  readonly dataVersion: number;
  readonly requiredProviderCapabilities: readonly string[];
}

export function reactivationPath(capability: DormantCapability, providerCapabilities: readonly string[]): readonly CapabilityLifecycleState[] {
  if (capability.state !== "dormant" && capability.state !== "disabled") throw new Error("only dormant/disabled capability uses reactivation path");
  if (!capability.requiredProviderCapabilities.every((item) => providerCapabilities.includes(item))) throw new Error("provider capability mismatch blocks reactivation");
  return Object.freeze(["configure", "connect", "authorize", "enable"] as const);
}
