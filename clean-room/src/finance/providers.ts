export type FinancialProviderConnectionState = "unconfigured" | "connected" | "disconnected" | "expired" | "revoked";
export type FinancialProviderConsentState = "required" | "granted" | "revoked";
export type FinancialProviderHealth = "available" | "degraded" | "unavailable";
export type FinancialProviderFreshness = "fresh" | "stale" | "disconnected" | "unknown";

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

export interface FinancialProviderConnectionEvidence {
  readonly providerKey: string;
  readonly ownerId: string;
  readonly providerIdentity: string;
  readonly connectionState: FinancialProviderConnectionState;
  readonly consentState: FinancialProviderConsentState;
  readonly consentRef?: string;
  readonly reconnectRef?: string;
  readonly lastSuccessfulSyncAt?: string;
  readonly observedAt: string;
  readonly freshnessSeconds: number;
  readonly provenanceRefs: readonly string[];
}

export interface FinancialProviderConnectionAssessment {
  readonly providerKey: string;
  readonly providerIdentity: string;
  readonly connectionState: FinancialProviderConnectionState;
  readonly consentState: FinancialProviderConsentState;
  readonly freshness: FinancialProviderFreshness;
  readonly reconnectRequired: boolean;
  readonly historicalRecordsPreserved: true;
  readonly provenanceRefs: readonly string[];
  readonly protectedActionAuthorized: false;
}

function parseTime(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

export function assessFinancialProviderConnection(evidence: FinancialProviderConnectionEvidence, now: string): FinancialProviderConnectionAssessment {
  if (!evidence.providerKey.startsWith("finance-provider:")) throw new Error("Financial provider key must start with finance-provider:");
  if (!evidence.ownerId.trim() || !evidence.providerIdentity.trim()) throw new Error("Financial provider owner and provider identity are required");
  if (!Number.isFinite(evidence.freshnessSeconds) || evidence.freshnessSeconds < 0) throw new Error("Financial provider freshness must be non-negative");
  if (!Array.isArray(evidence.provenanceRefs) || evidence.provenanceRefs.length === 0 || evidence.provenanceRefs.some((ref) => !ref.trim())) throw new Error("Financial provider provenance is required");
  const nowMs = parseTime(now, "Financial provider assessment now");
  parseTime(evidence.observedAt, "Financial provider observedAt");
  if (evidence.consentState === "granted" && !evidence.consentRef?.trim()) throw new Error("Granted financial consent requires consent evidence");
  const reconnectRequired = evidence.connectionState === "disconnected" || evidence.connectionState === "expired" || evidence.connectionState === "revoked";
  if (reconnectRequired && !evidence.reconnectRef?.trim()) throw new Error("Disconnected/expired/revoked financial provider requires reconnect path evidence");
  let freshness: FinancialProviderFreshness = "unknown";
  if (reconnectRequired) freshness = "disconnected";
  else if (evidence.lastSuccessfulSyncAt) {
    const syncMs = parseTime(evidence.lastSuccessfulSyncAt, "Financial provider lastSuccessfulSyncAt");
    if (syncMs > nowMs) throw new Error("Financial provider sync cannot be in the future");
    freshness = nowMs - syncMs <= evidence.freshnessSeconds * 1000 ? "fresh" : "stale";
  }
  return Object.freeze({
    providerKey: evidence.providerKey,
    providerIdentity: evidence.providerIdentity,
    connectionState: evidence.connectionState,
    consentState: evidence.consentState,
    freshness,
    reconnectRequired,
    historicalRecordsPreserved: true as const,
    provenanceRefs: Object.freeze([...evidence.provenanceRefs]),
    protectedActionAuthorized: false as const
  });
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
  list(): readonly FinancialProviderAdapter[] { return Object.freeze([...this.#providers.values()]); }
}
