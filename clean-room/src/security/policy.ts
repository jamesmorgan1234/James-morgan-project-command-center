import type { EnvironmentName } from "../kernel/config.js";
import { assuranceAtLeast, parseTimestamp, type AssuranceLevel, type RiskClass, type SecuritySubject } from "./types.js";

export interface PolicyRule {
  readonly action: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly riskClass: RiskClass;
  readonly requiredScopes: readonly string[];
  readonly minimumAssurance: AssuranceLevel;
  readonly freshVerificationMaxAgeMs?: number;
  readonly ownerOnly: boolean;
  readonly allowProjectWildcard: boolean;
  readonly policyEpoch?: number;
}

export interface PolicyRequest {
  readonly action: string;
  readonly subject: SecuritySubject;
  readonly resourceOwnerId: string;
  readonly resourceProjectId?: string;
  readonly resourceCompanyId?: string;
  readonly resourceAccountId?: string;
  readonly resourceEnvironment?: EnvironmentName;
  readonly now: string;
  readonly policyAvailable?: boolean;
  readonly revocationStateFresh?: boolean;
  readonly expectedPolicyEpoch?: number;
}

export interface PolicyDecision {
  readonly allowed: boolean;
  readonly action: string;
  readonly riskClass: RiskClass;
  readonly reason: string;
  readonly ruleVersion?: number;
  readonly policyEpoch?: number;
}

export class PolicyEngine {
  readonly #rules = new Map<string, PolicyRule>();

  register(rule: PolicyRule): void {
    if (!rule.action.trim()) throw new Error("Policy action is required");
    if (!Number.isSafeInteger(rule.version) || rule.version < 1) throw new Error("Policy version must be a positive safe integer");
    if (rule.policyEpoch !== undefined && (!Number.isSafeInteger(rule.policyEpoch) || rule.policyEpoch < 1)) throw new Error("policyEpoch must be a positive safe integer");
    if (rule.freshVerificationMaxAgeMs !== undefined && (!Number.isSafeInteger(rule.freshVerificationMaxAgeMs) || rule.freshVerificationMaxAgeMs < 0)) throw new Error("freshVerificationMaxAgeMs must be a non-negative safe integer");
    if (this.#rules.has(rule.action)) throw new Error(`Policy already exists: ${rule.action}`);
    this.#rules.set(rule.action, Object.freeze({ ...rule, requiredScopes: Object.freeze([...rule.requiredScopes]) }));
  }

  replace(rule: PolicyRule, expectedVersion: number): void {
    const current = this.#rules.get(rule.action);
    if (!current) throw new Error(`Unknown policy: ${rule.action}`);
    if (current.version !== expectedVersion) throw new Error(`Policy version conflict for ${rule.action}`);
    if (rule.version <= current.version) throw new Error(`Policy version must advance for ${rule.action}`);
    this.#rules.delete(rule.action);
    try { this.register(rule); } catch (error) { this.#rules.set(current.action, current); throw error; }
  }

  evaluate(request: PolicyRequest): PolicyDecision {
    if (request.policyAvailable === false) return Object.freeze({ allowed: false, action: request.action, riskClass: "critical", reason: "policy_unavailable" });
    if (request.revocationStateFresh === false) return Object.freeze({ allowed: false, action: request.action, riskClass: "critical", reason: "revocation_state_stale" });
    const rule = this.#rules.get(request.action);
    if (!rule || !rule.enabled) return Object.freeze({ allowed: false, action: request.action, riskClass: "critical", reason: "default_deny_no_enabled_rule" });
    if (request.expectedPolicyEpoch !== undefined) {
      if (rule.policyEpoch === undefined || rule.policyEpoch !== request.expectedPolicyEpoch) return this.#deny(rule, "policy_epoch_mismatch");
      if (request.subject.policyEpoch !== undefined && request.subject.policyEpoch !== request.expectedPolicyEpoch) return this.#deny(rule, "subject_policy_epoch_stale");
    }
    if (rule.ownerOnly && request.subject.ownerId !== request.resourceOwnerId) return this.#deny(rule, "owner_mismatch");
    for (const scope of rule.requiredScopes) if (!request.subject.scopes.includes(scope)) return this.#deny(rule, `missing_scope:${scope}`);
    if (!assuranceAtLeast(request.subject.assurance, rule.minimumAssurance)) return this.#deny(rule, "insufficient_assurance");
    if (request.resourceProjectId) {
      const direct = request.subject.projectId === request.resourceProjectId;
      const wildcard = rule.allowProjectWildcard && request.subject.scopes.includes("project:*");
      if (!direct && !wildcard) return this.#deny(rule, "project_scope_mismatch");
    }
    if (request.resourceCompanyId) {
      const direct = request.subject.companyId === request.resourceCompanyId;
      const wildcard = request.subject.scopes.includes("company:*");
      if (!direct && !wildcard) return this.#deny(rule, "company_scope_mismatch");
    }
    if (request.resourceAccountId) {
      const direct = request.subject.accountId === request.resourceAccountId;
      const wildcard = request.subject.scopes.includes("account:*");
      if (!direct && !wildcard) return this.#deny(rule, "account_scope_mismatch");
    }
    if (request.resourceEnvironment && request.subject.environment !== request.resourceEnvironment) return this.#deny(rule, "environment_scope_mismatch");
    if (rule.freshVerificationMaxAgeMs !== undefined) {
      if (!request.subject.lastVerifiedAt) return this.#deny(rule, "fresh_verification_required");
      const age = parseTimestamp(request.now, "now") - parseTimestamp(request.subject.lastVerifiedAt, "lastVerifiedAt");
      if (age < 0 || age > rule.freshVerificationMaxAgeMs) return this.#deny(rule, "fresh_verification_expired");
    }
    return Object.freeze({ allowed: true, action: rule.action, riskClass: rule.riskClass, reason: "allowed", ruleVersion: rule.version, ...(rule.policyEpoch !== undefined ? { policyEpoch: rule.policyEpoch } : {}) });
  }

  failClosed(action: string, reason: string): PolicyDecision {
    if (!action.trim() || !reason.trim()) throw new Error("Fail-closed policy action and reason are required");
    const rule = this.#rules.get(action);
    if (!rule || !rule.enabled) return Object.freeze({ allowed: false, action, riskClass: "critical", reason });
    return this.#deny(rule, reason);
  }

  assertAllowed(request: PolicyRequest): PolicyDecision {
    const decision = this.evaluate(request);
    if (!decision.allowed) throw new Error(`Policy denied ${request.action}: ${decision.reason}`);
    return decision;
  }

  #deny(rule: PolicyRule, reason: string): PolicyDecision {
    return Object.freeze({ allowed: false, action: rule.action, riskClass: rule.riskClass, reason, ruleVersion: rule.version, ...(rule.policyEpoch !== undefined ? { policyEpoch: rule.policyEpoch } : {}) });
  }
}
