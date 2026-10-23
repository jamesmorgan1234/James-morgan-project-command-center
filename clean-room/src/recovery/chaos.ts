export type ChaosFault = "db" | "network" | "provider" | "cache" | "worker" | "scheduler" | "lead" | "partition" | "stale_lease" | "duplicate_delivery" | "disk_exhaustion" | "resource_exhaustion";

export interface ChaosScenario {
  readonly fault: ChaosFault;
  readonly fencingEnabled: boolean;
  readonly durableCheckpointRef: string;
  readonly staleMutationAccepted: boolean;
  readonly resumedFromCheckpoint: boolean;
}

export function verifyChaosOutcome(scenario: ChaosScenario): void {
  if (!scenario.fencingEnabled) throw new Error("distributed chaos test requires fencing");
  if (!scenario.durableCheckpointRef.trim()) throw new Error("distributed chaos test requires durable checkpoint");
  if (scenario.staleMutationAccepted) throw new Error("stale mutation corrupted protected state");
  if (!scenario.resumedFromCheckpoint) throw new Error("durable work did not resume from verified checkpoint");
}
