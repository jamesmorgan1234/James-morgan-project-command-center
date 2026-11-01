import type { AuthSessionStore } from "../security/auth.js";
import type { PolicyEngine } from "../security/policy.js";
import type { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import type { AtomicSocialPublishStore } from "./protected-publishing.js";
import { type EvidenceBackedExternalMessage, type EvidenceBackedReplyDraft } from "./inbox.js";
import type { SocialIdentityMapRecord } from "./identity.js";
import { type SocialConnectionEvidence } from "./connections.js";
export interface SocialCommunicationProviderPolicy {
    readonly platform: string;
    readonly commentsSupported: boolean;
    readonly mentionsSupported: boolean;
    readonly directMessagesSupported: boolean;
    readonly requiredSendScope: string;
    readonly sourceRefs: readonly string[];
}
export declare function communicationAuthorizationBinding(id: string, key: string, draft: EvidenceBackedReplyDraft, message: EvidenceBackedExternalMessage, identity: SocialIdentityMapRecord): string;
export declare class CommunicationSendGate {
    readonly sessions: AuthSessionStore;
    readonly policies: PolicyEngine;
    readonly authorizations: ProtectedAuthorizationRegistry;
    readonly store: AtomicSocialPublishStore;
    readonly liveConnection: (accountId: string) => SocialConnectionEvidence;
    readonly requiredScope: string;
    readonly clock: () => string;
    readonly providerPolicy?: SocialCommunicationProviderPolicy | undefined;
    constructor(sessions: AuthSessionStore, policies: PolicyEngine, authorizations: ProtectedAuthorizationRegistry, store: AtomicSocialPublishStore, liveConnection: (accountId: string) => SocialConnectionEvidence, requiredScope: string, clock?: () => string, providerPolicy?: SocialCommunicationProviderPolicy | undefined);
    reserve(id: string, key: string, authorizationRef: string, providerRequestRef: string, draft: EvidenceBackedReplyDraft, message: EvidenceBackedExternalMessage, identity: SocialIdentityMapRecord, sessionId: string, now: string): Promise<Readonly<{
        sendAuthorized: false;
        state: "reconciliation_required";
    }> | Readonly<{
        sendAuthorized: true;
        providerRequestRef: string;
        externalTextInstructionAuthority: "none";
    }>>;
}
