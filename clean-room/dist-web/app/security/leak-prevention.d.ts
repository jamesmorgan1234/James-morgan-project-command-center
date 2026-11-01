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
export declare function revokeShareLink(link: ShareLink, revokedAt: string): ShareLink;
export declare function assertShareLinkActive(link: ShareLink, now: string): void;
export declare function assertShareLinkScope(link: ShareLink, allowedScopes: readonly string[]): void;
export interface ShareLinkAccess {
    readonly linkId: string;
    readonly actor: string;
    readonly at: string;
}
export declare function recordShareLinkAccess(link: ShareLink, actor: string, at: string): ShareLinkAccess;
export interface RobotsPolicy {
    readonly directives: readonly string[];
    readonly indexable: boolean;
}
export declare function robotsPolicy(privatePwa: boolean): RobotsPolicy;
export declare function assertNoSearchIndexing(policy: RobotsPolicy): void;
export declare function assertMetadataSafe(metadata: Readonly<Record<string, string>>, forbiddenKeys: readonly string[]): void;
export declare function assertNoSensitiveQuery(url: string): void;
export declare function maskSensitiveIds(text: string): string;
export declare function sanitizeProviderError(payload: Readonly<Record<string, unknown>>, allowedKeys: readonly string[]): Readonly<Record<string, unknown>>;
export type ErrorSurface = "owner" | "diagnostics";
export declare function errorForSurface(detail: string, surface: ErrorSurface): string;
export interface OwnerError {
    readonly code: string;
    readonly hint: string;
    readonly detail: null;
}
export declare function ownerError(code: string, hint: string): OwnerError;
export interface ResidencyPolicy {
    readonly region: string;
    readonly modeled: true;
}
export declare function residencyPolicy(region: string): ResidencyPolicy;
export interface ComplianceModule {
    readonly id: string;
    readonly requirements: readonly string[];
    readonly canAlterCoreRules: boolean;
}
export declare function registerComplianceModule(module: ComplianceModule): void;
export declare function assertNoAiLegalAcceptance(actor: string): void;
export declare function assertTermsAcceptance(actor: string, scope: string): void;
export declare function assertNoAutomatedMfa(automated: boolean): void;
export interface VersionedPolicy {
    readonly name: string;
    readonly version: string;
    readonly effectiveAt: string;
}
export declare function versionPolicy(policy: VersionedPolicy): VersionedPolicy;
export declare function assertPolicyInReleaseImpact(impact: readonly string[]): void;
