/** Tool discovery is open. Authority is checked for the exact action and account. */
export interface BrainToolDescriptor {
  readonly key: string;
  readonly ownerId: string;
  readonly provider: string;
  readonly versionRef: string;
  readonly actionKeys: readonly string[];
  readonly actionEffects: Readonly<Record<string, BrainToolAction["effect"]>>;
  readonly environment: string;
  readonly available: boolean;
  readonly cost: "free" | "paid" | "unknown";
  readonly authenticationRequired: boolean;
  readonly authenticated: boolean;
  readonly projectIds: readonly string[];
  readonly companyIds: readonly string[];
  readonly accountRefs: readonly string[];
  readonly evidenceRef: string;
  readonly verifiedAt: string;
}

export interface BrainToolAction {
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly toolKey: string;
  readonly actionKey: string;
  readonly accountRef?: string;
  readonly resourceProjectId?: string;
  readonly resourceCompanyId?: string;
  readonly effect: "public_read" | "private_read" | "local_write" | "external_write" | "publish" | "deploy" | "financial" | "unknown";
  readonly authority: {
    readonly issuer: "owner" | "command_center";
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly actionKeys: readonly string[];
    readonly accountRefs: readonly string[];
    readonly reference: string;
    readonly expiresAt: string;
    readonly protectedActionAuthorized: boolean;
  };
  readonly now: string;
  readonly maximumHealthAgeMs: number;
}

export interface BrainToolAccessResult {
  readonly toolKey: string;
  readonly actionKey: string;
  readonly allowed: boolean;
  readonly reason: string;
  readonly capabilityExcluded: false;
}

/** New tools are discoverable without editing a fixed company-level allowlist. */
export function discoverBrainTools(catalog: readonly BrainToolDescriptor[]): readonly BrainToolDescriptor[] {
  const keys = new Set<string>();
  return Object.freeze(catalog.map(tool => {
    if (!tool.key.trim() || keys.has(tool.key)) throw new Error("Tool identities must be unique and nonblank");
    keys.add(tool.key);
    return Object.freeze({ ...tool, actionEffects: Object.freeze({...tool.actionEffects}), actionKeys: Object.freeze([...tool.actionKeys]), projectIds: Object.freeze([...tool.projectIds]), companyIds: Object.freeze([...tool.companyIds]), accountRefs: Object.freeze([...tool.accountRefs]) });
  }));
}

/** Authority must be resolved by the canonical security kernel, never taken from model assertions. */
export function authorizeBrainToolAction(catalog: readonly BrainToolDescriptor[], request: BrainToolAction): BrainToolAccessResult {
  const verdict = (allowed: boolean, reason: string): BrainToolAccessResult => Object.freeze({toolKey: request.toolKey, actionKey: request.actionKey, allowed, reason, capabilityExcluded: false});
  const now = Date.parse(request.now);
  if (!Number.isFinite(now) || !Number.isSafeInteger(request.maximumHealthAgeMs) || request.maximumHealthAgeMs < 1) throw new Error("Tool authorization requires a valid clock and health age");
  const matches = catalog.filter(tool => tool.key === request.toolKey);
  if (matches.length !== 1) return verdict(false, "tool_binding_missing_or_ambiguous");
  const tool = matches[0]!;
  const authority = request.authority;
  if (!["owner", "command_center"].includes(authority.issuer) || !authority.reference.trim() || !Number.isFinite(Date.parse(authority.expiresAt)) || Date.parse(authority.expiresAt) <= now) return verdict(false, "current_action_authority_required");
  if (!request.ownerId.trim() || !request.companyId.trim() || !request.projectId.trim() || tool.ownerId !== request.ownerId || authority.ownerId !== request.ownerId || authority.projectId !== request.projectId || authority.companyId !== request.companyId) return verdict(false, "authority_identity_mismatch");
  if (tool.actionEffects[request.actionKey] !== request.effect) return verdict(false, "action_effect_contract_mismatch");
  if (request.effect !== "public_read" && (request.resourceProjectId !== undefined && request.resourceProjectId !== request.projectId || request.resourceCompanyId !== undefined && request.resourceCompanyId !== request.companyId)) return verdict(false, "cross_company_or_project_resource");
  if (!tool.projectIds.includes(request.projectId) || !tool.companyIds.includes(request.companyId)) return verdict(false, "project_tool_binding_required");
  if (!tool.actionKeys.includes(request.actionKey) || !authority.actionKeys.includes(request.actionKey)) return verdict(false, "specific_action_not_authorized");
  if (tool.cost !== "free") return verdict(false, "zero_cost_route_required");
  if (!tool.available) return verdict(false, "tool_runtime_unavailable");
  const age = now - Date.parse(tool.verifiedAt);
  if (!tool.versionRef.trim() || !tool.evidenceRef.trim() || !Number.isFinite(age) || age < 0 || age > request.maximumHealthAgeMs) return verdict(false, "fresh_tool_health_evidence_required");
  if (tool.authenticationRequired && !tool.authenticated) return verdict(false, "tool_authentication_required");
  const protectedAction = ["external_write", "publish", "deploy", "financial", "unknown"].includes(request.effect);
  if (protectedAction && !authority.protectedActionAuthorized) return verdict(false, "specific_protected_action_authority_required");
  if (request.effect !== "public_read" && (!request.accountRef || !tool.accountRefs.includes(request.accountRef) || !authority.accountRefs.includes(request.accountRef))) return verdict(false, "exact_account_binding_required");
  if (request.accountRef !== undefined && (!tool.accountRefs.includes(request.accountRef) || !authority.accountRefs.includes(request.accountRef))) return verdict(false, "exact_account_binding_required");
  return verdict(true, "authorized_exact_action");
}
