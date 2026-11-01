import type { AuthSessionStore } from "../security/auth.js";
import type { PolicyEngine } from "../security/policy.js";
import type { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import { type SocialDraft } from "./drafts.js";
import { type SocialConnectionEvidence } from "./connections.js";
import type { SocialIdentityMapRecord } from "./identity.js";
import { type PlatformProfileRegistry, type PlatformAdapterRegistry } from "./profiles.js";
import { EvidenceBackedPublishLedger, type EvidenceBackedPublishIntent } from "./publishing.js";
export interface SocialPublishReservation {
    readonly ownerId: string;
    readonly intentId: string;
    readonly authorizationRef: string;
    readonly idempotencyKey: string;
    readonly providerRequestRef: string;
    readonly envelope: string;
}
export interface AtomicSocialPublishStore {
    reserve(reservation: SocialPublishReservation): Promise<"reserved" | "already_reserved">;
}
export interface SocialPublishPreview {
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly platform: string;
    readonly platformIdentityId: string;
    readonly draftId: string;
    readonly draftVersion: number;
    readonly scheduledAt?: string;
}
export declare function buildSocialPublishPreview(intent: EvidenceBackedPublishIntent, draft: SocialDraft, identity: SocialIdentityMapRecord): SocialPublishPreview;
export declare function socialPublishAuthorizationBinding(intent: EvidenceBackedPublishIntent, identity: SocialIdentityMapRecord): string;
export declare class SocialPublishGate {
    readonly sessions: AuthSessionStore;
    readonly policies: PolicyEngine;
    readonly authorizations: ProtectedAuthorizationRegistry;
    readonly store: AtomicSocialPublishStore;
    readonly ledger: EvidenceBackedPublishLedger;
    readonly liveConnection: (accountId: string) => SocialConnectionEvidence;
    readonly clock: () => string;
    constructor(sessions: AuthSessionStore, policies: PolicyEngine, authorizations: ProtectedAuthorizationRegistry, store: AtomicSocialPublishStore, ledger: EvidenceBackedPublishLedger, liveConnection: (accountId: string) => SocialConnectionEvidence, clock?: () => string);
    reserve(intent: EvidenceBackedPublishIntent, draft: SocialDraft, identity: SocialIdentityMapRecord, profiles: PlatformProfileRegistry, adapters: PlatformAdapterRegistry, sessionId: string, now: string, providerRequestRef: string): Promise<Readonly<{
        dispatchAllowed: false;
        state: "reconciliation_required";
    }> | Readonly<{
        dispatchAllowed: true;
        state: "reserved";
        providerRequestRef: string;
    }>>;
}
