import { parseTimestamp } from "../security/types.js";
import type { CapabilityTruth, EnumerationCapability } from "./refresh.js";

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
    if (typeof provider.enabled !== "boolean" || !["none", "oauth", "api_key_ref", "session", "passkey", "custom_ref"].includes(provider.authMode) || !["free", "paid", "unknown"].includes(provider.cost) || !["available", "degraded", "unavailable", "unconfigured"].includes(provider.health) || !["none", "source", "tool_result", "live_verified"].includes(provider.verification) || !["fail_closed", "read_only", "degraded"].includes(provider.failureMode)) throw new Error("Unsupported provider contract state");
    if (!provider.key.slice("provider:".length).trim() || provider.capabilities.some((item) => !item.trim()) || provider.scopes.some((item) => !item.trim())) throw new Error("Provider identity capabilities and scopes must be nonblank");
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

export interface ProviderCapabilitySnapshot {
  readonly id: string;
  readonly providerKey: string;
  readonly observedAt: string;
  readonly apiVersion?: string;
  readonly modelVersion?: string;
  readonly schemaFingerprint: string;
  readonly capabilityFingerprint: string;
  readonly capabilities: readonly string[];
  readonly enumeration: EnumerationCapability;
  readonly callbacks: CapabilityTruth;
  readonly pricing: ProviderCost;
  readonly verification: "tool_result" | "live_verified";
}

export type ProviderDrift = "none" | "compatible" | "breaking" | "pricing_unknown";

export function classifyProviderDrift(previous: ProviderCapabilitySnapshot | undefined, next: ProviderCapabilitySnapshot): ProviderDrift {
  if (!next.id.startsWith("provider-snapshot:") || !next.providerKey.startsWith("provider:") || !next.schemaFingerprint.trim() || !next.capabilityFingerprint.trim()) throw new Error("Provider capability snapshot identity/fingerprints are required");
  parseTimestamp(next.observedAt, "providerSnapshot.observedAt");
  if (new Set(next.capabilities).size !== next.capabilities.length) throw new Error("Provider snapshot capabilities must be unique");
  if (next.pricing === "unknown") return "pricing_unknown";
  if (!previous) return "compatible";
  if (previous.providerKey !== next.providerKey) throw new Error("Cannot compare drift across different providers");
  const removedCapability = previous.capabilities.some((capability) => !next.capabilities.includes(capability));
  const enumerationRegression = (Object.keys(next.enumeration) as (keyof EnumerationCapability)[]).some((key) => previous.enumeration[key] === "verified_supported" && next.enumeration[key] !== "verified_supported");
  if (removedCapability || enumerationRegression) return "breaking";
  if (previous.schemaFingerprint !== next.schemaFingerprint || previous.capabilityFingerprint !== next.capabilityFingerprint || previous.apiVersion !== next.apiVersion || previous.modelVersion !== next.modelVersion || previous.pricing !== next.pricing) return "compatible";
  return "none";
}

export class ProviderCapabilityLedger {
  readonly #snapshots = new Map<string, ProviderCapabilitySnapshot[]>();

  record(snapshot: ProviderCapabilitySnapshot): Readonly<{ snapshot: ProviderCapabilitySnapshot; drift: ProviderDrift }> {
    const history = this.#snapshots.get(snapshot.providerKey) ?? [];
    const previous = history.at(-1);
    const drift = classifyProviderDrift(previous, snapshot);
    const frozen = Object.freeze({ ...snapshot, capabilities: Object.freeze([...snapshot.capabilities]), enumeration: Object.freeze({ ...snapshot.enumeration }) });
    this.#snapshots.set(snapshot.providerKey, [...history, frozen]);
    return Object.freeze({ snapshot: frozen, drift });
  }

  latest(providerKey: string): ProviderCapabilitySnapshot | undefined { return this.#snapshots.get(providerKey)?.at(-1); }
  history(providerKey: string): readonly ProviderCapabilitySnapshot[] { return Object.freeze([...(this.#snapshots.get(providerKey) ?? [])]); }
}
