export interface AgencyAnalyticsSample {
  readonly projectId: string;
  readonly workerId: string;
  readonly claimLatencyMs: number;
  readonly leaseLosses: number;
  readonly staleWriteBlocks: number;
  readonly conflicts: number;
  readonly verifierRejects: number;
  readonly steals: number;
  readonly queueDepth: number;
  readonly resourceUnits: number;
  readonly sensitiveTaskContentIncluded: boolean;
}

export function summarizeAgency(samples: readonly AgencyAnalyticsSample[]): Readonly<{ workers: number; averageClaimLatencyMs: number; leaseLosses: number; staleWriteBlocks: number; conflicts: number; verifierRejects: number; queueDepth: number; resourceUnits: number }> {
  if (samples.some((sample) => sample.sensitiveTaskContentIncluded)) throw new Error("Agency analytics must not expose sensitive task content");
  if (samples.length === 0) return Object.freeze({ workers: 0, averageClaimLatencyMs: 0, leaseLosses: 0, staleWriteBlocks: 0, conflicts: 0, verifierRejects: 0, queueDepth: 0, resourceUnits: 0 });
  return Object.freeze({
    workers: new Set(samples.map((sample) => sample.workerId)).size,
    averageClaimLatencyMs: samples.reduce((sum, sample) => sum + sample.claimLatencyMs, 0) / samples.length,
    leaseLosses: samples.reduce((sum, sample) => sum + sample.leaseLosses, 0),
    staleWriteBlocks: samples.reduce((sum, sample) => sum + sample.staleWriteBlocks, 0),
    conflicts: samples.reduce((sum, sample) => sum + sample.conflicts, 0),
    verifierRejects: samples.reduce((sum, sample) => sum + sample.verifierRejects, 0),
    queueDepth: samples.reduce((sum, sample) => sum + sample.queueDepth, 0),
    resourceUnits: samples.reduce((sum, sample) => sum + sample.resourceUnits, 0)
  });
}
