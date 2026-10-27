import type { AuthSessionStore } from "../security/auth.js";
import { parseTimestamp } from "../security/types.js";
import { assertSecretChannelSafe } from "../security/secret-channels.js";
import { evaluateFinancialDataAccess, assertFinancialWriteIsolation, type FinancialDataAccessRequest } from "./isolation.js";
/** Trusted server capability; never accept it from a client, Brain, or provider. */
export interface FinancialSessionCapability {
 readonly sessionId: string; readonly ownerId: string; readonly scopeId: string;
 readonly companyId?: string; readonly projectId?: string;
 readonly dataClasses: readonly string[]; readonly canWrite: boolean;
 readonly verifiedAt: string; readonly expiresAt: string;
}
export interface FinancialResourceScope {
 readonly ownerId: string; readonly scopeId: string; readonly companyId?: string; readonly projectId?: string;
}
/** Trusted server composition only. Pure finance models are not authorization entry points. */
export class FinancialAccessBoundary {
 constructor(readonly sessions: AuthSessionStore,
  readonly lookup: (sessionId: string, scopeId: string) => FinancialSessionCapability | undefined,
  readonly contained: (ownerId: string, scopeId: string) => boolean) {}
 authorize(sessionId: string, resource: FinancialResourceScope, now: string, request: Omit<FinancialDataAccessRequest, "allowedDataClasses">, write = false) {
  const session = this.sessions.validateLive(sessionId, now);
  const capability = this.lookup(sessionId, resource.scopeId);
  if (!capability || capability.sessionId !== session.id || capability.ownerId !== session.ownerId || capability.ownerId !== resource.ownerId || capability.scopeId !== resource.scopeId) throw new Error("Finance server capability missing or scope mismatch");
  if (!resource.ownerId.trim() || !resource.scopeId.trim()) throw new Error("Finance resource scope is required");
  if (capability.companyId !== resource.companyId || capability.projectId !== resource.projectId || session.companyId !== resource.companyId || session.projectId !== resource.projectId) throw new Error("Finance company/project/personal scope mismatch");
  const at = parseTimestamp(now, "now"), verified = parseTimestamp(capability.verifiedAt, "finance verification");
  if (verified > at || at - verified >= 300_000 || parseTimestamp(capability.expiresAt, "finance expiry") <= at || !session.lastVerifiedAt || parseTimestamp(session.lastVerifiedAt, "session verification") < verified) throw new Error("Finance capability verification stale or expired");
  if (this.contained(resource.ownerId, resource.scopeId)) throw new Error("Finance scope is contained");
  const envelope = {ownerId: session.ownerId, subjectOwnerId: resource.ownerId, assurance: session.assurance, scopes: session.scopes, contextDomain: "finance", ...(session.companyId ? {companyId: session.companyId} : {}), ...(resource.companyId ? {resourceCompanyId: resource.companyId} : {})};
  if (write) {
   if (!capability.canWrite) throw new Error("Finance capability is read-only");
   assertFinancialWriteIsolation(envelope);
  }
  assertSecretChannelSafe("brain_memory", {dataClasses: request.requestedDataClasses, auditRef: request.auditRef});
  return evaluateFinancialDataAccess(envelope, {...request, allowedDataClasses: capability.dataClasses});
 }
}
