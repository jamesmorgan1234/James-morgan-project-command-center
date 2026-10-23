export interface DelegationEnvelope {
  readonly parentTaskId: string;
  readonly childTaskId: string;
  readonly depth: number;
  readonly parentScopes: readonly string[];
  readonly childScopes: readonly string[];
  readonly capability: string;
}

export function validateDelegation(envelope: DelegationEnvelope, maxDepth: number, currentFanOut: number, maxFanOut: number): void {
  if (envelope.depth > maxDepth) throw new Error("Delegation depth limit exceeded");
  if (currentFanOut >= maxFanOut) throw new Error("Delegation fan-out limit exceeded");
  if (!envelope.parentTaskId.trim() || !envelope.childTaskId.trim() || !envelope.capability.trim()) throw new Error("Delegation identity/capability are required");
  for (const scope of envelope.childScopes) if (!envelope.parentScopes.includes(scope)) throw new Error(`Delegation authority amplification blocked: ${scope}`);
}
