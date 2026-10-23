export interface ReliabilitySignal {
  readonly domain: string;
  readonly kind: "availability" | "latency" | "error_rate" | "queue_depth" | "retry_rate" | "provider_health" | "resource_saturation" | "cache_health" | "update_health";
  readonly severity: "ok" | "warning" | "critical";
  readonly value: number;
  readonly sourceRefs: readonly string[];
}

export function identifyReliabilityBottleneck(signals: readonly ReliabilitySignal[]): Readonly<{ domain: string; severity: "warning" | "critical"; reasons: readonly string[] }> | null {
  const ranked = signals.filter((signal) => signal.severity !== "ok");
  if (ranked.length === 0) return null;
  const byDomain = new Map<string, ReliabilitySignal[]>();
  for (const signal of ranked) byDomain.set(signal.domain, [...(byDomain.get(signal.domain) ?? []), signal]);
  const candidates = [...byDomain.entries()].map(([domain, domainSignals]) => ({ domain, domainSignals, score: domainSignals.reduce((sum, signal) => sum + (signal.severity === "critical" ? 2 : 1), 0) })).sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));
  const top = candidates[0];
  if (!top) return null;
  return Object.freeze({ domain: top.domain, severity: top.domainSignals.some((signal) => signal.severity === "critical") ? "critical" : "warning", reasons: Object.freeze(top.domainSignals.map((signal) => signal.kind)) });
}
