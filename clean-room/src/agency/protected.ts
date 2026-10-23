export interface JobCredentialReference {
  readonly id: string;
  readonly provider: string;
  readonly allowedScopes: readonly string[];
  readonly projectId: string;
}

export interface ProtectedPreflight {
  readonly projectId: string;
  readonly projectLockProjectId: string;
  readonly requestedScopes: readonly string[];
  readonly credential: JobCredentialReference;
  readonly toolHealthy: boolean;
  readonly authorizationFresh: boolean;
  readonly protectedActionAuthorized: boolean;
}

export function assertProtectedPreflight(input: ProtectedPreflight): void {
  if (input.projectId !== input.projectLockProjectId || input.credential.projectId !== input.projectId) throw new Error("Project lock/credential project mismatch");
  if (!input.toolHealthy) throw new Error("Tool/provider health is not sufficient for protected side effect");
  if (!input.authorizationFresh || !input.protectedActionAuthorized) throw new Error("Protected side effect lacks fresh exact authorization");
  for (const scope of input.requestedScopes) if (!input.credential.allowedScopes.includes(scope)) throw new Error(`Credential scope denied: ${scope}`);
}
