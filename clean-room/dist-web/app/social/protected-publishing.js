import { parseTimestamp } from "../security/types.js";
import { assertSocialDraftIntegrity, assertSocialDraftTarget } from "./drafts.js";
import { assessSocialConnectionForIdentity } from "./connections.js";
import { transformForProfile } from "./profiles.js";
export function buildSocialPublishPreview(intent, draft, identity) {
    assertSocialDraftTarget(draft, identity);
    if (intent.ownerId !== identity.ownerId || intent.brandId !== identity.brandId || intent.accountId !== identity.accountIdentityId || intent.draftId !== draft.id || intent.draftVersion !== draft.version)
        throw new Error("publish preview exact account/draft mismatch");
    return Object.freeze({ ownerId: intent.ownerId, brandId: intent.brandId, accountId: intent.accountId, platform: identity.platform, platformIdentityId: identity.platformIdentityId, draftId: intent.draftId, draftVersion: intent.draftVersion, ...(intent.scheduledAt ? { scheduledAt: intent.scheduledAt } : {}) });
}
export function socialPublishAuthorizationBinding(intent, identity) {
    return JSON.stringify([intent.ownerId, identity.entityId, identity.companyId ?? null, intent.brandId, identity.projectId ?? null, intent.accountId, identity.platform, identity.platformIdentityId, identity.version, intent.id, intent.draftId, intent.draftVersion, intent.draftContentHash, intent.profileKey, intent.profileVersion, intent.idempotencyKey, intent.scheduledAt ?? null]);
}
export class SocialPublishGate {
    sessions;
    policies;
    authorizations;
    store;
    ledger;
    liveConnection;
    clock;
    constructor(sessions, policies, authorizations, store, ledger, liveConnection, clock = () => new Date().toISOString()) {
        this.sessions = sessions;
        this.policies = policies;
        this.authorizations = authorizations;
        this.store = store;
        this.ledger = ledger;
        this.liveConnection = liveConnection;
        this.clock = clock;
    }
    async reserve(intent, draft, identity, profiles, adapters, sessionId, now, providerRequestRef) {
        const check = (at) => {
            const session = this.sessions.validateLive(sessionId, at);
            if (session.assurance !== "fresh_passkey_uv")
                throw new Error("publish requires fresh passkey verification");
            if (session.ownerId !== intent.ownerId || session.companyId !== identity.companyId || session.projectId !== identity.projectId || session.accountId !== identity.accountIdentityId)
                throw new Error("publish live session scope mismatch");
            const decision = this.policies.evaluate({ action: "social.publish", subject: { ...session, sessionId: session.id }, resourceOwnerId: intent.ownerId, ...(identity.companyId ? { resourceCompanyId: identity.companyId } : {}), ...(identity.projectId ? { resourceProjectId: identity.projectId } : {}), resourceAccountId: intent.accountId, now: at, revocationStateFresh: true });
            if (!decision.allowed)
                throw new Error("publish policy denied");
            const atMs = parseTimestamp(at, "now");
            if (!session.lastVerifiedAt || atMs - parseTimestamp(session.lastVerifiedAt, "verification") >= 300_000)
                throw new Error("publish verification stale");
        };
        check(now);
        buildSocialPublishPreview(intent, draft, identity);
        await assertSocialDraftIntegrity(draft);
        const profile = profiles.get(intent.ownerId, intent.profileKey);
        if (profile.version !== intent.profileVersion || profile.platform !== identity.platform)
            throw new Error("publish profile stale or wrong platform");
        if (!profile.publishScope || !intent.requiredScopes.includes(profile.publishScope))
            throw new Error("exact provider publishing scope missing");
        if (intent.scheduledAt && profile.providerConstraints.schedulingSupported !== true)
            throw new Error("current platform profile does not support scheduling");
        const media = draft.assetBindings.length ? draft.assetBindings : [undefined];
        for (const asset of media) {
            const transformed = transformForProfile({ caption: draft.body, mediaKind: asset ? asset.mediaKind ?? "unknown" : "text", disclosures: draft.disclosures ?? [], rightsEvidenceRefs: draft.rightsEvidenceRefs, metadata: { mediaCount: draft.assetBindings.length, ...(asset?.width !== undefined ? { width: asset.width } : {}), ...(asset?.height !== undefined ? { height: asset.height } : {}), ...(asset?.durationSeconds !== undefined ? { durationSeconds: asset.durationSeconds } : {}) }, now }, profile, adapters);
            if (transformed.caption !== draft.body || transformed.disclosures.some((item) => !draft.disclosures?.includes(item)))
                throw new Error("transformed content requires a newly approved exact draft");
        }
        if (!assessSocialConnectionForIdentity(this.liveConnection(intent.accountId), identity, intent.requiredScopes, now, 300_000).live)
            throw new Error("publish connection not live");
        const binding = socialPublishAuthorizationBinding(intent, identity);
        const use = { ownerId: intent.ownerId, sessionId, action: "social.publish", authorizationIntentBinding: binding };
        const grant = this.authorizations.assertUsable(intent.authorizationRef, use, now);
        if (grant.authoritySource !== "owner_verified" || grant.issuedAt !== intent.authorizationObservedAt || grant.expiresAt !== intent.authorizationExpiresAt || parseTimestamp(now, "now") - parseTimestamp(grant.issuedAt, "grant") >= 300_000)
            throw new Error("publish requires fresh exact owner authorization");
        if (parseTimestamp(grant.issuedAt, "grant") < parseTimestamp(draft.observedAt, "draft"))
            throw new Error("publish authorization predates exact content");
        if (!providerRequestRef.trim())
            throw new Error("stable provider request identity required");
        this.ledger.prepare(intent, draft, this.liveConnection(intent.accountId), now, 300_000);
        if (intent.scheduledAt && parseTimestamp(intent.scheduledAt, "schedule") > parseTimestamp(now, "now"))
            throw new Error("publish schedule not due");
        const reserved = await this.store.reserve({ ownerId: intent.ownerId, intentId: intent.id, authorizationRef: intent.authorizationRef, idempotencyKey: intent.idempotencyKey, providerRequestRef, envelope: binding });
        if (reserved !== "reserved")
            return Object.freeze({ dispatchAllowed: false, state: "reconciliation_required" });
        const finalNow = this.clock();
        check(finalNow);
        if (!assessSocialConnectionForIdentity(this.liveConnection(intent.accountId), identity, intent.requiredScopes, finalNow, 300_000).live)
            throw new Error("publish connection lost before dispatch");
        this.authorizations.assertUsable(intent.authorizationRef, use, finalNow);
        this.authorizations.consume(intent.authorizationRef, use, finalNow);
        this.ledger.startAttempt({ attemptId: providerRequestRef, intentId: intent.id, accountId: intent.accountId, idempotencyKey: intent.idempotencyKey, state: "submitted", providerRequestRef, observedAt: finalNow });
        return Object.freeze({ dispatchAllowed: true, state: "reserved", providerRequestRef });
    }
}
//# sourceMappingURL=protected-publishing.js.map