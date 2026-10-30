import { parseTimestamp } from "../security/types.js";
import type { CapabilityTruth, EnumerationCapability } from "./refresh.js";

export type ProviderCost = "free" | "paid" | "unknown";
export type ProviderHealth = "available" | "degraded" | "unavailable" | "unconfigured";
export type ProviderFailureMode = "fail_closed" | "read_only" | "degraded";
export type ProviderCompleteness = "unknown" | "partial" | "complete";
export type ProviderTrust = "unrated" | "low" | "medium" | "high" | "authoritative";
export type ProviderReachability = "unknown" | "reachable" | "degraded" | "unreachable";

export interface ProviderReliability {
  readonly successRate?: number;
  readonly sampleSize?: number;
  readonly lastFailureAt?: string;
}

export interface ProviderObligation {
  readonly kind: string;
  readonly dueAt?: string;
  readonly blocking?: boolean;
}

export interface ProviderRevalidation {
  readonly required: boolean;
  readonly after?: string;
  readonly triggerRefs?: readonly string[];
}

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
  readonly completeness?: ProviderCompleteness;
  readonly trust?: ProviderTrust;
  readonly reachability?: ProviderReachability;
  readonly reliability?: ProviderReliability;
  readonly obligations?: readonly ProviderObligation[];
  readonly revalidation?: ProviderRevalidation;
}

export class ProviderRegistry {
  readonly #providers = new Map<string, ProviderContract>();

  register(provider: ProviderContract): void {
    this.#validate(provider);
    if (this.#providers.has(provider.key)) throw new Error(`Provider already exists: ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({
      ...provider,
      capabilities: Object.freeze([...provider.capabilities]),
      scopes: Object.freeze([...provider.scopes]),
      ...(provider.obligations !== undefined ? { obligations: Object.freeze(provider.obligations.map((item) => Object.freeze({ ...item }))) } : {}),
      ...(provider.revalidation !== undefined ? {
        revalidation: Object.freeze({
          ...provider.revalidation,
          ...(provider.revalidation.triggerRefs !== undefined ? { triggerRefs: Object.freeze([...provider.revalidation.triggerRefs]) } : {})
        })
      } : {})
    }));
  }

  replace(provider: ProviderContract, expectedVersion: number): void {
    this.#validate(provider);
    const current = this.#required(provider.key);
    if (current.version !== expectedVersion) throw new Error(`Provider version conflict for ${provider.key}`);
    if (provider.version <= current.version) throw new Error(`Provider version must advance for ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({
      ...provider,
      capabilities: Object.freeze([...provider.capabilities]),
      scopes: Object.freeze([...provider.scopes]),
      ...(provider.obligations !== undefined ? { obligations: Object.freeze(provider.obligations.map((item) => Object.freeze({ ...item }))) } : {}),
      ...(provider.revalidation !== undefined ? {
        revalidation: Object.freeze({
          ...provider.revalidation,
          ...(provider.revalidation.triggerRefs !== undefined ? { triggerRefs: Object.freeze([...provider.revalidation.triggerRefs]) } : {})
        })
      } : {})
    }));
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

  assertCurrentScope(key: string, expectedVersion: number, scope: string): ProviderContract {
    if (!scope.trim()) throw new Error("Provider scope is required");
    const current = this.#required(key);
    if (current.version !== expectedVersion) throw new Error(`Provider version conflict for ${key}`);
    if (!current.enabled) throw new Error(`Provider disabled: ${key}`);
    if (!current.scopes.includes(scope)) throw new Error(`Provider scope not granted for ${key}: ${scope}`);
    return current;
  }

  #validate(provider: ProviderContract): void {
    if (typeof provider.enabled !== "boolean" || !["none", "oauth", "api_key_ref", "session", "passkey", "custom_ref"].includes(provider.authMode) || !["free", "paid", "unknown"].includes(provider.cost) || !["available", "degraded", "unavailable", "unconfigured"].includes(provider.health) || !["none", "source", "tool_result", "live_verified"].includes(provider.verification) || !["fail_closed", "read_only", "degraded"].includes(provider.failureMode)) throw new Error("Unsupported provider contract state");
    if (!provider.key.slice("provider:".length).trim() || provider.capabilities.some((item) => !item.trim()) || provider.scopes.some((item) => !item.trim())) throw new Error("Provider identity capabilities and scopes must be nonblank");
    if (!provider.key.startsWith("provider:")) throw new Error(`Provider key must start with provider:: ${provider.key}`);
    if (!Number.isSafeInteger(provider.version) || provider.version < 1) throw new Error("Provider version must be positive");
    if (!Number.isFinite(provider.freshnessSeconds) || provider.freshnessSeconds < 0) throw new Error("Provider freshnessSeconds must be non-negative");
    if (new Set(provider.capabilities).size !== provider.capabilities.length) throw new Error("Provider capabilities must be unique");
    if (new Set(provider.scopes).size !== provider.scopes.length) throw new Error("Provider scopes must be unique");
    if (provider.completeness !== undefined && !["unknown", "partial", "complete"].includes(provider.completeness)) throw new Error("Unsupported provider completeness state");
    if (provider.trust !== undefined && !["unrated", "low", "medium", "high", "authoritative"].includes(provider.trust)) throw new Error("Unsupported provider trust state");
    if (provider.reachability !== undefined && !["unknown", "reachable", "degraded", "unreachable"].includes(provider.reachability)) throw new Error("Unsupported provider reachability state");
    if (provider.reliability !== undefined) {
      if (provider.reliability.successRate !== undefined && (!Number.isFinite(provider.reliability.successRate) || provider.reliability.successRate < 0 || provider.reliability.successRate > 1)) throw new Error("Provider reliability successRate must be between 0 and 1");
      if (provider.reliability.sampleSize !== undefined && (!Number.isSafeInteger(provider.reliability.sampleSize) || provider.reliability.sampleSize < 0)) throw new Error("Provider reliability sampleSize must be non-negative");
      if (provider.reliability.lastFailureAt !== undefined) parseTimestamp(provider.reliability.lastFailureAt, "provider.reliability.lastFailureAt");
    }
    if (provider.obligations !== undefined) {
      for (const obligation of provider.obligations) {
        if (!obligation.kind.trim()) throw new Error("Provider obligation kind is required");
        if (obligation.dueAt !== undefined) parseTimestamp(obligation.dueAt, "provider.obligation.dueAt");
      }
    }
    if (provider.revalidation !== undefined) {
      if (typeof provider.revalidation.required !== "boolean") throw new Error("Provider revalidation required must be boolean");
      if (provider.revalidation.after !== undefined) parseTimestamp(provider.revalidation.after, "provider.revalidation.after");
      if (provider.revalidation.triggerRefs !== undefined && (provider.revalidation.triggerRefs.some((ref) => !ref.trim()) || new Set(provider.revalidation.triggerRefs).size !== provider.revalidation.triggerRefs.length)) throw new Error("Provider revalidation triggerRefs must be unique and nonblank");
    }
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
  readonly completeness?: ProviderCompleteness;
  readonly trust?: ProviderTrust;
  readonly reachability?: ProviderReachability;
  readonly reliability?: ProviderReliability;
  readonly obligationRefs?: readonly string[];
  readonly revalidationRequired?: boolean;
}

export type ProviderDrift = "none" | "compatible" | "breaking" | "pricing_unknown";

export function classifyProviderDrift(previous: ProviderCapabilitySnapshot | undefined, next: ProviderCapabilitySnapshot): ProviderDrift {
  if (!next.id.startsWith("provider-snapshot:") || !next.providerKey.startsWith("provider:") || !next.schemaFingerprint.trim() || !next.capabilityFingerprint.trim()) throw new Error("Provider capability snapshot identity/fingerprints are required");
  parseTimestamp(next.observedAt, "providerSnapshot.observedAt");
  if (new Set(next.capabilities).size !== next.capabilities.length) throw new Error("Provider snapshot capabilities must be unique");
  if (next.obligationRefs !== undefined && (next.obligationRefs.some((ref) => !ref.trim()) || new Set(next.obligationRefs).size !== next.obligationRefs.length)) throw new Error("Provider snapshot obligationRefs must be unique and nonblank");
  if (next.pricing === "unknown") return "pricing_unknown";
  if (!previous) return "compatible";
  if (previous.providerKey !== next.providerKey) throw new Error("Cannot compare drift across different providers");
  const removedCapability = previous.capabilities.some((capability) => !next.capabilities.includes(capability));
  const enumerationRegression = (Object.keys(next.enumeration) as (keyof EnumerationCapability)[]).some((key) => previous.enumeration[key] === "verified_supported" && next.enumeration[key] !== "verified_supported");
  if (removedCapability || enumerationRegression) return "breaking";
  if (previous.schemaFingerprint !== next.schemaFingerprint || previous.capabilityFingerprint !== next.capabilityFingerprint || previous.apiVersion !== next.apiVersion || previous.modelVersion !== next.modelVersion || previous.pricing !== next.pricing || previous.completeness !== next.completeness || previous.trust !== next.trust || previous.reachability !== next.reachability || previous.revalidationRequired !== next.revalidationRequired) return "compatible";
  return "none";
}

export class ProviderCapabilityLedger {
  readonly #snapshots = new Map<string, ProviderCapabilitySnapshot[]>();

  record(snapshot: ProviderCapabilitySnapshot): Readonly<{ snapshot: ProviderCapabilitySnapshot; drift: ProviderDrift }> {
    const history = this.#snapshots.get(snapshot.providerKey) ?? [];
    const previous = history.at(-1);
    const drift = classifyProviderDrift(previous, snapshot);
    const frozen = Object.freeze({
      ...snapshot,
      capabilities: Object.freeze([...snapshot.capabilities]),
      enumeration: Object.freeze({ ...snapshot.enumeration }),
      ...(snapshot.obligationRefs !== undefined ? { obligationRefs: Object.freeze([...snapshot.obligationRefs]) } : {})
    });
    this.#snapshots.set(snapshot.providerKey, [...history, frozen]);
    return Object.freeze({ snapshot: frozen, drift });
  }

  latest(providerKey: string): ProviderCapabilitySnapshot | undefined { return this.#snapshots.get(providerKey)?.at(-1); }
  history(providerKey: string): readonly ProviderCapabilitySnapshot[] { return Object.freeze([...(this.#snapshots.get(providerKey) ?? [])]); }
}
