export type ConnectionState = "connected" | "disconnected" | "expired" | "revoked";
export type ProviderHealth = "available" | "degraded" | "unavailable";

export interface SocialConnection {
  readonly accountId: string;
  readonly state: ConnectionState;
  readonly credentialRef: string;
  readonly grantedScopes: readonly string[];
  readonly providerHealth: ProviderHealth;
  readonly verifiedAt: string;
  readonly tokenPresent: boolean;
}

export function connectionIsLive(connection: SocialConnection, requiredScopes: readonly string[]): boolean {
  if (connection.state !== "connected" || connection.providerHealth === "unavailable" || !connection.credentialRef.trim()) return false;
  if (!connection.verifiedAt.includes("T")) return false;
  return requiredScopes.every((scope) => connection.grantedScopes.includes(scope));
}

export function requiredOwnerConnectionAction(connection: SocialConnection): string | null {
  if (connection.state === "revoked") return "Reconnect and explicitly reauthorize the account";
  if (connection.state === "expired") return "Refresh or reconnect the account";
  if (connection.state === "disconnected") return "Connect the intended account";
  if (connection.providerHealth === "unavailable") return "Wait for provider recovery; do not treat token presence as live access";
  return null;
}

export interface SocialConnectionEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly canonicalAccountId: string;
  readonly platformIdentityId: string;
  readonly state: ConnectionState;
  readonly credentialRef?: string | undefined;
  readonly grantedScopes: readonly string[];
  readonly providerHealth: ProviderHealth;
  readonly tokenPresent: boolean;
  readonly verifiedAt: string;
  readonly observedAt: string;
  readonly requiredOwnerActionRef?: string | undefined;
  readonly reconnectRef?: string | undefined;
  readonly evidenceRefs: readonly string[];
}

export interface SocialConnectionAssessment {
  readonly connectionId: string;
  readonly canonicalAccountId: string;
  readonly state: ConnectionState;
  readonly providerHealth: ProviderHealth;
  readonly live: boolean;
  readonly missingScopes: readonly string[];
  readonly ownerActionRequired: boolean;
  readonly ownerActionRef?: string | undefined;
  readonly reconnectRef?: string | undefined;
  readonly credentialRef?: string | undefined;
  readonly secretsExposed: false;
  readonly protectedActionAuthorized: false;
}

function timestamp(value: string, label: string): number { const parsed=Date.parse(value); if(!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`); return parsed; }
function refs(values: readonly string[], label: string, requireOne=true): readonly string[]{if(!Array.isArray(values)||(requireOne&&values.length===0)||values.some(v=>typeof v!=="string"||!v.trim()))throw new Error(`${label} must contain nonblank references`);return Object.freeze([...new Set(values.map(v=>v.trim()))]);}

export function assessSocialConnection(connection: SocialConnectionEvidence, requiredScopes: readonly string[], now: string, maxVerificationAgeMs: number): SocialConnectionAssessment {
  if(!connection.id.trim()||!connection.ownerId.trim()||!connection.canonicalAccountId.trim()||!connection.platformIdentityId.trim()) throw new Error("Social connection identity is required");
  const verifiedAt=timestamp(connection.verifiedAt,"Social connection verifiedAt"), observedAt=timestamp(connection.observedAt,"Social connection observedAt"), nowMs=timestamp(now,"Social connection assessment now");
  if(verifiedAt>observedAt||observedAt>nowMs) throw new Error("Social connection evidence cannot originate in the future");
  if(!Number.isSafeInteger(maxVerificationAgeMs)||maxVerificationAgeMs<0) throw new Error("Social connection verification age policy is invalid");
  refs(connection.evidenceRefs,"Social connection evidence"); const scopes=refs(connection.grantedScopes,"Social connection granted scopes",false); const required=refs(requiredScopes,"Required social scopes",false);
  if(connection.credentialRef!==undefined&&!connection.credentialRef.trim()) throw new Error("Social credential reference cannot be blank");
  const ownerActionRequired=connection.state!=="connected"||connection.providerHealth==="unavailable";
  if(ownerActionRequired&&!connection.requiredOwnerActionRef?.trim()) throw new Error("Non-live social connection requires owner-action evidence");
  if(connection.state!=="connected"&&!connection.reconnectRef?.trim()) throw new Error("Disconnected/expired/revoked social connection requires recoverable reconnect reference");
  const missingScopes=required.filter(scope=>!scopes.includes(scope));
  const verificationFresh=nowMs-verifiedAt<=maxVerificationAgeMs;
  const live=connection.state==="connected"&&connection.providerHealth==="available"&&Boolean(connection.credentialRef?.trim())&&connection.tokenPresent&&verificationFresh&&missingScopes.length===0;
  return Object.freeze({connectionId:connection.id,canonicalAccountId:connection.canonicalAccountId,state:connection.state,providerHealth:connection.providerHealth,live,missingScopes:Object.freeze(missingScopes),ownerActionRequired,ownerActionRef:connection.requiredOwnerActionRef,reconnectRef:connection.reconnectRef,credentialRef:connection.credentialRef,secretsExposed:false as const,protectedActionAuthorized:false as const});
}
