import { parseTimestamp } from "../security/types.js";

export type CircuitBreakerScope = "project" | "portfolio";
export type CircuitBreakerState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  readonly breakerId: string;
  readonly scope: CircuitBreakerScope;
  readonly scopeKey: string;
  readonly failureThreshold: number;
  readonly cooldownMs: number;
}

export interface CircuitBreakerSnapshot extends CircuitBreakerConfig {
  readonly state: CircuitBreakerState;
  readonly failureCount: number;
  readonly openedAt: string | null;
  readonly probeStartedAt: string | null;
  readonly version: number;
  readonly evidenceRefs: readonly string[];
}

export interface CircuitBreakerPermit {
  readonly allowed: boolean;
  readonly reason: "closed" | "cooldown" | "half_open_probe" | "probe_in_flight";
  readonly breaker: CircuitBreakerSnapshot;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function positiveSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

function uniqueEvidence(refs: readonly string[], label: string): readonly string[] {
  if (refs.length === 0) throw new Error(`${label} requires evidence`);
  const normalized = refs.map((ref) => required(ref, `${label} evidence reference`));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} evidence references must be unique`);
  return Object.freeze(normalized);
}

function mergeEvidence(existing: readonly string[], added: readonly string[], label: string): readonly string[] {
  const next = uniqueEvidence(added, label);
  return Object.freeze([...new Set([...existing, ...next])]);
}

function assertBreaker(snapshot: CircuitBreakerSnapshot): void {
  required(snapshot.breakerId, "breakerId");
  required(snapshot.scopeKey, "scopeKey");
  if (snapshot.scope !== "project" && snapshot.scope !== "portfolio") throw new Error("Invalid circuit-breaker scope");
  positiveSafeInteger(snapshot.failureThreshold, "failureThreshold");
  positiveSafeInteger(snapshot.cooldownMs, "cooldownMs");
  if (!Number.isSafeInteger(snapshot.failureCount) || snapshot.failureCount < 0) throw new Error("failureCount must be a nonnegative safe integer");
  positiveSafeInteger(snapshot.version, "version");
  uniqueEvidence(snapshot.evidenceRefs, "Circuit breaker");
  if (!(["closed", "open", "half_open"] as const).includes(snapshot.state)) throw new Error("Invalid circuit-breaker state");
  if (snapshot.state === "closed" && (snapshot.openedAt !== null || snapshot.probeStartedAt !== null)) throw new Error("Closed breaker cannot retain open/probe timestamps");
  if (snapshot.state === "open" && (snapshot.openedAt === null || snapshot.probeStartedAt !== null)) throw new Error("Open breaker requires openedAt and no probe");
  if (snapshot.state === "half_open" && (snapshot.openedAt === null || snapshot.probeStartedAt === null)) throw new Error("Half-open breaker requires open/probe timestamps");
  if (snapshot.openedAt !== null) parseTimestamp(snapshot.openedAt, "openedAt");
  if (snapshot.probeStartedAt !== null) parseTimestamp(snapshot.probeStartedAt, "probeStartedAt");
}

export function createCircuitBreaker(config: CircuitBreakerConfig, evidenceRefs: readonly string[]): CircuitBreakerSnapshot {
  const snapshot: CircuitBreakerSnapshot = Object.freeze({
    breakerId: required(config.breakerId, "breakerId"),
    scope: config.scope,
    scopeKey: required(config.scopeKey, "scopeKey"),
    failureThreshold: positiveSafeInteger(config.failureThreshold, "failureThreshold"),
    cooldownMs: positiveSafeInteger(config.cooldownMs, "cooldownMs"),
    state: "closed",
    failureCount: 0,
    openedAt: null,
    probeStartedAt: null,
    version: 1,
    evidenceRefs: uniqueEvidence(evidenceRefs, "Circuit breaker creation")
  });
  assertBreaker(snapshot);
  return snapshot;
}

export function requestCircuitBreakerPermit(snapshot: CircuitBreakerSnapshot, now: string, evidenceRefs: readonly string[]): CircuitBreakerPermit {
  assertBreaker(snapshot);
  const nowMs = parseTimestamp(now, "now");
  const evidence = mergeEvidence(snapshot.evidenceRefs, evidenceRefs, "Circuit breaker permit");
  if (snapshot.state === "closed") return Object.freeze({ allowed: true, reason: "closed", breaker: snapshot });
  if (snapshot.state === "half_open") return Object.freeze({ allowed: false, reason: "probe_in_flight", breaker: snapshot });
  const openedMs = parseTimestamp(snapshot.openedAt as string, "openedAt");
  if (nowMs < openedMs + snapshot.cooldownMs) return Object.freeze({ allowed: false, reason: "cooldown", breaker: snapshot });
  const breaker: CircuitBreakerSnapshot = Object.freeze({
    ...snapshot,
    state: "half_open",
    probeStartedAt: now,
    version: snapshot.version + 1,
    evidenceRefs: evidence
  });
  assertBreaker(breaker);
  return Object.freeze({ allowed: true, reason: "half_open_probe", breaker });
}

export function recordCircuitBreakerFailure(snapshot: CircuitBreakerSnapshot, now: string, evidenceRefs: readonly string[]): CircuitBreakerSnapshot {
  assertBreaker(snapshot);
  parseTimestamp(now, "now");
  if (snapshot.state === "open") throw new Error("Open breaker cannot record an unpermitted failure");
  const nextCount = snapshot.state === "half_open" ? snapshot.failureThreshold : snapshot.failureCount + 1;
  const opens = snapshot.state === "half_open" || nextCount >= snapshot.failureThreshold;
  const breaker: CircuitBreakerSnapshot = Object.freeze({
    ...snapshot,
    state: opens ? "open" : "closed",
    failureCount: nextCount,
    openedAt: opens ? now : null,
    probeStartedAt: null,
    version: snapshot.version + 1,
    evidenceRefs: mergeEvidence(snapshot.evidenceRefs, evidenceRefs, "Circuit breaker failure")
  });
  assertBreaker(breaker);
  return breaker;
}

export function recordCircuitBreakerSuccess(snapshot: CircuitBreakerSnapshot, now: string, evidenceRefs: readonly string[]): CircuitBreakerSnapshot {
  assertBreaker(snapshot);
  parseTimestamp(now, "now");
  if (snapshot.state === "open") throw new Error("Open breaker requires a half-open probe before success can close it");
  const breaker: CircuitBreakerSnapshot = Object.freeze({
    ...snapshot,
    state: "closed",
    failureCount: 0,
    openedAt: null,
    probeStartedAt: null,
    version: snapshot.version + 1,
    evidenceRefs: mergeEvidence(snapshot.evidenceRefs, evidenceRefs, "Circuit breaker success")
  });
  assertBreaker(breaker);
  return breaker;
}

export type DeadLetterState = "dead_letter" | "blocked" | "requeued" | "resolved";
export type DeadLetterFailureClass = "retry_exhausted" | "permanent_failure" | "blocked";

export interface DeadLetterTransition {
  readonly from: DeadLetterState;
  readonly to: DeadLetterState;
  readonly reason: string;
  readonly occurredAt: string;
  readonly evidenceRefs: readonly string[];
}

export interface DeadLetterRecord {
  readonly deadLetterId: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly runId: string;
  readonly taskId: string;
  readonly state: DeadLetterState;
  readonly failureClass: DeadLetterFailureClass;
  readonly attemptCount: number;
  readonly reason: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
  readonly evidenceRefs: readonly string[];
  readonly transitions: readonly DeadLetterTransition[];
  readonly taskCompletionAuthorized: false;
}

export interface DeadLetterScope {
  readonly ownerId: string;
  readonly projectId: string;
  readonly runId: string;
  readonly taskId: string;
}

export interface CreateDeadLetterInput extends DeadLetterScope {
  readonly deadLetterId: string;
  readonly disposition: "dead_letter" | "blocked";
  readonly failureClass: DeadLetterFailureClass;
  readonly attemptCount: number;
  readonly reason: string;
  readonly occurredAt: string;
  readonly evidenceRefs: readonly string[];
}

function assertExactDeadLetterScope(record: DeadLetterRecord, scope: DeadLetterScope): void {
  if (record.ownerId !== scope.ownerId || record.projectId !== scope.projectId || record.runId !== scope.runId || record.taskId !== scope.taskId) {
    throw new Error("Dead-letter scope mismatch");
  }
}

export function createDeadLetter(input: CreateDeadLetterInput): DeadLetterRecord {
  const deadLetterId = required(input.deadLetterId, "deadLetterId");
  const ownerId = required(input.ownerId, "ownerId");
  const projectId = required(input.projectId, "projectId");
  const runId = required(input.runId, "runId");
  const taskId = required(input.taskId, "taskId");
  const reason = required(input.reason, "reason");
  positiveSafeInteger(input.attemptCount, "attemptCount");
  parseTimestamp(input.occurredAt, "occurredAt");
  if (input.disposition === "dead_letter" && input.failureClass === "blocked") throw new Error("Dead-letter disposition requires exhausted or permanent failure");
  if (input.disposition === "blocked" && input.failureClass !== "blocked") throw new Error("Blocked disposition requires blocked failure class");
  const evidenceRefs = uniqueEvidence(input.evidenceRefs, "Dead-letter creation");
  return Object.freeze({
    deadLetterId,
    ownerId,
    projectId,
    runId,
    taskId,
    state: input.disposition,
    failureClass: input.failureClass,
    attemptCount: input.attemptCount,
    reason,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
    version: 1,
    evidenceRefs,
    transitions: Object.freeze([]),
    taskCompletionAuthorized: false
  });
}

export function manageDeadLetter(
  record: DeadLetterRecord,
  scope: DeadLetterScope,
  action: "requeue" | "resolve",
  reason: string,
  occurredAt: string,
  evidenceRefs: readonly string[]
): DeadLetterRecord {
  assertExactDeadLetterScope(record, scope);
  if (record.state !== "dead_letter" && record.state !== "blocked") throw new Error("Only active dead-letter/blocked records can be managed");
  const reasonText = required(reason, "dead-letter management reason");
  const nowMs = parseTimestamp(occurredAt, "occurredAt");
  if (nowMs < parseTimestamp(record.updatedAt, "updatedAt")) throw new Error("Dead-letter transition time cannot move backward");
  const transitionEvidence = uniqueEvidence(evidenceRefs, "Dead-letter transition");
  const nextState: DeadLetterState = action === "requeue" ? "requeued" : "resolved";
  const transition: DeadLetterTransition = Object.freeze({
    from: record.state,
    to: nextState,
    reason: reasonText,
    occurredAt,
    evidenceRefs: transitionEvidence
  });
  return Object.freeze({
    ...record,
    state: nextState,
    reason: reasonText,
    updatedAt: occurredAt,
    version: record.version + 1,
    evidenceRefs: mergeEvidence(record.evidenceRefs, transitionEvidence, "Dead-letter transition"),
    transitions: Object.freeze([...record.transitions, transition]),
    taskCompletionAuthorized: false
  });
}
