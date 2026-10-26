import { assertIdentifierKind } from "./identifiers.js";
import { Registry, type RegistryRecord } from "./registry.js";

export type MethodLifecycle = "experimental" | "active" | "deprecated" | "retired";
export type MethodCostClass = "free" | "paid" | "unknown";
export type MethodPrivacyClass = "local" | "private_remote" | "remote";
export type MethodDataSensitivity = "internal" | "sensitive" | "protected" | "secret";
export type MethodResourceClass = "low" | "medium" | "high";
export type MethodOptimization = "quality" | "latency" | "reliability" | "balanced";

export interface CapabilityMethodContract extends RegistryRecord {
  readonly capabilityKey: string;
  readonly implementationVersionRef: string;
  readonly lifecycle: MethodLifecycle;
  readonly applicabilityScopeKeys: readonly string[];
  readonly contraindications: readonly string[];
  readonly prerequisites: readonly string[];
  readonly qualityScore: number;
  readonly calibrationScore: number;
  readonly latencyMs: number;
  readonly resourceClass: MethodResourceClass;
  readonly costClass: MethodCostClass;
  readonly privacyClass: MethodPrivacyClass;
  readonly maxDataSensitivity: MethodDataSensitivity;
  readonly securityAssurance: number;
  readonly reliabilityScore: number;
  readonly benchmarkEvidenceIds: readonly string[];
  readonly outcomeEvidenceIds: readonly string[];
  readonly provenanceEvidenceIds: readonly string[];
  readonly fallbackMethodIds: readonly string[];
  readonly rollbackEvidenceId: string;
  readonly revalidatedAt: string;
  readonly revalidateAfter: string;
}

export interface MethodRoutingRequest {
  readonly capabilityKey: string;
  readonly scopeKeys: readonly string[];
  readonly conditions: readonly string[];
  readonly availablePrerequisites: readonly string[];
  readonly allowPaid: boolean;
  readonly maxPrivacy: MethodPrivacyClass;
  readonly dataSensitivity: MethodDataSensitivity;
  readonly maxResourceClass: MethodResourceClass;
  readonly allowExperimental: boolean;
  readonly optimization: MethodOptimization;
  readonly now: string;
}

const PRIVACY_RANK: Readonly<Record<MethodPrivacyClass, number>> = Object.freeze({ local: 0, private_remote: 1, remote: 2 });
const SENSITIVITY_RANK: Readonly<Record<MethodDataSensitivity, number>> = Object.freeze({ internal: 0, sensitive: 1, protected: 2, secret: 3 });
const RESOURCE_RANK: Readonly<Record<MethodResourceClass, number>> = Object.freeze({ low: 0, medium: 1, high: 2 });

function assertUniqueNonBlank(values: readonly string[], label: string, requireOne = false): void {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => !value)) throw new Error(`${label} cannot contain blank values`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique`);
}

function assertScore(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`);
}

function parseTime(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}: ${value}`);
  return parsed;
}

function assertEvidenceIds(values: readonly string[], label: string, requireOne = false): void {
  assertUniqueNonBlank(values, label, requireOne);
  for (const id of values) assertIdentifierKind(id, "evidence");
}

export function validateCapabilityMethodContract(method: CapabilityMethodContract): void {
  assertIdentifierKind(method.key, "method");
  if (!method.capabilityKey.startsWith("capability:") || !method.capabilityKey.slice("capability:".length).trim()) throw new Error("Method capabilityKey must identify an existing capability contract");
  if (!method.implementationVersionRef.trim()) throw new Error("Method implementationVersionRef is required");
  assertUniqueNonBlank(method.applicabilityScopeKeys, `${method.key}.applicabilityScopeKeys`, true);
  assertUniqueNonBlank(method.contraindications, `${method.key}.contraindications`);
  assertUniqueNonBlank(method.prerequisites, `${method.key}.prerequisites`);
  assertScore(method.qualityScore, `${method.key}.qualityScore`);
  assertScore(method.calibrationScore, `${method.key}.calibrationScore`);
  assertScore(method.securityAssurance, `${method.key}.securityAssurance`);
  assertScore(method.reliabilityScore, `${method.key}.reliabilityScore`);
  if (!Number.isSafeInteger(method.latencyMs) || method.latencyMs < 0) throw new Error(`${method.key}.latencyMs must be a non-negative safe integer`);
  assertEvidenceIds(method.benchmarkEvidenceIds, `${method.key}.benchmarkEvidenceIds`, true);
  assertEvidenceIds(method.outcomeEvidenceIds, `${method.key}.outcomeEvidenceIds`, method.lifecycle === "active");
  assertEvidenceIds(method.provenanceEvidenceIds, `${method.key}.provenanceEvidenceIds`, true);
  assertIdentifierKind(method.rollbackEvidenceId, "evidence");
  assertUniqueNonBlank(method.fallbackMethodIds, `${method.key}.fallbackMethodIds`);
  for (const fallbackId of method.fallbackMethodIds) {
    assertIdentifierKind(fallbackId, "method");
    if (fallbackId === method.key) throw new Error("A method cannot fall back to itself");
  }
  const revalidatedAt = parseTime(method.revalidatedAt, `${method.key}.revalidatedAt`);
  const revalidateAfter = parseTime(method.revalidateAfter, `${method.key}.revalidateAfter`);
  if (revalidateAfter <= revalidatedAt) throw new Error("Method revalidation window must advance");
  if ((method.lifecycle === "deprecated" || method.lifecycle === "retired") && method.enabled) throw new Error("Deprecated or retired methods cannot remain enabled");
}

function frozenMethod(method: CapabilityMethodContract): CapabilityMethodContract {
  return Object.freeze({
    ...method,
    applicabilityScopeKeys: Object.freeze([...method.applicabilityScopeKeys]),
    contraindications: Object.freeze([...method.contraindications]),
    prerequisites: Object.freeze([...method.prerequisites]),
    benchmarkEvidenceIds: Object.freeze([...method.benchmarkEvidenceIds]),
    outcomeEvidenceIds: Object.freeze([...method.outcomeEvidenceIds]),
    provenanceEvidenceIds: Object.freeze([...method.provenanceEvidenceIds]),
    fallbackMethodIds: Object.freeze([...method.fallbackMethodIds])
  });
}

function isEligible(method: CapabilityMethodContract, request: MethodRoutingRequest): boolean {
  if (!method.enabled || method.capabilityKey !== request.capabilityKey) return false;
  if (method.lifecycle === "retired" || method.lifecycle === "deprecated") return false;
  if (method.lifecycle === "experimental" && !request.allowExperimental) return false;
  if (method.costClass === "paid" && !request.allowPaid) return false;
  if (PRIVACY_RANK[method.privacyClass] > PRIVACY_RANK[request.maxPrivacy]) return false;
  if (SENSITIVITY_RANK[request.dataSensitivity] > SENSITIVITY_RANK[method.maxDataSensitivity]) return false;
  if (RESOURCE_RANK[method.resourceClass] > RESOURCE_RANK[request.maxResourceClass]) return false;
  if (parseTime(request.now, "routing now") > parseTime(method.revalidateAfter, `${method.key}.revalidateAfter`)) return false;
  if (!method.applicabilityScopeKeys.includes("global") && !method.applicabilityScopeKeys.some((scope) => request.scopeKeys.includes(scope))) return false;
  if (method.contraindications.some((condition) => request.conditions.includes(condition))) return false;
  if (method.prerequisites.some((prerequisite) => !request.availablePrerequisites.includes(prerequisite))) return false;
  return true;
}

function balancedScore(method: CapabilityMethodContract): number {
  const latencyPenalty = Math.min(method.latencyMs / 10000, 1);
  return method.qualityScore * 0.35 + method.calibrationScore * 0.2 + method.reliabilityScore * 0.3 + method.securityAssurance * 0.15 - latencyPenalty * 0.1;
}

function compareMethods(a: CapabilityMethodContract, b: CapabilityMethodContract, optimization: MethodOptimization): number {
  if (optimization === "quality") return b.qualityScore - a.qualityScore || b.calibrationScore - a.calibrationScore || b.reliabilityScore - a.reliabilityScore || a.latencyMs - b.latencyMs || a.key.localeCompare(b.key);
  if (optimization === "latency") return a.latencyMs - b.latencyMs || b.reliabilityScore - a.reliabilityScore || b.qualityScore - a.qualityScore || a.key.localeCompare(b.key);
  if (optimization === "reliability") return b.reliabilityScore - a.reliabilityScore || b.calibrationScore - a.calibrationScore || b.qualityScore - a.qualityScore || a.key.localeCompare(b.key);
  return balancedScore(b) - balancedScore(a) || a.key.localeCompare(b.key);
}

export class CapabilityMethodPortfolio {
  readonly #registry = new Registry<CapabilityMethodContract>();

  register(method: CapabilityMethodContract): void {
    validateCapabilityMethodContract(method);
    this.#registry.register(frozenMethod(method));
  }

  replace(method: CapabilityMethodContract, expectedVersion: number): void {
    validateCapabilityMethodContract(method);
    this.#registry.replace(frozenMethod(method), expectedVersion);
  }

  get(methodId: string): CapabilityMethodContract | undefined { return this.#registry.get(methodId); }
  list(): readonly CapabilityMethodContract[] { return this.#registry.list(); }

  methodsFor(capabilityKey: string): readonly CapabilityMethodContract[] {
    return Object.freeze(this.#registry.list().filter((method) => method.capabilityKey === capabilityKey));
  }

  route(request: MethodRoutingRequest): CapabilityMethodContract | undefined {
    const eligible = this.methodsFor(request.capabilityKey).filter((method) => isEligible(method, request));
    eligible.sort((a, b) => compareMethods(a, b, request.optimization));
    return eligible[0];
  }

  fallbackFor(methodId: string, request: MethodRoutingRequest): CapabilityMethodContract | undefined {
    const current = this.#registry.get(methodId);
    if (!current) throw new Error(`Unknown method: ${methodId}`);
    const eligible = current.fallbackMethodIds
      .map((id) => this.#registry.get(id))
      .filter((method): method is CapabilityMethodContract => method !== undefined && isEligible(method, request));
    eligible.sort((a, b) => compareMethods(a, b, request.optimization));
    return eligible[0];
  }
}
