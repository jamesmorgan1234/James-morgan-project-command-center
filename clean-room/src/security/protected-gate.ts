import type { EnvironmentName } from "../kernel/config.js";
import { AuthSessionStore } from "./auth.js";
import { DeviceRegistry } from "./devices.js";
import { assertIntentBinding, type ProtectedIntent } from "./intent.js";
import { PolicyDecisionAuditLedger } from "./policy-audit.js";
import { PolicyEngine, type PolicyDecision, type PolicyRequest } from "./policy.js";
import type { SecuritySubject } from "./types.js";

export interface ProtectedActionRequest {
  readonly sessionId: string;
  readonly action: string;
  readonly resourceOwnerId: string;
  readonly resourceProjectId?: string;
  readonly resourceCompanyId?: string;
  readonly resourceAccountId?: string;
  readonly resourceEnvironment?: EnvironmentName;
  readonly now: string;
  readonly policyAvailable?: boolean;
  readonly revocationStateFresh?: boolean;
  readonly expectedPolicyEpoch?: number;
  readonly intent?: ProtectedIntent;
  readonly authorizationIntentBinding?: string;
}

export class ProtectedActionGate {
  constructor(
    private readonly sessions: AuthSessionStore,
    private readonly policies: PolicyEngine,
    private readonly devices: DeviceRegistry,
    private readonly decisions: PolicyDecisionAuditLedger = new PolicyDecisionAuditLedger()
  ) {}

  authorize(request: ProtectedActionRequest): PolicyDecision {
    const session = this.sessions.validateLive(request.sessionId, request.now);
    if (session.deviceId) this.devices.assertUsable(session.deviceId, session.ownerId);
    if ((request.intent === undefined) !== (request.authorizationIntentBinding === undefined)) throw new Error("Protected intent and authorization binding must be supplied together");
    if (request.intent && request.authorizationIntentBinding) {
      if (request.intent.action !== request.action || request.intent.ownerId !== request.resourceOwnerId) throw new Error("Protected intent action/owner mismatch");
      if (request.resourceProjectId && request.intent.scope.projectId !== request.resourceProjectId) throw new Error("Protected intent project mismatch");
      if (request.resourceCompanyId && request.intent.scope.companyId !== request.resourceCompanyId) throw new Error("Protected intent company mismatch");
      if (request.resourceAccountId && request.intent.scope.accountId !== request.resourceAccountId) throw new Error("Protected intent account mismatch");
      if (request.resourceEnvironment && request.intent.scope.environment !== request.resourceEnvironment) throw new Error("Protected intent environment mismatch");
      assertIntentBinding(request.intent, request.authorizationIntentBinding);
    }
    const subject: SecuritySubject = {
      ownerId: session.ownerId,
      sessionId: session.id,
      ...(session.deviceId ? { deviceId: session.deviceId } : {}),
      ...(session.projectId ? { projectId: session.projectId } : {}),
      ...(session.companyId ? { companyId: session.companyId } : {}),
      ...(session.accountId ? { accountId: session.accountId } : {}),
      ...(session.environment ? { environment: session.environment } : {}),
      assurance: session.assurance,
      scopes: session.scopes,
      ...(session.lastVerifiedAt ? { lastVerifiedAt: session.lastVerifiedAt } : {}),
      ...(session.policyEpoch !== undefined ? { policyEpoch: session.policyEpoch } : {})
    };
    const policyRequest: PolicyRequest = {
      action: request.action,
      subject,
      resourceOwnerId: request.resourceOwnerId,
      ...(request.resourceProjectId ? { resourceProjectId: request.resourceProjectId } : {}),
      ...(request.resourceCompanyId ? { resourceCompanyId: request.resourceCompanyId } : {}),
      ...(request.resourceAccountId ? { resourceAccountId: request.resourceAccountId } : {}),
      ...(request.resourceEnvironment ? { resourceEnvironment: request.resourceEnvironment } : {}),
      now: request.now,
      ...(request.policyAvailable !== undefined ? { policyAvailable: request.policyAvailable } : {}),
      ...(request.revocationStateFresh !== undefined ? { revocationStateFresh: request.revocationStateFresh } : {}),
      ...(request.expectedPolicyEpoch !== undefined ? { expectedPolicyEpoch: request.expectedPolicyEpoch } : {})
    };
    const decision = this.policies.evaluate(policyRequest);
    this.decisions.append({
      ownerId: session.ownerId,
      sessionId: session.id,
      occurredAt: request.now,
      action: request.action,
      resourceOwnerId: request.resourceOwnerId,
      ...(request.resourceProjectId ? { resourceProjectId: request.resourceProjectId } : {}),
      ...(request.resourceCompanyId ? { resourceCompanyId: request.resourceCompanyId } : {}),
      ...(request.resourceAccountId ? { resourceAccountId: request.resourceAccountId } : {}),
      ...(request.resourceEnvironment ? { resourceEnvironment: request.resourceEnvironment } : {}),
      decision
    });
    if (!decision.allowed) throw new Error(`Policy denied ${request.action}: ${decision.reason}`);
    return decision;
  }
}
