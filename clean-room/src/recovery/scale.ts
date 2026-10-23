export interface CapacitySample {
  readonly projects: number;
  readonly books: number;
  readonly accounts: number;
  readonly socialChannels: number;
  readonly agencyJobs: number;
  readonly knowledgeRecords: number;
  readonly cpuPercent: number;
  readonly memoryPercent: number;
  readonly queueDepth: number;
  readonly providerDegraded: boolean;
}

export function capacityDecision(sample: CapacitySample): "accept" | "backpressure" {
  const invalid = Object.values(sample).some((value) => typeof value === "number" && (!Number.isFinite(value) || value < 0));
  if (invalid) throw new Error("invalid capacity sample");
  if (sample.cpuPercent >= 85 || sample.memoryPercent >= 85 || sample.queueDepth >= 1000 || sample.providerDegraded) return "backpressure";
  return "accept";
}
