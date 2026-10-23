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
}

export interface PolicyRequest {
  readonly action: string;
  readonly subject: SecuritySubject;
  readonly resourceOwnerId: string;
  readonly resourceProjectId?: string;
  readonly now: string;
}

export interface PolicyDecision {
  readonly allowed: boolean;
  readonly action: string;
  readonly riskClass: RiskClass;
  readonly reason: string;
  readonly ruleVersion?: number;
}

export class PolicyEngine {
  readonly #rules = new Map<string, PolicyRule>();

  register(rule: PolicyRule): void {
    if (!rule.action.trim()) throw new Error("Policy action is required");
    if (!Number.isSafeInteger(rule.version) || rule.version < 1) throw new Error("Policy version must be a positive safe integer");
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
    const rule = this.#rules.get(request.action);
    if (!rule || !rule.enabled) return Object.freeze({ allowed: false, action: request.action, riskClass: "critical", reason: "default_deny_no_enabled_rule" });
    if (rule.ownerOnly && request.subject.ownerId !== request.resourceOwnerId) return this.#deny(rule, "owner_mismatch");
    for (const scope of rule.requiredScopes) if (!request.subject.scopes.includes(scope)) return this.#deny(rule, `missing_scope:${scope}`);
    if (!assuranceAtLeast(request.subject.assurance, rule.minimumAssurance)) return this.#deny(rule, "insufficient_assurance");
    if (request.resourceProjectId) {
      const direct = request.subject.projectId === request.resourceProjectId;
      const wildcard = rule.allowProjectWildcard && request.subject.scopes.includes("project:*");
      if (!direct && !wildcard) return this.#deny(rule, "project_scope_mismatch");
    }
    if (rule.freshVerificationMaxAgeMs !== undefined) {
      if (!request.subject.lastVerifiedAt) return this.#deny(rule, "fresh_verification_required");
      const age = parseTimestamp(request.now, "now") - parseTimestamp(request.subject.lastVerifiedAt, "lastVerifiedAt");
      if (age < 0 || age > rule.freshVerificationMaxAgeMs) return this.#deny(rule, "fresh_verification_expired");
    }
    return Object.freeze({ allowed: true, action: rule.action, riskClass: rule.riskClass, reason: "allowed", ruleVersion: rule.version });
  }

  assertAllowed(request: PolicyRequest): PolicyDecision {
    const decision = this.evaluate(request);
    if (!decision.allowed) throw new Error(`Policy denied ${request.action}: ${decision.reason}`);
    return decision;
  }

  #deny(rule: PolicyRule, reason: string): PolicyDecision {
    return Object.freeze({ allowed: false, action: rule.action, riskClass: rule.riskClass, reason, ruleVersion: rule.version });
  }
}
