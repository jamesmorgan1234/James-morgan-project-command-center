import { connectionIsLive, type SocialConnection } from "./connections.js";
import { assertDraftPublishReady, type SocialDraft } from "./drafts.js";

export type PublishState = "prepared" | "scheduled" | "submitting" | "uncertain" | "published" | "failed";

export interface PublishIntent {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly draftId: string;
  readonly idempotencyKey: string;
  readonly state: PublishState;
  readonly scheduledAt?: string;
  readonly authorizationRef: string;
  readonly requiredScopes: readonly string[];
}

export interface PublishReceipt {
  readonly intentId: string;
  readonly accountId: string;
  readonly externalPublicationId: string;
  readonly providerRef: string;
  readonly publishedAt: string;
}

export class PublishLedger {
  readonly #intents = new Map<string, PublishIntent>();
  readonly #byIdempotency = new Map<string, string>();
  readonly #receipts = new Map<string, PublishReceipt>();

  prepare(intent: PublishIntent, draft: SocialDraft, connection: SocialConnection): PublishIntent {
    assertDraftPublishReady(draft);
    if (!intent.authorizationRef.trim()) throw new Error("publishing requires explicit protected-action authorization evidence");
    if (intent.ownerId !== draft.ownerId || intent.brandId !== draft.brandId || intent.accountId !== draft.intendedAccountId || intent.draftId !== draft.id) {
      throw new Error("publish intent must target the exact approved draft/account identity");
    }
    if (connection.accountId !== intent.accountId || !connectionIsLive(connection, intent.requiredScopes)) throw new Error("intended social account is not verified live with required scopes");
    const existing = this.#byIdempotency.get(intent.idempotencyKey);
    if (existing && existing !== intent.id) throw new Error("duplicate publish idempotency key");
    const frozen = Object.freeze({ ...intent, requiredScopes: Object.freeze([...intent.requiredScopes]) });
    this.#intents.set(intent.id, frozen);
    this.#byIdempotency.set(intent.idempotencyKey, intent.id);
    return frozen;
  }

  transition(intentId: string, expected: PublishState, next: PublishState): PublishIntent {
    const current = this.#intents.get(intentId);
    if (!current || current.state !== expected) throw new Error("publish state mismatch");
    const allowed: Readonly<Record<PublishState, readonly PublishState[]>> = {
      prepared: ["scheduled", "submitting", "failed"],
      scheduled: ["submitting", "failed"],
      submitting: ["published", "uncertain", "failed"],
      uncertain: ["published", "failed"],
      published: [],
      failed: []
    };
    if (!allowed[current.state].includes(next)) throw new Error(`invalid publish transition ${current.state} -> ${next}`);
    const updated = Object.freeze({ ...current, state: next });
    this.#intents.set(intentId, updated);
    return updated;
  }

  recordReceipt(receipt: PublishReceipt): void {
    const current = this.#intents.get(receipt.intentId);
    if (!current || current.accountId !== receipt.accountId) throw new Error("receipt does not match exact intended account");
    if (!receipt.externalPublicationId.trim() || !receipt.providerRef.trim()) throw new Error("publication receipt requires provider evidence");
    const prior = this.#receipts.get(receipt.intentId);
    if (prior && prior.externalPublicationId !== receipt.externalPublicationId) throw new Error("conflicting publication receipts require reconciliation");
    this.#receipts.set(receipt.intentId, Object.freeze({ ...receipt }));
    if (current.state === "submitting" || current.state === "uncertain") this.transition(receipt.intentId, current.state, "published");
  }

  receipt(intentId: string): PublishReceipt | undefined {
    return this.#receipts.get(intentId);
  }
}
