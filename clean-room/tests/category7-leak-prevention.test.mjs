import test from "node:test";
import assert from "node:assert/strict";
import {
  revokeShareLink,
  assertShareLinkActive,
  assertShareLinkScope,
  recordShareLinkAccess,
  robotsPolicy,
  assertNoSearchIndexing,
  assertMetadataSafe,
  assertNoSensitiveQuery,
  maskSensitiveIds,
  sanitizeProviderError,
  errorForSurface,
  ownerError,
  residencyPolicy,
  registerComplianceModule,
  assertNoAiLegalAcceptance,
  assertTermsAcceptance,
  assertNoAutomatedMfa,
  versionPolicy,
  assertPolicyInReleaseImpact
} from "../dist/security/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const T1 = "2026-11-30T10:00:00.000Z";
const link = { id: "link-1", scope: "read:summary", expiresAt: T1, revokedAt: null };

test("P7.2 share-link revocation", () => {
  const revoked = revokeShareLink(link, T0);
  assert.equal(revoked.revokedAt, T0);
  assert.throws(() => assertShareLinkActive(revoked, T0), /revoked/);
});

test("P7.2 share-link scope", () => {
  assert.doesNotThrow(() => assertShareLinkScope(link, ["read:summary"]));
  assert.throws(() => assertShareLinkScope(link, ["read:bank"]), /scope is not permitted/);
});

test("P7.2 share-link access logging", () => {
  const access = recordShareLinkAccess(link, "visitor-9", T0);
  assert.deepEqual(access, { linkId: "link-1", actor: "visitor-9", at: T0 });
  assert.throws(() => recordShareLinkAccess(link, " ", T0), /requires link and actor/);
});

test("P7.2 no accidental indexing by search engines", () => {
  const policy = robotsPolicy(true);
  assert.equal(policy.indexable, false);
  assert.doesNotThrow(() => assertNoSearchIndexing(policy));
  assert.throws(() => assertNoSearchIndexing(robotsPolicy(false)), /must not be indexable/);
});

test("P7.2 private PWA robots and noindex stance", () => {
  assert.deepEqual([...robotsPolicy(true).directives], ["noindex", "nofollow"]);
});

test("P7.2 no project data in page metadata visible publicly", () => {
  assert.doesNotThrow(() => assertMetadataSafe({ title: "Command Center" }, ["projectName", "client"]));
  assert.throws(() => assertMetadataSafe({ projectName: "Acme" }, ["projectName"]), /must not carry project data/);
});

test("P7.2 no sensitive data in URLs or query strings", () => {
  assert.doesNotThrow(() => assertNoSensitiveQuery("/projects/1?tab=summary"));
  assert.throws(() => assertNoSensitiveQuery("/callback?token=abc"), /must not appear in URLs/);
});

test("P7.2 no sensitive IDs in screenshots where avoidable", () => {
  assert.equal(maskSensitiveIds("id 0123456789abcdef ok"), "id [masked] ok");
  assert.equal(maskSensitiveIds("account 123456789012"), "account [masked]");
});

test("P7.2 third-party error payloads are sanitized", () => {
  const sanitized = sanitizeProviderError({ code: "E1", stack: "secret", requestId: "r1" }, ["code", "requestId"]);
  assert.deepEqual(sanitized, { code: "E1", requestId: "r1" });
});

test("P7.2 sensitive error details remain in protected diagnostics only", () => {
  assert.equal(errorForSurface("db at 10.0.0.1", "diagnostics"), "db at 10.0.0.1");
  assert.doesNotMatch(errorForSurface("db at 10.0.0.1", "owner"), /10\.0\.0\.1/);
});

test("P7.2 owner-facing errors remain useful but safe", () => {
  const error = ownerError("CC-403", "Ask the owner for access");
  assert.equal(error.code, "CC-403");
  assert.equal(error.detail, null);
});

test("P7.2 future data residency concerns can be modeled", () => {
  assert.deepEqual(residencyPolicy("eu-west"), { region: "eu-west", modeled: true });
  assert.throws(() => residencyPolicy(" "), /requires a region/);
});

test("P7.2 regulatory requirements register through compliance modules", () => {
  assert.doesNotThrow(() => registerComplianceModule({ id: "gdpr", requirements: ["dsar"], canAlterCoreRules: false }));
  assert.throws(() => registerComplianceModule({ id: " ", requirements: [], canAlterCoreRules: false }), /requires an id and requirements/);
});

test("P7.2 compliance modules cannot silently alter core owner rules", () => {
  assert.throws(() => registerComplianceModule({ id: "gdpr", requirements: ["dsar"], canAlterCoreRules: true }), /cannot alter core owner rules/);
});

test("P7.2 no AI legal acceptance", () => {
  assert.doesNotThrow(() => assertNoAiLegalAcceptance("owner"));
  assert.throws(() => assertNoAiLegalAcceptance("ai"), /AI cannot accept legal terms/);
});

test("P7.2 no Agent terms acceptance without exact authorization", () => {
  assert.doesNotThrow(() => assertTermsAcceptance("agent", "terms:accept"));
  assert.throws(() => assertTermsAcceptance("agent", "terms"), /exact authorization/);
});

test("P7.2 no automated MFA response", () => {
  assert.doesNotThrow(() => assertNoAutomatedMfa(false));
  assert.throws(() => assertNoAutomatedMfa(true), /cannot be automated/);
});

test("P7.2 privacy and security policies are versioned", () => {
  const policy = versionPolicy({ name: "privacy", version: "3", effectiveAt: T0 });
  assert.equal(policy.version, "3");
  assert.throws(() => versionPolicy({ name: "privacy", version: "", effectiveAt: T0 }), /requires a name and version/);
});

test("P7.2 privacy and security changes appear in release impact analysis", () => {
  assert.doesNotThrow(() => assertPolicyInReleaseImpact(["privacy", "security", "performance"]));
  assert.throws(() => assertPolicyInReleaseImpact(["privacy"]), /must include security/);
});
