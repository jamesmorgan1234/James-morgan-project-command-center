export type AiCostClass = "free" | "paid" | "unknown";
export type AiPrivacyClass = "local" | "private_remote" | "remote";
export type AiHealth = "available" | "degraded" | "unavailable";

export interface AiModelRoute {
  readonly key: string;
  readonly providerKey: string;
  readonly modelId: string;
  readonly versionRef: string;
  readonly enabled: boolean;
  readonly capabilities: readonly string[];
  readonly cost: AiCostClass;
  readonly privacy: AiPrivacyClass;
  readonly health: AiHealth;
  readonly qualityRank: number;
  readonly latencyRank: number;
  readonly quotaAvailable: boolean | "unknown";
}

export interface AiRoutingRequest {
  readonly capability: string;
  readonly allowPaid: boolean;
  readonly maxPrivacy: AiPrivacyClass;
  readonly preferQuality: boolean;
}

const PRIVACY_RANK: Readonly<Record<AiPrivacyClass, number>> = Object.freeze({ local: 0, private_remote: 1, remote: 2 });

export class AiRouteRegistry {
  readonly #routes = new Map<string, AiModelRoute>();

  register(route: AiModelRoute): void {
    if (!route.key.startsWith("ai-route:") || !route.providerKey.trim() || !route.modelId.trim() || !route.versionRef.trim()) throw new Error("AI route identity/provider/model/version are required");
    if (!Number.isFinite(route.qualityRank) || !Number.isFinite(route.latencyRank)) throw new Error("AI route ranks must be finite");
    if (this.#routes.has(route.key)) throw new Error(`AI route already exists: ${route.key}`);
    this.#routes.set(route.key, Object.freeze({ ...route, capabilities: Object.freeze([...route.capabilities]) }));
  }

  remove(key: string): AiModelRoute {
    const route = this.#routes.get(key);
    if (!route) throw new Error(`Unknown AI route: ${key}`);
    this.#routes.delete(key);
    return route;
  }

  route(request: AiRoutingRequest): AiModelRoute | undefined {
    const eligible = [...this.#routes.values()].filter((route) => route.enabled && route.health !== "unavailable" && route.capabilities.includes(request.capability) && (request.allowPaid || route.cost !== "paid") && PRIVACY_RANK[route.privacy] <= PRIVACY_RANK[request.maxPrivacy] && route.quotaAvailable !== false);
    eligible.sort((a, b) => request.preferQuality ? b.qualityRank - a.qualityRank || a.latencyRank - b.latencyRank : a.latencyRank - b.latencyRank || b.qualityRank - a.qualityRank);
    return eligible[0];
  }
}
