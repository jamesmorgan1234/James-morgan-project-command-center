import { parseTimestamp } from "../security/types.js";

/**
 * Side-effect discipline and failure policy.
 *
 * Fresh lock/stop checks before a side effect, reservation, post-effect
 * verification, checkpoints, recorded task outcomes, retry fingerprints,
 * systemic failure grouping, circuit breaking and quarantine.
 */

export interface SideEffectGate {
  readonly projectLockToken: string | null;
  readonly expectedProjectLockToken: string;
  readonly stopOrPauseRequested: boolean;
}

export function assertSideEffectAllowed(gate: SideEffectGate): void {
  if (gate.projectLockToken !== gate.expectedProjectLockToken) throw new Error("Project lock is stale before side effect");
  if (gate.stopOrPauseRequested) throw new Error("Stop or pause requested before side effect");
}

export function reserveSideEffect(key: string, reserved: Set<string>): void {
  if (!key.trim()) throw new Error("Side-effect reservation requires a key");
  if (reserved.has(key)) throw new Error(`Side effect already reserved: ${key}`);
  reserved.add(key);
}

export function verifySideEffect(observed: string | null, expected: string): string {
  if (!expected.trim()) throw new Error("Side-effect verification requires an expectation");
  if (observed !== expected) throw new Error(`Post-side-effect verification failed: expected ${expected}`);
  return observed;
}

export interface Checkpoint {
  readonly taskKey: string;
  readonly stateVersion: number;
  readonly createdAt: string;
}

export function writeCheckpoint(state: { taskKey: string; stable: boolean; stateVersion: number }, createdAt: string): Checkpoint {
  if (!state.taskKey.trim()) throw new Error("Checkpoint requires a task key");
  if (!state.stable) throw new Error("Checkpoint requires a meaningful stable state");
  if (!Number.isSafeInteger(state.stateVersion) || state.stateVersion < 1) throw new Error("Checkpoint requires a positive state version");
  parseTimestamp(createdAt, "createdAt");
  return Object.freeze({ taskKey: state.taskKey, stateVersion: state.stateVersion, createdAt });
}

export function selectNextTask(ready: readonly string[], checkpoint: Checkpoint | null): string {
  if (checkpoint === null) throw new Error("Next task requires a checkpoint where checkpointing applies");
  const next = ready[0];
  if (next === undefined) throw new Error("No ready task to select");
  return next;
}

export function assertAdvanceable(evidence: { readonly ambiguous: boolean }): void {
  if (evidence.ambiguous) throw new Error("Task advancement refused on ambiguous evidence");
}

export type SkipPolicy = "explicit_allow" | "forbid";

export function assertSkipAllowed(policy: SkipPolicy): void {
  if (policy !== "explicit_allow") throw new Error("Automatic task skip requires an explicit policy");
}

export type TaskOutcome = "skipped" | "excluded" | "blocked" | "failed" | "reopened";

export interface TaskOutcomeRecord {
  readonly taskKey: string;
  readonly outcome: TaskOutcome;
  readonly reason: string;
}

export function recordTaskOutcome(taskKey: string, outcome: TaskOutcome, reason: string): TaskOutcomeRecord {
  if (!taskKey.trim()) throw new Error("Outcome requires a task key");
  if (!reason.trim()) throw new Error(`A ${outcome} task requires a recorded reason`);
  return Object.freeze({ taskKey, outcome, reason });
}

export type RetryKind = "task" | "run" | "provider";

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function retryFingerprint(kind: RetryKind, parts: readonly string[]): string {
  if (parts.length === 0 || parts.some((part) => !part.trim())) throw new Error("Retry fingerprint requires nonblank parts");
  return `${kind}:${fnv1a(`${kind}\u0000${parts.join("\u0000")}`)}`;
}

export interface SystemicFailureGroup {
  readonly fingerprint: string;
  readonly occurrences: number;
}

export function groupSystemicFailures(fingerprints: readonly string[], minimumOccurrences = 2): readonly SystemicFailureGroup[] {
  const counts = new Map<string, number>();
  for (const fingerprint of fingerprints) counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
  const groups: SystemicFailureGroup[] = [];
  for (const [fingerprint, occurrences] of counts) if (occurrences >= minimumOccurrences) groups.push(Object.freeze({ fingerprint, occurrences }));
  return Object.freeze(groups.sort((a, b) => b.occurrences - a.occurrences || a.fingerprint.localeCompare(b.fingerprint)));
}

export class CircuitBreaker {
  readonly #threshold: number;
  readonly #cooldownMs: number;
  #failures = 0;
  #openedAt: number | null = null;

  constructor(threshold: number, cooldownMs: number) {
    if (!Number.isSafeInteger(threshold) || threshold < 1) throw new Error("Circuit-breaker threshold must be a positive integer");
    if (!Number.isSafeInteger(cooldownMs) || cooldownMs < 0) throw new Error("Circuit-breaker cooldown must be a nonnegative integer");
    this.#threshold = threshold;
    this.#cooldownMs = cooldownMs;
  }

  get failures(): number { return this.#failures; }
  get open(): boolean { return this.#openedAt !== null; }

  recordFailure(now: Date): void {
    this.#failures += 1;
    if (this.#failures >= this.#threshold) this.#openedAt = now.getTime();
  }

  canProceed(now: Date): boolean {
    if (this.#openedAt === null) return true;
    return now.getTime() - this.#openedAt >= this.#cooldownMs;
  }

  recordSuccess(): void { this.#failures = 0; this.#openedAt = null; }
  manualReset(): void { this.#failures = 0; this.#openedAt = null; }
}

export class QuarantineRegistry {
  readonly #failures = new Map<string, number>();
  readonly #quarantined = new Set<string>();

  recordFailure(key: string, threshold: number): boolean {
    if (!key.trim()) throw new Error("Quarantine key must be nonblank");
    if (!Number.isSafeInteger(threshold) || threshold < 1) throw new Error("Quarantine threshold must be a positive integer");
    const next = (this.#failures.get(key) ?? 0) + 1;
    this.#failures.set(key, next);
    if (next >= threshold) { this.#quarantined.add(key); return true; }
    return false;
  }

  isQuarantined(key: string): boolean { return this.#quarantined.has(key); }

  assertAvailable(key: string): void {
    if (this.isQuarantined(key)) throw new Error(`Quarantined: ${key}`);
  }

  clear(key: string): void { this.#failures.delete(key); this.#quarantined.delete(key); }
}
