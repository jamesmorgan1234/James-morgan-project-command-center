export type FinancialProviderConnectionState = "unconfigured" | "connected" | "disconnected" | "expired" | "revoked";
export type FinancialProviderConsentState = "required" | "granted" | "revoked";
export type FinancialProviderHealth = "available" | "degraded" | "unavailable";

export interface FinancialProviderAdapter {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly connectionState: FinancialProviderConnectionState;
  readonly consentState: FinancialProviderConsentState;
  readonly capabilities: readonly ("accounts.read" | "transactions.read" | "liabilities.read" | "credit.read" | "investments.read" | "transfer.write" | "payment.write" | "account.write")[];
  readonly dataScopes: readonly string[];
  readonly freshnessSeconds: number;
  readonly health: FinancialProviderHealth;
  readonly credentialRef?: string;
}

export class FinancialProviderRegistry {
  readonly #providers = new Map<string, FinancialProviderAdapter>();

  register(provider: FinancialProviderAdapter): void {
    if (!provider.key.startsWith("finance-provider:")) throw new Error(`Financial provider key must start with finance-provider:: ${provider.key}`);
    if (!Number.isSafeInteger(provider.version) || provider.version < 1) throw new Error("Financial provider version must be positive");
    if (!Number.isFinite(provider.freshnessSeconds) || provider.freshnessSeconds < 0) throw new Error("Financial provider freshness must be non-negative");
    if (new Set(provider.capabilities).size !== provider.capabilities.length || new Set(provider.dataScopes).size !== provider.dataScopes.length) throw new Error("Financial provider capabilities/scopes must be unique");
    if (this.#providers.has(provider.key)) throw new Error(`Financial provider already exists: ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]), dataScopes: Object.freeze([...provider.dataScopes]) }));
  }

  eligible(capability: FinancialProviderAdapter["capabilities"][number], requiredScope?: string): readonly FinancialProviderAdapter[] {
    return Object.freeze([...this.#providers.values()].filter((provider) => provider.enabled && provider.connectionState === "connected" && provider.consentState === "granted" && provider.health !== "unavailable" && provider.capabilities.includes(capability) && (!requiredScope || provider.dataScopes.includes(requiredScope))));
  }

  get(key: string): FinancialProviderAdapter | undefined { return this.#providers.get(key); }
}
