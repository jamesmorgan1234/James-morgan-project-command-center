import type { AdmissionPolicy } from "../kernel/admission.js";
import { validateAdmissionPolicy } from "../kernel/admission.js";
import type { EnvironmentName } from "../kernel/config.js";
import { parseTimestamp } from "../security/types.js";

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

export interface DelegationScope {
  readonly ownerId: string;
  readonly companyId?: string;
  readonly projectId: string;
  readonly accountId?: string;
  readonly environment: EnvironmentName;
}

export interface DelegatedAuthorityEnvelope extends DelegationEnvelope {
  readonly controllingOrchestrator: "command-center";
  readonly parentSubjectId: string;
  readonly childSubjectId: string;
  readonly parentScope: DelegationScope;
  readonly childScope: DelegationScope;
  readonly parentAdmission: AdmissionPolicy;
  readonly childAdmission: AdmissionPolicy;
  readonly parentResourceLimits: Readonly<Record<string, number>>;
  readonly childResourceLimits: Readonly<Record<string, number>>;
  readonly policyVersion: string;
  readonly currentPolicyVersion: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly revoked: boolean;
  readonly evidenceRefs: readonly string[];
}

function equalScope(left: DelegationScope, right: DelegationScope): boolean {
  return left.ownerId === right.ownerId && left.companyId === right.companyId && left.projectId === right.projectId && left.accountId === right.accountId && left.environment === right.environment;
}

function validateResourceLimits(limits: Readonly<Record<string, number>>, label: string): void {
  for (const [key, value] of Object.entries(limits)) {
    if (!key.trim()) throw new Error(`${label} resource key is required`);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} resource limit must be a non-negative safe integer: ${key}`);
  }
}

export function validateDelegatedAuthority(envelope: DelegatedAuthorityEnvelope, maxDepth: number, currentFanOut: number, maxFanOut: number, now: string): void {
  validateDelegation(envelope, maxDepth, currentFanOut, maxFanOut);
  if (envelope.controllingOrchestrator !== "command-center") throw new Error("Command Center must remain the controlling orchestrator for every delegation");
  if (!envelope.parentSubjectId.trim() || !envelope.childSubjectId.trim() || envelope.parentSubjectId === envelope.childSubjectId) throw new Error("Delegation requires distinct bound parent/child subject identities");
  if (!envelope.parentScope.ownerId.trim() || !envelope.parentScope.projectId.trim() || !equalScope(envelope.parentScope, envelope.childScope)) throw new Error("Delegation immutable scope mismatch");
  validateAdmissionPolicy(envelope.parentAdmission);
  validateAdmissionPolicy(envelope.childAdmission);
  if (envelope.childAdmission.monetaryBudgetCents > envelope.parentAdmission.monetaryBudgetCents) throw new Error("Delegation monetary budget amplification blocked");
  if (envelope.childAdmission.maxConcurrent > envelope.parentAdmission.maxConcurrent) throw new Error("Delegation concurrency amplification blocked");
  if (envelope.childAdmission.maxQueueDepth > envelope.parentAdmission.maxQueueDepth) throw new Error("Delegation queue-depth amplification blocked");
  if (envelope.childAdmission.maxRetries > envelope.parentAdmission.maxRetries) throw new Error("Delegation retry amplification blocked");
  if (envelope.childAdmission.maxRuntimeMs > envelope.parentAdmission.maxRuntimeMs) throw new Error("Delegation runtime amplification blocked");
  validateResourceLimits(envelope.parentResourceLimits, "Parent");
  validateResourceLimits(envelope.childResourceLimits, "Child");
  for (const [key, childLimit] of Object.entries(envelope.childResourceLimits)) {
    const parentLimit = envelope.parentResourceLimits[key];
    if (parentLimit === undefined || childLimit > parentLimit) throw new Error(`Delegation resource amplification blocked: ${key}`);
  }
  if (!envelope.policyVersion.trim() || envelope.policyVersion !== envelope.currentPolicyVersion) throw new Error("Delegation policy version is stale");
  if (envelope.revoked) throw new Error("Delegation has been revoked");
  const nowMs = parseTimestamp(now, "now");
  const issuedMs = parseTimestamp(envelope.issuedAt, "delegation.issuedAt");
  const expiresMs = parseTimestamp(envelope.expiresAt, "delegation.expiresAt");
  if (issuedMs > nowMs + 30000) throw new Error("Delegation issue time is in the future");
  if (expiresMs <= issuedMs || nowMs >= expiresMs) throw new Error("Delegation is expired");
  if (envelope.evidenceRefs.length === 0 || new Set(envelope.evidenceRefs).size !== envelope.evidenceRefs.length || envelope.evidenceRefs.some((ref) => !ref.trim())) throw new Error("Delegation requires unique evidence references");
}
