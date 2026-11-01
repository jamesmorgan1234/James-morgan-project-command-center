import { socialReplyContentHash } from "./inbox.js";
import { assessSocialConnectionForIdentity } from "./connections.js";
export function communicationAuthorizationBinding(id, key, draft, message, identity) {
    return JSON.stringify([draft.ownerId, identity.entityId, identity.companyId ?? null, draft.brandId, identity.projectId ?? null, draft.accountId, identity.platform, identity.platformIdentityId, draft.threadId, message.externalAuthorRef, draft.messageId, draft.id, draft.version, draft.contentHash, id, key]);
}
function assertProviderPolicy(policy, message, requiredScope) {
    if (!policy)
        return;
    if (!policy.platform.trim() || !policy.requiredSendScope.trim() || !policy.sourceRefs.length || policy.sourceRefs.some((ref) => !ref.trim()))
        throw new Error("invalid social communication provider policy");
    if (policy.platform !== message.platform || policy.requiredSendScope !== requiredScope)
        throw new Error("social communication provider policy mismatch");
    const kind = message.kind ?? "other";
    if (kind === "comment" && !policy.commentsSupported)
        throw new Error("comment workflow unsupported by provider");
    if (kind === "mention" && !policy.mentionsSupported)
        throw new Error("mention workflow unsupported by provider");
    if (kind === "direct_message" && !policy.directMessagesSupported)
        throw new Error("direct-message workflow unsupported by provider");
}
export class CommunicationSendGate {
    sessions;
    policies;
    authorizations;
    store;
    liveConnection;
    requiredScope;
    clock;
    providerPolicy;
    constructor(sessions, policies, authorizations, store, liveConnection, requiredScope, clock = () => new Date().toISOString(), providerPolicy) {
        this.sessions = sessions;
        this.policies = policies;
        this.authorizations = authorizations;
        this.store = store;
        this.liveConnection = liveConnection;
        this.requiredScope = requiredScope;
        this.clock = clock;
        this.providerPolicy = providerPolicy;
    }
    async reserve(id, key, authorizationRef, providerRequestRef, draft, message, identity, sessionId, now) {
        if (!id.trim() || !key.trim() || !authorizationRef.trim() || !providerRequestRef.trim() || !this.requiredScope.trim())
            throw new Error("exact social send identifiers and scope required");
        if (draft.ownerId !== identity.ownerId || draft.brandId !== identity.brandId || draft.accountId !== identity.accountIdentityId)
            throw new Error("reply canonical identity mismatch");
        if (message.ownerId !== draft.ownerId || message.brandId !== draft.brandId || message.accountId !== draft.accountId || message.id !== draft.messageId || message.threadId !== draft.threadId || message.platform !== identity.platform)
            throw new Error("reply canonical message/thread mismatch");
        assertProviderPolicy(this.providerPolicy, message, this.requiredScope);
        if (draft.contentHash !== await socialReplyContentHash(draft))
            throw new Error("reply content integrity mismatch");
        const binding = communicationAuthorizationBinding(id, key, draft, message, identity);
        const use = { ownerId: draft.ownerId, sessionId, action: "social.send", authorizationIntentBinding: binding };
        const check = (at) => {
            const session = this.sessions.validateLive(sessionId, at);
            if (session.assurance !== "fresh_passkey_uv" || session.ownerId !== draft.ownerId || session.companyId !== identity.companyId || session.projectId !== identity.projectId || session.accountId !== draft.accountId)
                throw new Error("social send live identity mismatch");
            const decision = this.policies.evaluate({ action: "social.send", subject: { ...session, sessionId: session.id }, resourceOwnerId: draft.ownerId, ...(identity.companyId ? { resourceCompanyId: identity.companyId } : {}), ...(identity.projectId ? { resourceProjectId: identity.projectId } : {}), resourceAccountId: draft.accountId, now: at, revocationStateFresh: true });
            if (!decision.allowed)
                throw new Error("social send policy denied");
            if (!session.lastVerifiedAt || Date.parse(at) - Date.parse(session.lastVerifiedAt) >= 300_000)
                throw new Error("social send verification stale");
            if (!assessSocialConnectionForIdentity(this.liveConnection(draft.accountId), identity, [this.requiredScope], at, 300_000).live)
                throw new Error("social send connection unavailable");
        };
        check(now);
        const grant = this.authorizations.assertUsable(authorizationRef, use, now);
        if (grant.authoritySource !== "owner_verified" || Date.parse(grant.issuedAt) < Date.parse(draft.createdAt) || Date.parse(now) - Date.parse(grant.issuedAt) >= 300_000)
            throw new Error("social send requires fresh exact owner approval");
        const reserved = await this.store.reserve({ ownerId: draft.ownerId, intentId: id, authorizationRef, idempotencyKey: key, providerRequestRef, envelope: binding });
        if (reserved !== "reserved")
            return Object.freeze({ sendAuthorized: false, state: "reconciliation_required" });
        const finalNow = this.clock();
        check(finalNow);
        this.authorizations.assertUsable(authorizationRef, use, finalNow);
        this.authorizations.consume(authorizationRef, use, finalNow);
        return Object.freeze({ sendAuthorized: true, providerRequestRef, externalTextInstructionAuthority: "none" });
    }
}
//# sourceMappingURL=protected-communications.js.map