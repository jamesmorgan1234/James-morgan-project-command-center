import type { EnvironmentName } from "../kernel/config.js";
export declare const WEBHOOK_BINDING_VERSION: "cc-webhook-v1";
export interface WebhookEnvelope {
    readonly providerKey: string;
    readonly eventId: string;
    readonly accountId: string;
    readonly companyId?: string;
    readonly environment: EnvironmentName;
    readonly occurredAt: string;
    readonly receivedAt: string;
    readonly keyRef: string;
    readonly signature: string;
    /** Exact authenticated provider bytes represented as a string by the provider adapter. */
    readonly signedPayload: string;
    readonly sequence?: number;
}
export interface WebhookKeyWindow {
    readonly keyRef: string;
    readonly notBefore: string;
    readonly notAfter: string;
    readonly revokedAt?: string;
}
export interface WebhookExpectedBinding {
    readonly providerKey: string;
    readonly accountId: string;
    readonly companyId?: string;
    readonly environment: EnvironmentName;
    /** Explicit bounded key windows. A bare active-key list is intentionally insufficient. */
    readonly keyWindows: readonly WebhookKeyWindow[];
    readonly maxAgeMs: number;
    readonly maxFutureSkewMs: number;
}
export interface WebhookAcceptance {
    readonly accepted: boolean;
    /** Durable persistence, not this process, is authoritative for duplicate detection. */
    readonly duplicate: false;
    /** Durable persistence, not this process, is authoritative for sequence advancement. */
    readonly advancesAuthoritativeCursor: false;
    readonly durablePersistenceRequired: boolean;
    readonly reason: string;
    readonly bindingVersion?: typeof WEBHOOK_BINDING_VERSION;
    readonly signatureKeyRef?: string;
    readonly signatureVerifiedAt?: string;
    readonly signatureKeyNotBefore?: string;
    readonly signatureKeyNotAfter?: string;
    readonly signatureKeyRevokedAt?: string;
}
/**
 * Provider adapters verify the signature against this exact canonical value.
 * The provider bytes and callback metadata therefore share one authenticated envelope.
 */
export type SignatureVerifier = (keyRef: string, canonicalSignedPayload: string, signature: string) => boolean;
export declare function canonicalWebhookSignedPayload(envelope: WebhookEnvelope): string;
export declare class WebhookAcceptanceGate {
    private readonly verifySignature;
    constructor(verifySignature: SignatureVerifier);
    accept(envelope: WebhookEnvelope, expected: WebhookExpectedBinding): WebhookAcceptance;
}
