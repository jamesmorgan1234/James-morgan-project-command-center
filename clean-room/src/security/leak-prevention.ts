/**
 * Leakage prevention and compliance boundaries.
 *
 * Share-link revocation, scope and access logging; no search indexing, safe
 * metadata, no sensitive values in URLs, masked identifiers in screenshots;
 * sanitized provider errors, diagnostics-only detail and safe owner errors;
 * modeled residency; compliance modules that cannot alter core rules; no AI
 * legal acceptance, no unauthorized terms acceptance, no automated MFA; and
 * versioned policies included in release impact analysis.
 */

export interface ShareLink {
  readonly id: string;
  readonly scope: string;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
}

export function revokeShareLink(link: ShareLink, revokedAt: string): ShareLink {
  if (Number.isNaN(Date.parse(revokedAt))) throw new Error("Revocation requires a valid timestamp");
  return Object.freeze({ ...link, revokedAt });
}

export function assertShareLinkActive(link: ShareLink, now: string): void {
  if (Number.isNaN(Date.parse(now))) throw new Error("Share-link check requires a valid timestamp");
  if (link.revokedAt !== null) throw new Error("Share link has been revoked");
  if (!link.scope.trim()) throw new Error("Share link requires a scope");
  if (Date.parse(now) >= Date.parse(link.expiresAt)) throw new Error("Share link has expired");
}

export function assertShareLinkScope(link: ShareLink, allowedScopes: readonly string[]): void {
  if (!allowedScopes.includes(link.scope)) throw new Error(`Share link scope is not permitted: ${link.scope}`);
}

export interface ShareLinkAccess {
  readonly linkId: string;
  readonly actor: string;
  readonly at: string;
}

export function recordShareLinkAccess(link: ShareLink, actor: string, at: string): ShareLinkAccess {
  if (!link.id.trim() || !actor.trim()) throw new Error("Share-link access requires link and actor");
  if (Number.isNaN(Date.parse(at))) throw new Error("Share-link access requires a valid timestamp");
  return Object.freeze({ linkId: link.id, actor, at });
}

export interface RobotsPolicy {
  readonly directives: readonly string[];
  readonly indexable: boolean;
}

export function robotsPolicy(privatePwa: boolean): RobotsPolicy {
  return privatePwa
    ? Object.freeze({ directives: Object.freeze(["noindex", "nofollow"]), indexable: false })
    : Object.freeze({ directives: Object.freeze([]), indexable: true });
}

export function assertNoSearchIndexing(policy: RobotsPolicy): void {
  if (policy.indexable) throw new Error("A private PWA must not be indexable");
}

export function assertMetadataSafe(metadata: Readonly<Record<string, string>>, forbiddenKeys: readonly string[]): void {
  const leaked = forbiddenKeys.filter((key) => (metadata[key] ?? "").trim().length > 0);
  if (leaked.length > 0) throw new Error(`Public metadata must not carry project data: ${leaked.join(", ")}`);
}

const SENSITIVE_QUERY = /(?:^|&)(?:token|api_?key|secret|password|ssn|card)(?:=|&|$)/i;

export function assertNoSensitiveQuery(url: string): void {
  const query = url.split("?")[1] ?? "";
  if (SENSITIVE_QUERY.test(query)) throw new Error("Sensitive values must not appear in URLs or query strings");
}

export function maskSensitiveIds(text: string): string {
  return text
    .replace(/\b[0-9a-f]{16,}\b/gi, "[masked]")
    .replace(/\b\d{9,}\b/g, "[masked]");
}

export function sanitizeProviderError(payload: Readonly<Record<string, unknown>>, allowedKeys: readonly string[]): Readonly<Record<string, unknown>> {
  const sanitized: Record<string, unknown> = {};
  for (const key of allowedKeys) if (key in payload) sanitized[key] = payload[key];
  return Object.freeze(sanitized);
}

export type ErrorSurface = "owner" | "diagnostics";

export function errorForSurface(detail: string, surface: ErrorSurface): string {
  if (!detail.trim()) throw new Error("An error requires detail");
  return surface === "diagnostics" ? detail : "Something went wrong. The details are in diagnostics.";
}

export interface OwnerError {
  readonly code: string;
  readonly hint: string;
  readonly detail: null;
}

export function ownerError(code: string, hint: string): OwnerError {
  if (!code.trim() || !hint.trim()) throw new Error("An owner-facing error requires a code and a hint");
  return Object.freeze({ code, hint, detail: null });
}

export interface ResidencyPolicy {
  readonly region: string;
  readonly modeled: true;
}

export function residencyPolicy(region: string): ResidencyPolicy {
  if (!region.trim()) throw new Error("A residency policy requires a region");
  return Object.freeze({ region, modeled: true as const });
}

export interface ComplianceModule {
  readonly id: string;
  readonly requirements: readonly string[];
  readonly canAlterCoreRules: boolean;
}

export function registerComplianceModule(module: ComplianceModule): void {
  if (!module.id.trim() || module.requirements.length === 0) throw new Error("A compliance module requires an id and requirements");
  if (module.canAlterCoreRules) throw new Error("Compliance modules cannot alter core owner rules");
}

export function assertNoAiLegalAcceptance(actor: string): void {
  if (actor === "ai" || actor === "agent") throw new Error("AI cannot accept legal terms");
}

export function assertTermsAcceptance(actor: string, scope: string): void {
  if (!actor.trim()) throw new Error("Terms acceptance requires an actor");
  if ((actor === "agent" || actor === "ai") && scope !== "terms:accept") throw new Error("Agent terms acceptance requires exact authorization");
}

export function assertNoAutomatedMfa(automated: boolean): void {
  if (automated) throw new Error("MFA responses cannot be automated");
}

export interface VersionedPolicy {
  readonly name: string;
  readonly version: string;
  readonly effectiveAt: string;
}

export function versionPolicy(policy: VersionedPolicy): VersionedPolicy {
  if (!policy.name.trim() || !policy.version.trim()) throw new Error("A policy requires a name and version");
  if (Number.isNaN(Date.parse(policy.effectiveAt))) throw new Error("A policy requires a valid effective date");
  return Object.freeze({ ...policy });
}

export function assertPolicyInReleaseImpact(impact: readonly string[]): void {
  for (const required of ["privacy", "security"]) if (!impact.includes(required)) throw new Error(`Release impact analysis must include ${required}`);
}
