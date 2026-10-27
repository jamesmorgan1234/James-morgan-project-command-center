import type { EnvironmentName } from "../kernel/config.js";
import type { ProtectedIntent } from "./intent.js";
import { createIntentBinding } from "./intent.js";
import type { PolicyRule } from "./policy.js";
import { PolicyEngine } from "./policy.js";
import type { ProtectedActionRequest } from "./protected-gate.js";
import { ProtectedActionGate } from "./protected-gate.js";
import type { AssuranceLevel, RiskClass } from "./types.js";

export const PROTECTED_ACTION_CLASSES = [
  "money",
  "purchase",
  "publishing",
  "send",
  "merge_deploy",
  "destructive",
  "security",
  "credential",
  "legal",
  "protected_asset"
] as const;
export type ProtectedActionClass = (typeof PROTECTED_ACTION_CLASSES)[number];

export interface ProtectedActionDefinition {
  readonly action: string;
  readonly actionClass: ProtectedActionClass;
  readonly riskClass: Exclude<RiskClass, "low" | "medium">;
  readonly requiredScopes: readonly string[];
  readonly minimumAssurance: Extract<AssuranceLevel, "passkey_uv" | "fresh_passkey_uv">;
  readonly freshVerificationMaxAgeMs: number;
  readonly policyEpoch?: number;
}

export interface ProtectedSideEffectRequest<T> {
  readonly action: string;
  readonly sessionId: string;
  readonly resourceOwnerId: string;
  readonly resourceProjectId?: string;
  readonly resourceCompanyId?: string;
  readonly resourceAccountId?: string;
  readonly resourceEnvironment?: EnvironmentName;
  readonly now: string;
  readonly intent: ProtectedIntent;
  readonly authorizationIntentBinding: string;
  readonly expectedPolicyEpoch?: number;
  readonly effect: () => T;
}

function validateDefinition(definition: ProtectedActionDefinition): void {
  if (!definition.action.trim()) throw new Error("Protected action key is required");
  if (!PROTECTED_ACTION_CLASSES.includes(definition.actionClass)) throw new Error("Unknown protected action class");
  if (!Number.isSafeInteger(definition.freshVerificationMaxAgeMs) || definition.freshVerificationMaxAgeMs <= 0) {
    throw new Error("Protected actions require a positive fresh-verification window");
  }
  if (new Set(definition.requiredScopes).size !== definition.requiredScopes.length) throw new Error("Protected action scopes must be unique");
  if (definition.requiredScopes.some((scope) => !scope.trim())) throw new Error("Protected action scopes cannot be blank");
  if (definition.policyEpoch !== undefined && (!Number.isSafeInteger(definition.policyEpoch) || definition.policyEpoch < 1)) {
    throw new Error("Protected action policyEpoch must be a positive safe integer");
  }
}

export class ProtectedActionCatalog {
  readonly #definitions = new Map<string, ProtectedActionDefinition>();

  register(definition: ProtectedActionDefinition): void {
    validateDefinition(definition);
    if (this.#definitions.has(definition.action)) throw new Error(`Protected action already registered: ${definition.action}`);
    this.#definitions.set(definition.action, Object.freeze({ ...definition, requiredScopes: Object.freeze([...definition.requiredScopes]) }));
  }

  get(action: string): ProtectedActionDefinition | undefined { return this.#definitions.get(action); }

  required(action: string): ProtectedActionDefinition {
    const definition = this.#definitions.get(action);
    if (!definition) throw new Error(`Unregistered protected action: ${action}`);
    return definition;
  }

  installPolicy(policy: PolicyEngine, action: string, version = 1): void {
    if (!Number.isSafeInteger(version) || version < 1) throw new Error("Protected action policy version must be positive");
    const definition = this.required(action);
    const rule: PolicyRule = {
      action: definition.action,
      version,
      enabled: true,
      riskClass: definition.riskClass,
      requiredScopes: definition.requiredScopes,
      minimumAssurance: definition.minimumAssurance,
      freshVerificationMaxAgeMs: definition.freshVerificationMaxAgeMs,
      ownerOnly: true,
      allowProjectWildcard: false,
      ...(definition.policyEpoch !== undefined ? { policyEpoch: definition.policyEpoch } : {})
    };
    policy.register(rule);
  }
}

export class ProtectedActionExecutor {
  constructor(
    private readonly catalog: ProtectedActionCatalog,
    private readonly gate: ProtectedActionGate
  ) {}

  execute<T>(request: ProtectedSideEffectRequest<T>): T {
    const definition = this.catalog.required(request.action);
    if (request.intent.action !== request.action) throw new Error("Protected side-effect intent action mismatch");
    if (request.intent.ownerId !== request.resourceOwnerId) throw new Error("Protected side-effect intent owner mismatch");
    if (createIntentBinding(request.intent) !== request.authorizationIntentBinding) throw new Error("Protected side-effect authorization binding mismatch");

    const gateRequest: ProtectedActionRequest = {
      sessionId: request.sessionId,
      action: definition.action,
      resourceOwnerId: request.resourceOwnerId,
      ...(request.resourceProjectId !== undefined ? { resourceProjectId: request.resourceProjectId } : {}),
      ...(request.resourceCompanyId !== undefined ? { resourceCompanyId: request.resourceCompanyId } : {}),
      ...(request.resourceAccountId !== undefined ? { resourceAccountId: request.resourceAccountId } : {}),
      ...(request.resourceEnvironment !== undefined ? { resourceEnvironment: request.resourceEnvironment } : {}),
      now: request.now,
      intent: request.intent,
      authorizationIntentBinding: request.authorizationIntentBinding,
      ...(request.expectedPolicyEpoch !== undefined ? { expectedPolicyEpoch: request.expectedPolicyEpoch } : {})
    };
    this.gate.authorize(gateRequest);
    return request.effect();
  }
}
