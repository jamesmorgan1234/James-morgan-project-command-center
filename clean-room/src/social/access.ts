import { assuranceAtLeast } from "../security/types.js";
import type { AuthSessionStore } from "../security/auth.js";
import type { PolicyEngine } from "../security/policy.js";
import type { SocialIdentityMapRecord } from "./identity.js";
import { assertSecretChannelSafe } from "../security/secret-channels.js";

export interface SocialAccountCapability {
  readonly ownerId: string;
  readonly sessionId: string;
  readonly accountId: string;
  readonly brandId: string;
  readonly companyId?: string;
  readonly projectId?: string;
  readonly dataClasses: readonly string[];
  readonly canWrite: boolean;
  readonly verifiedAt: string;
  readonly expiresAt: string;
  readonly revoked: boolean;
  readonly contained: boolean;
}

export interface SocialAccountPermissionView {
  readonly ownerId: string;
  readonly companyId?: string;
  readonly projectId?: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly platform: string;
  readonly platformIdentityId: string;
  readonly readableDataClasses: readonly string[];
  readonly canWrite: boolean;
  readonly revoked: boolean;
  readonly contained: boolean;
  readonly verifiedAt: string;
  readonly expiresAt: string;
  readonly secretsExposed: false;
}

export interface SocialAccountMetadataExport {
  readonly ownerId: string;
  readonly entityId: string;
  readonly companyId?: string;
  readonly projectId?: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly platform: string;
  readonly platformIdentityId: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly version: number;
  readonly secretsExposed: false;
}

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function cleanClasses(values: readonly string[]): readonly string[] {
  if (!values.length || values.some((value) => !value.trim() || /secret|credential|token/i.test(value))) throw new Error("social data classes are invalid or secret-bearing");
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

export class SocialAccessBoundary {
  constructor(
    readonly sessions: AuthSessionStore,
    readonly policies: PolicyEngine,
    readonly identityLookup: (accountId: string) => SocialIdentityMapRecord | undefined,
    readonly capabilityLookup: (sessionId: string, accountId: string) => SocialAccountCapability | undefined,
    readonly clock: () => string = () => new Date().toISOString()
  ) {}

  authorize(sessionId: string, accountId: string, requested: readonly string[], now: string, write = false) {
    const session = this.sessions.validateLive(sessionId, now);
    const identity = this.identityLookup(accountId);
    const capability = this.capabilityLookup(sessionId, accountId);
    if (!identity || !capability || capability.sessionId !== session.id || capability.ownerId !== session.ownerId || capability.ownerId !== identity.ownerId || capability.accountId !== accountId || identity.accountIdentityId !== accountId || capability.brandId !== identity.brandId || capability.companyId !== identity.companyId || capability.projectId !== identity.projectId || session.companyId !== identity.companyId || session.projectId !== identity.projectId || session.accountId !== accountId) throw new Error("social account/company/project capability mismatch");

    const at = timestamp(now, "social access now");
    const verified = timestamp(capability.verifiedAt, "social capability verifiedAt");
    const expires = timestamp(capability.expiresAt, "social capability expiresAt");
    if (capability.revoked || capability.contained || !assuranceAtLeast(session.assurance, write ? "fresh_passkey_uv" : "passkey_uv") || verified > at || at - verified >= 300_000 || expires <= at || (write && !capability.canWrite) || !session.lastVerifiedAt || Date.parse(session.lastVerifiedAt) < verified) throw new Error("social capability revoked contained expired stale or read-only");

    const decision = this.policies.evaluate({ action: write ? "social.write" : "social.read", subject: { ...session, sessionId: session.id }, resourceOwnerId: identity.ownerId, ...(identity.companyId ? { resourceCompanyId: identity.companyId } : {}), ...(identity.projectId ? { resourceProjectId: identity.projectId } : {}), resourceAccountId: accountId, now, revocationStateFresh: true });
    if (!decision.allowed) throw new Error("social access policy denied");
    assertSecretChannelSafe("brain_memory", { requested });
    const requestedClasses = cleanClasses(requested);
    if (requestedClasses.some((item) => !capability.dataClasses.includes(item))) throw new Error("social context data class denied");

    return Object.freeze({
      identity: Object.freeze({ ownerId: identity.ownerId, entityId: identity.entityId, companyId: identity.companyId, brandId: identity.brandId, projectId: identity.projectId, accountIdentityId: identity.accountIdentityId, platform: identity.platform, platformIdentityId: identity.platformIdentityId, version: identity.version }),
      dataClasses: requestedClasses,
      protectedActionAuthorized: false as const
    });
  }

  permissionView(sessionId: string, accountId: string, now: string): SocialAccountPermissionView {
    const identity = this.identityLookup(accountId);
    const capability = this.capabilityLookup(sessionId, accountId);
    if (!identity || !capability) throw new Error("social account permission view unavailable");
    this.sessions.validateLive(sessionId, now);
    if (identity.ownerId !== capability.ownerId || identity.accountIdentityId !== capability.accountId || identity.brandId !== capability.brandId || identity.companyId !== capability.companyId || identity.projectId !== capability.projectId) throw new Error("social permission view scope mismatch");
    return Object.freeze({ ownerId: identity.ownerId, companyId: identity.companyId, projectId: identity.projectId, brandId: identity.brandId, accountId, platform: identity.platform, platformIdentityId: identity.platformIdentityId, readableDataClasses: cleanClasses(capability.dataClasses), canWrite: capability.canWrite, revoked: capability.revoked, contained: capability.contained, verifiedAt: capability.verifiedAt, expiresAt: capability.expiresAt, secretsExposed: false });
  }
}

export function exportSocialAccountMetadata(identity: SocialIdentityMapRecord): SocialAccountMetadataExport {
  assertSecretChannelSafe("brain_memory", identity);
  return Object.freeze({ ownerId: identity.ownerId, entityId: identity.entityId, companyId: identity.companyId, projectId: identity.projectId, brandId: identity.brandId, accountId: identity.accountIdentityId, platform: identity.platform, platformIdentityId: identity.platformIdentityId, displayName: identity.displayName, aliases: Object.freeze([...identity.aliases]), version: identity.version, secretsExposed: false });
}

export interface SocialRecoverySnapshot {
  readonly schemaVersion: 1;
  readonly ownerId: string;
  readonly accountId: string;
  readonly platformIdentityId: string;
  readonly records: readonly Readonly<{ id: string; kind: "draft" | "asset_reference" | "metric_observation" | "untrusted_message"; value: unknown }>[];
  readonly evidenceRefs: readonly string[];
}

export async function socialRecoverySnapshotHash(snapshot: SocialRecoverySnapshot): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(snapshot)));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function planSocialDataRestore(boundary: SocialAccessBoundary, sessionId: string, now: string, snapshot: SocialRecoverySnapshot, knownGoodHash: string) {
  if (snapshot.schemaVersion !== 1) throw new Error("unsupported social recovery schema version");
  const access = boundary.authorize(sessionId, snapshot.accountId, ["recovery"], now, true);
  if (access.identity.ownerId !== snapshot.ownerId || access.identity.platformIdentityId !== snapshot.platformIdentityId || !snapshot.evidenceRefs.length || snapshot.evidenceRefs.some((ref) => !ref.trim())) throw new Error("restore canonical account/provenance mismatch");
  if (new Set(snapshot.records.map((record) => record.id)).size !== snapshot.records.length || snapshot.records.some((record) => !record.id.trim() || !["draft", "asset_reference", "metric_observation", "untrusted_message"].includes(record.kind))) throw new Error("restore contains unsupported or duplicate records");
  assertSecretChannelSafe("brain_memory", snapshot);
  if (knownGoodHash !== await socialRecoverySnapshotHash(snapshot)) throw new Error("known-good recovery integrity mismatch");
  boundary.authorize(sessionId, snapshot.accountId, ["recovery"], boundary.clock(), true);
  return Object.freeze({ recordIds: Object.freeze(snapshot.records.map((record) => record.id)), stagingOnly: true as const, replayAllowed: false as const, restoreAuthority: false as const, currentRevocationsRevalidated: true as const });
}

export function queueSocialInboxFollowUp(queue: import("../personal/needs-me.js").NeedsMeQueue, boundary: SocialAccessBoundary, sessionId: string, message: import("./inbox.js").EvidenceBackedExternalMessage, dueAt: string, ownerRequestRef: string, now: string) {
  const { identity } = boundary.authorize(sessionId, message.accountId, ["messages"], now, true);
  if (identity.ownerId !== message.ownerId || identity.brandId !== message.brandId || identity.platform !== message.platform || !message.threadId.trim() || !ownerRequestRef.trim() || !message.sourceRefs.length || !Number.isFinite(Date.parse(dueAt)) || Date.parse(dueAt) < Date.parse(now)) throw new Error("scoped owner follow-up identity/time/evidence mismatch");
  const scope = JSON.stringify([message.ownerId, message.brandId, message.accountId, message.threadId, dueAt]);
  const id = `social-follow-up:${scope}`;
  queue.upsert({ id, ownerId: message.ownerId, needKey: id, title: `Review social communication at ${dueAt}`, reason: "A scoped owner follow-up requires review", urgency: "normal", requiredEnvironment: "any_device", ownerAction: "Review the intended account/thread and prepare a reply; sending requires separate current authorization", unlockRefs: [ownerRequestRef], resumeRefs: [`social-thread:${JSON.stringify([message.ownerId, message.brandId, message.accountId, message.threadId])}`], sourceRefs: [ownerRequestRef], state: "open" });
  return Object.freeze({ needId: id, sendAuthorized: false as const, externalInstructionAuthority: "none" as const });
}
