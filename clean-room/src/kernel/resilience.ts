import { parseTimestamp } from "../security/types.js";

export interface BackoffRetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly multiplier: number;
  readonly maxDelayMs: number;
}

function positiveSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

export function deterministicRetryDelay(policy: BackoffRetryPolicy, attempt: number): number {
  positiveSafeInteger(policy.maxAttempts, "maxAttempts");
  positiveSafeInteger(policy.baseDelayMs, "baseDelayMs");
  positiveSafeInteger(policy.multiplier, "multiplier");
  positiveSafeInteger(policy.maxDelayMs, "maxDelayMs");
  positiveSafeInteger(attempt, "attempt");
  if (attempt >= policy.maxAttempts) throw new Error("Retry budget exhausted");
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * (policy.multiplier ** (attempt - 1)));
}

export class PessimisticLockTable {
  readonly #locks = new Map<string, string>();
  acquire(resource: string, token: string): void {
    if (!resource.trim() || !token.trim()) throw new Error("Lock resource and token are required");
    const current = this.#locks.get(resource);
    if (current && current !== token) throw new Error(`Resource is locked: ${resource}`);
    this.#locks.set(resource, token);
  }
  release(resource: string, token: string): void {
    if (this.#locks.get(resource) !== token) throw new Error(`Stale or invalid lock token for ${resource}`);
    this.#locks.delete(resource);
  }
}

export function assertOptimisticVersion(actualVersion: number, expectedVersion: number, nextVersion: number): void {
  positiveSafeInteger(actualVersion, "actualVersion");
  positiveSafeInteger(expectedVersion, "expectedVersion");
  positiveSafeInteger(nextVersion, "nextVersion");
  if (actualVersion !== expectedVersion) throw new Error(`Optimistic concurrency conflict: expected ${expectedVersion}, got ${actualVersion}`);
  if (nextVersion <= actualVersion) throw new Error("Optimistic concurrency version must advance");
}

export class BackpressureError extends Error {
  constructor(readonly capacity: number) {
    super(`Backpressure capacity reached: ${capacity}`);
    this.name = "BackpressureError";
  }
}

export class BoundedWorkQueue<T> {
  readonly #items: T[] = [];
  readonly capacity: number;
  constructor(capacity: number) { this.capacity = positiveSafeInteger(capacity, "capacity"); }
  enqueue(item: T): void {
    if (this.#items.length >= this.capacity) throw new BackpressureError(this.capacity);
    this.#items.push(item);
  }
  dequeue(): T | undefined { return this.#items.shift(); }
  get size(): number { return this.#items.length; }
}

export type ServiceHealth = "healthy" | "degraded" | "unavailable";
export interface DegradationDecision<T> { readonly health: ServiceHealth; readonly value?: T; readonly reason?: string; }
export function gracefulDegradation<T>(primary: () => T, fallback: () => T, unavailableReason: string): DegradationDecision<T> {
  try { return Object.freeze({ health: "healthy", value: primary() }); }
  catch {
    try { return Object.freeze({ health: "degraded", value: fallback(), reason: unavailableReason }); }
    catch { return Object.freeze({ health: "unavailable", reason: unavailableReason }); }
  }
}

export interface TransactionStep<TContext> {
  readonly name: string;
  readonly execute: (context: TContext) => void | Promise<void>;
  readonly compensate: (context: TContext) => void | Promise<void>;
}

export class CompensatingTransaction<TContext> {
  readonly #steps: readonly TransactionStep<TContext>[];
  constructor(steps: readonly TransactionStep<TContext>[]) {
    if (steps.length === 0) throw new Error("Transaction requires at least one step");
    if (new Set(steps.map((step) => step.name)).size !== steps.length) throw new Error("Transaction step names must be unique");
    if (steps.some((step) => !step.name.trim())) throw new Error("Transaction step name is required");
    this.#steps = Object.freeze([...steps]);
  }
  async execute(context: TContext): Promise<readonly string[]> {
    const completed: TransactionStep<TContext>[] = [];
    try {
      for (const step of this.#steps) {
        await step.execute(context);
        completed.push(step);
      }
      return Object.freeze(completed.map((step) => step.name));
    } catch (error) {
      const compensationErrors: Error[] = [];
      for (const step of [...completed].reverse()) {
        try { await step.compensate(context); }
        catch (compensationError) { compensationErrors.push(compensationError instanceof Error ? compensationError : new Error(String(compensationError))); }
      }
      if (compensationErrors.length) throw new AggregateError([error, ...compensationErrors], "Transaction failed and compensation was incomplete");
      throw error;
    }
  }
}

export interface CacheEntry<T> { readonly value: T; readonly sourceVersion: number; readonly cachedAt: string; }
export class CoherentCache<T> {
  readonly #entries = new Map<string, CacheEntry<T>>();
  set(key: string, entry: CacheEntry<T>): void {
    if (!key.trim()) throw new Error("Cache key is required");
    positiveSafeInteger(entry.sourceVersion, "sourceVersion");
    parseTimestamp(entry.cachedAt, "cachedAt");
    const current = this.#entries.get(key);
    if (current && entry.sourceVersion < current.sourceVersion) throw new Error("Stale cache write rejected");
    this.#entries.set(key, Object.freeze({ ...entry }));
  }
  get(key: string, sourceVersion: number): T | undefined {
    positiveSafeInteger(sourceVersion, "sourceVersion");
    const entry = this.#entries.get(key);
    return entry?.sourceVersion === sourceVersion ? entry.value : undefined;
  }
  invalidate(key: string): void { this.#entries.delete(key); }
}

export interface FeatureFlagRecord { readonly key: string; readonly version: number; readonly enabled: boolean; readonly safeToEnable: boolean; }
function assertFeatureFlagBooleans(record: FeatureFlagRecord): void {
  if (typeof record.enabled !== "boolean" || typeof record.safeToEnable !== "boolean") throw new Error("Feature enabled and safeToEnable must be explicit booleans");
}

export class SafeFeatureFlags {
  readonly #flags = new Map<string, FeatureFlagRecord>();
  register(record: FeatureFlagRecord): void {
    assertFeatureFlagBooleans(record);
    if (!record.key.trim()) throw new Error("Feature flag key is required");
    positiveSafeInteger(record.version, "feature flag version");
    if (record.enabled && !record.safeToEnable) throw new Error(`Unsafe feature flag cannot be enabled: ${record.key}`);
    if (this.#flags.has(record.key)) throw new Error(`Feature flag already registered: ${record.key}`);
    this.#flags.set(record.key, Object.freeze({ ...record }));
  }
  replace(record: FeatureFlagRecord, expectedVersion: number): void {
    assertFeatureFlagBooleans(record);
    const current = this.#flags.get(record.key);
    if (!current) throw new Error(`Unknown feature flag: ${record.key}`);
    assertOptimisticVersion(current.version, expectedVersion, record.version);
    if (record.enabled && !record.safeToEnable) throw new Error(`Unsafe feature flag cannot be enabled: ${record.key}`);
    this.#flags.set(record.key, Object.freeze({ ...record }));
  }
  enabled(key: string): boolean { return this.#flags.get(key)?.enabled === true; }
}

export interface DeprecationWindow { readonly announcedAt: string; readonly sunsetAt: string; }
export function deprecationState(window: DeprecationWindow, now: string): "active" | "deprecated" | "retired" {
  const announced = parseTimestamp(window.announcedAt, "announcedAt");
  const sunset = parseTimestamp(window.sunsetAt, "sunsetAt");
  const current = parseTimestamp(now, "now");
  if (sunset <= announced) throw new Error("Deprecation sunset must follow announcement");
  if (current < announced) return "active";
  if (current < sunset) return "deprecated";
  return "retired";
}

export interface ObservabilityEvent {
  readonly traceId: string;
  readonly hook: string;
  readonly timestamp: string;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}
export class ObservabilityHooks {
  readonly #events: ObservabilityEvent[] = [];
  emit(event: ObservabilityEvent): ObservabilityEvent {
    if (!event.traceId.trim()) throw new Error("traceId is required");
    if (!event.hook.trim()) throw new Error("observability hook is required");
    parseTimestamp(event.timestamp, "timestamp");
    const frozen = Object.freeze({ ...event, attributes: Object.freeze({ ...event.attributes }) });
    this.#events.push(frozen);
    return frozen;
  }
  byTrace(traceId: string): readonly ObservabilityEvent[] {
    if (!traceId.trim()) throw new Error("traceId is required");
    return Object.freeze(this.#events.filter((event) => event.traceId === traceId));
  }
}
