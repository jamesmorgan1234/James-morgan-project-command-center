export interface DeterministicCapability {
  readonly key: string;
  readonly requiresAi: boolean;
  readonly availableOffline: boolean;
}

export function capabilitiesWithoutExternalAi(capabilities: readonly DeterministicCapability[]): readonly DeterministicCapability[] {
  return Object.freeze(capabilities.filter((capability) => !capability.requiresAi));
}

export function assertCoreTruthSurvivesAiOutage(capabilities: readonly DeterministicCapability[]): void {
  const required = ["project.read", "checkpoint.read", "decision.read", "rule.read", "needs-me.read"];
  const available = new Set(capabilitiesWithoutExternalAi(capabilities).map((capability) => capability.key));
  for (const key of required) if (!available.has(key)) throw new Error(`Core deterministic capability missing during AI outage: ${key}`);
}
