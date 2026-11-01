import { parseTimestamp } from "./types.js";
export const WEBHOOK_BINDING_VERSION = "cc-webhook-v1";
export function canonicalWebhookSignedPayload(envelope) {
    return JSON.stringify([
        WEBHOOK_BINDING_VERSION,
        envelope.providerKey,
        envelope.eventId,
        envelope.accountId,
        envelope.companyId ?? null,
        envelope.environment,
        envelope.occurredAt,
        envelope.receivedAt,
        envelope.keyRef,
        envelope.sequence ?? null,
        envelope.signedPayload
    ]);
}
function rejected(reason) {
    return Object.freeze({
        accepted: false,
        duplicate: false,
        advancesAuthoritativeCursor: false,
        durablePersistenceRequired: false,
        reason
    });
}
export class WebhookAcceptanceGate {
    verifySignature;
    constructor(verifySignature) {
        this.verifySignature = verifySignature;
    }
    accept(envelope, expected) {
        if (!envelope.providerKey.trim() || !envelope.eventId.trim() || !envelope.accountId.trim() || !envelope.keyRef.trim() || !envelope.signature.trim() || !envelope.signedPayload) {
            throw new Error("Webhook identity/signature/provider payload fields are required");
        }
        if (envelope.providerKey !== expected.providerKey || envelope.accountId !== expected.accountId || envelope.environment !== expected.environment || envelope.companyId !== expected.companyId) {
            return rejected("callback_binding_mismatch");
        }
        if (!Number.isSafeInteger(expected.maxAgeMs) || expected.maxAgeMs < 0 || !Number.isSafeInteger(expected.maxFutureSkewMs) || expected.maxFutureSkewMs < 0) {
            throw new Error("Webhook timing limits must be non-negative safe integers");
        }
        if (envelope.sequence !== undefined && (!Number.isSafeInteger(envelope.sequence) || envelope.sequence < 0)) {
            throw new Error("Webhook sequence must be a non-negative safe integer");
        }
        const occurred = parseTimestamp(envelope.occurredAt, "occurredAt");
        const received = parseTimestamp(envelope.receivedAt, "receivedAt");
        const age = received - occurred;
        if (age > expected.maxAgeMs)
            return rejected("callback_expired");
        if (age < -expected.maxFutureSkewMs)
            return rejected("callback_future_timestamp");
        const matchingWindows = expected.keyWindows.filter((window) => window.keyRef === envelope.keyRef);
        const keyWindow = matchingWindows[0];
        if (keyWindow === undefined)
            return rejected("callback_key_not_active");
        if (matchingWindows.length !== 1)
            return rejected("callback_key_window_ambiguous");
        const notBefore = parseTimestamp(keyWindow.notBefore, "keyWindow.notBefore");
        const notAfter = parseTimestamp(keyWindow.notAfter, "keyWindow.notAfter");
        if (notAfter <= notBefore)
            throw new Error("Webhook key validity window must be bounded and increasing");
        if (received < notBefore || received >= notAfter)
            return rejected("callback_key_outside_validity_window");
        if (keyWindow.revokedAt !== undefined) {
            const revokedAt = parseTimestamp(keyWindow.revokedAt, "keyWindow.revokedAt");
            if (received >= revokedAt)
                return rejected("callback_key_revoked");
        }
        const canonicalSignedPayload = canonicalWebhookSignedPayload(envelope);
        let signatureValid = false;
        try {
            signatureValid = this.verifySignature(envelope.keyRef, canonicalSignedPayload, envelope.signature);
        }
        catch {
            signatureValid = false;
        }
        if (!signatureValid)
            return rejected("callback_signature_invalid");
        // Duplicate and sequence truth is deliberately deferred to the owner-scoped durable inbox.
        // A process restart must never reset callback replay/order authority.
        return Object.freeze({
            accepted: true,
            duplicate: false,
            advancesAuthoritativeCursor: false,
            durablePersistenceRequired: true,
            reason: "accepted_requires_durable_persistence",
            bindingVersion: WEBHOOK_BINDING_VERSION,
            signatureKeyRef: envelope.keyRef,
            signatureVerifiedAt: envelope.receivedAt,
            signatureKeyNotBefore: keyWindow.notBefore,
            signatureKeyNotAfter: keyWindow.notAfter,
            ...(keyWindow.revokedAt === undefined ? {} : { signatureKeyRevokedAt: keyWindow.revokedAt })
        });
    }
}
//# sourceMappingURL=webhooks.js.map