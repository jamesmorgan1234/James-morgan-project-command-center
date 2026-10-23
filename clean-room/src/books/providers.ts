export type PublishingBoundary = "normal" | "work_required";

export interface PublishingProvider {
  readonly key: string;
  readonly version: number;
  readonly health: "available" | "degraded" | "unavailable";
  readonly capabilities: readonly string[];
  readonly boundary: PublishingBoundary;
  readonly sourceRef: string;
}

export class PublishingProviderRegistry {
  readonly #providers = new Map<string, PublishingProvider>();

  register(provider: PublishingProvider): PublishingProvider {
    if (!provider.key.trim() || provider.version < 1 || !provider.sourceRef.trim()) throw new Error("publishing provider identity/provenance required");
    const prior = this.#providers.get(provider.key);
    if (prior && provider.version <= prior.version) throw new Error("provider version must advance");
    const frozen = Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]) });
    this.#providers.set(provider.key, frozen);
    return frozen;
  }

  route(capability: string): PublishingProvider | null {
    return [...this.#providers.values()].find((provider) => provider.health !== "unavailable" && provider.capabilities.includes(capability)) ?? null;
  }
}
