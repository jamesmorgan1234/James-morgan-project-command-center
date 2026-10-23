export type ProviderCost = "free" | "paid" | "unknown";
export type ProviderHealth = "available" | "degraded" | "unavailable" | "unconfigured";
export type ProviderFailureMode = "fail_closed" | "read_only" | "degraded";

export interface ProviderContract {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly authMode: "none" | "oauth" | "api_key_ref" | "session" | "passkey" | "custom_ref";
  readonly capabilities: readonly string[];
  readonly scopes: readonly string[];
  readonly freshnessSeconds: number;
  readonly cost: ProviderCost;
  readonly health: ProviderHealth;
  readonly verification: "none" | "source" | "tool_result" | "live_verified";
  readonly failureMode: ProviderFailureMode;
}

export class ProviderRegistry {
  readonly #providers = new Map<string, ProviderContract>();

  register(provider: ProviderContract): void {
    this.#validate(provider);
    if (this.#providers.has(provider.key)) throw new Error(`Provider already exists: ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]), scopes: Object.freeze([...provider.scopes]) }));
  }

  replace(provider: ProviderContract, expectedVersion: number): void {
    this.#validate(provider);
    const current = this.#required(provider.key);
    if (current.version !== expectedVersion) throw new Error(`Provider version conflict for ${provider.key}`);
    if (provider.version <= current.version) throw new Error(`Provider version must advance for ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]), scopes: Object.freeze([...provider.scopes]) }));
  }

  remove(key: string, expectedVersion: number): ProviderContract {
    const current = this.#required(key);
    if (current.version !== expectedVersion) throw new Error(`Provider version conflict for ${key}`);
    this.#providers.delete(key);
    return current;
  }

  forCapability(capability: string): readonly ProviderContract[] {
    return Object.freeze([...this.#providers.values()].filter((provider) => provider.enabled && provider.capabilities.includes(capability)));
  }

  get(key: string): ProviderContract | undefined { return this.#providers.get(key); }

  #validate(provider: ProviderContract): void {
    if (!provider.key.startsWith("provider:")) throw new Error(`Provider key must start with provider:: ${provider.key}`);
    if (!Number.isSafeInteger(provider.version) || provider.version < 1) throw new Error("Provider version must be positive");
    if (!Number.isFinite(provider.freshnessSeconds) || provider.freshnessSeconds < 0) throw new Error("Provider freshnessSeconds must be non-negative");
    if (new Set(provider.capabilities).size !== provider.capabilities.length) throw new Error("Provider capabilities must be unique");
    if (new Set(provider.scopes).size !== provider.scopes.length) throw new Error("Provider scopes must be unique");
  }

  #required(key: string): ProviderContract {
    const provider = this.#providers.get(key);
    if (!provider) throw new Error(`Unknown provider: ${key}`);
    return provider;
  }
}
