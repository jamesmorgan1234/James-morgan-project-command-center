import type { EnvironmentName } from "../kernel/config.js";
import { parseTimestamp } from "./types.js";

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
  readonly signedPayload: string;
  readonly sequence?: number;
}

export interface WebhookExpectedBinding {
  readonly providerKey: string;
  readonly accountId: string;
  readonly companyId?: string;
  readonly environment: EnvironmentName;
  readonly activeKeyRefs: readonly string[];
  readonly maxAgeMs: number;
  readonly maxFutureSkewMs: number;
}

export interface WebhookAcceptance {
  readonly accepted: boolean;
  readonly duplicate: boolean;
  readonly advancesAuthoritativeCursor: boolean;
  readonly reason: string;
}

export type SignatureVerifier = (keyRef: string, signedPayload: string, signature: string) => boolean;

export class WebhookAcceptanceGate {
  readonly #seen = new Set<string>();
  readonly #latestSequence = new Map<string, number>();
  constructor(private readonly verifySignature: SignatureVerifier) {}

  accept(envelope: WebhookEnvelope, expected: WebhookExpectedBinding): WebhookAcceptance {
    if (!envelope.providerKey.trim() || !envelope.eventId.trim() || !envelope.accountId.trim() || !envelope.keyRef.trim() || !envelope.signature.trim()) throw new Error("Webhook identity/signature fields are required");
    if (envelope.providerKey !== expected.providerKey || envelope.accountId !== expected.accountId || envelope.environment !== expected.environment || envelope.companyId !== expected.companyId) return Object.freeze({ accepted: false, duplicate: false, advancesAuthoritativeCursor: false, reason: "callback_binding_mismatch" });
    if (!expected.activeKeyRefs.includes(envelope.keyRef)) return Object.freeze({ accepted: false, duplicate: false, advancesAuthoritativeCursor: false, reason: "callback_key_not_active" });
    if (!Number.isSafeInteger(expected.maxAgeMs) || expected.maxAgeMs < 0 || !Number.isSafeInteger(expected.maxFutureSkewMs) || expected.maxFutureSkewMs < 0) throw new Error("Webhook timing limits must be non-negative safe integers");
    const occurred = parseTimestamp(envelope.occurredAt, "occurredAt");
    const received = parseTimestamp(envelope.receivedAt, "receivedAt");
    const age = received - occurred;
    if (age > expected.maxAgeMs) return Object.freeze({ accepted: false, duplicate: false, advancesAuthoritativeCursor: false, reason: "callback_expired" });
    if (age < -expected.maxFutureSkewMs) return Object.freeze({ accepted: false, duplicate: false, advancesAuthoritativeCursor: false, reason: "callback_future_timestamp" });
    let signatureValid = false;
    try { signatureValid = this.verifySignature(envelope.keyRef, envelope.signedPayload, envelope.signature); }
    catch { signatureValid = false; }
    if (!signatureValid) return Object.freeze({ accepted: false, duplicate: false, advancesAuthoritativeCursor: false, reason: "callback_signature_invalid" });
    const seenKey = `${envelope.providerKey}|${envelope.accountId}|${envelope.eventId}`;
    if (this.#seen.has(seenKey)) return Object.freeze({ accepted: true, duplicate: true, advancesAuthoritativeCursor: false, reason: "duplicate_ignored" });
    this.#seen.add(seenKey);
    if (envelope.sequence === undefined) return Object.freeze({ accepted: true, duplicate: false, advancesAuthoritativeCursor: true, reason: "accepted_no_sequence" });
    if (!Number.isSafeInteger(envelope.sequence) || envelope.sequence < 0) throw new Error("Webhook sequence must be a non-negative safe integer");
    const bindingKey = `${envelope.providerKey}|${envelope.accountId}|${envelope.companyId ?? "-"}|${envelope.environment}`;
    const latest = this.#latestSequence.get(bindingKey);
    if (latest !== undefined && envelope.sequence <= latest) return Object.freeze({ accepted: true, duplicate: false, advancesAuthoritativeCursor: false, reason: "accepted_out_of_order_no_regression" });
    this.#latestSequence.set(bindingKey, envelope.sequence);
    return Object.freeze({ accepted: true, duplicate: false, advancesAuthoritativeCursor: true, reason: "accepted" });
  }
}
