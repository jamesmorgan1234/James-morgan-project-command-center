import { AuthSessionStore } from "./auth.js";
import { PolicyEngine, type PolicyDecision } from "./policy.js";
import type { SecuritySubject } from "./types.js";

export interface ProtectedActionRequest {
  readonly sessionId: string;
  readonly action: string;
  readonly resourceOwnerId: string;
  readonly resourceProjectId?: string;
  readonly now: string;
}

export class ProtectedActionGate {
  constructor(private readonly sessions: AuthSessionStore, private readonly policies: PolicyEngine) {}

  authorize(request: ProtectedActionRequest): PolicyDecision {
    const session = this.sessions.validateLive(request.sessionId, request.now);
    const subject: SecuritySubject = {
      ownerId: session.ownerId,
      sessionId: session.id,
      ...(session.deviceId ? { deviceId: session.deviceId } : {}),
      ...(session.projectId ? { projectId: session.projectId } : {}),
      assurance: session.assurance,
      scopes: session.scopes,
      ...(session.lastVerifiedAt ? { lastVerifiedAt: session.lastVerifiedAt } : {})
    };
    return this.policies.assertAllowed({
      action: request.action,
      subject,
      resourceOwnerId: request.resourceOwnerId,
      ...(request.resourceProjectId ? { resourceProjectId: request.resourceProjectId } : {}),
      now: request.now
    });
  }
}
