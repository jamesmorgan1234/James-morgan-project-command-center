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
