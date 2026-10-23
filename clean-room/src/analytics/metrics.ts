export type MetricTruth = "verified" | "calculated" | "estimated";
export type MissingSemantics = "unknown" | "not_applicable";

export interface MetricDefinition {
  readonly key: string;
  readonly domain: string;
  readonly owner: string;
  readonly sourceKind: string;
  readonly formulaRef: string | null;
  readonly freshnessMs: number;
  readonly truth: MetricTruth;
  readonly format: string;
  readonly zeroMeaning: string;
  readonly missingMeaning: MissingSemantics;
}

export interface MetricValue {
  readonly metricKey: string;
  readonly value: number | null;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
  readonly truth: MetricTruth;
}

export class MetricRegistry {
  readonly #definitions = new Map<string, MetricDefinition>();
  register(definition: MetricDefinition): MetricDefinition {
    if (!definition.key.trim() || !definition.domain.trim() || !definition.owner.trim() || !definition.sourceKind.trim() || definition.freshnessMs < 0) throw new Error("metric semantic definition incomplete");
    if (this.#definitions.has(definition.key)) throw new Error("metric already registered");
    const frozen = Object.freeze({ ...definition });
    this.#definitions.set(definition.key, frozen);
    return frozen;
  }
  get(key: string): MetricDefinition {
    const definition = this.#definitions.get(key);
    if (!definition) throw new Error(`unknown metric: ${key}`);
    return definition;
  }
  list(): readonly MetricDefinition[] { return Object.freeze([...this.#definitions.values()]); }
}

export function validateMetricValue(registry: MetricRegistry, value: MetricValue, nowMs: number): MetricValue {
  const definition = registry.get(value.metricKey);
  if (!value.observedAt.includes("T") || value.sourceRefs.length === 0) throw new Error("metric value requires freshness and provenance");
  if (value.value !== null && !Number.isFinite(value.value)) throw new Error("metric value must be finite or explicit missing");
  if (value.truth === "estimated" && definition.truth === "verified") throw new Error("estimated value cannot populate verified-only metric");
  const age = nowMs - Date.parse(value.observedAt);
  if (!Number.isFinite(age) || age < 0 || age > definition.freshnessMs) throw new Error("metric value is stale or invalid");
  return Object.freeze({ ...value, sourceRefs: Object.freeze([...value.sourceRefs]) });
}
