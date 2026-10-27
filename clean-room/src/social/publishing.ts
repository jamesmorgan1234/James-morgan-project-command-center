import { connectionIsLive, assessSocialConnection, type SocialConnection, type SocialConnectionEvidence } from "./connections.js";
import { assertDraftPublishReady, type SocialDraft } from "./drafts.js";

export type PublishState = "prepared" | "scheduled" | "submitting" | "uncertain" | "published" | "failed" | "cancelled";

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
  readonly #fingerprints = new Map<string,string>();
  readonly #byIdempotency = new Map<string, string>();
  readonly #receipts = new Map<string, PublishReceipt>();

  prepare(intent: PublishIntent, draft: SocialDraft, connection: SocialConnection, now?: string): PublishIntent {
    if(intent.state!=="prepared")throw new Error("New publish intent must start prepared");
    const fingerprint=JSON.stringify(intent);
    if(this.#intents.has(intent.id)){if(this.#fingerprints.get(intent.id)!==fingerprint)throw new Error("Publish intent identity collision");return this.#intents.get(intent.id)!;}
    assertDraftPublishReady(draft);
    if (!intent.authorizationRef.trim()) throw new Error("publishing requires explicit protected-action authorization evidence");
    if (intent.ownerId !== draft.ownerId || intent.brandId !== draft.brandId || intent.accountId !== draft.intendedAccountId || intent.draftId !== draft.id) {
      throw new Error("publish intent must target the exact approved draft/account identity");
    }
    if (connection.accountId !== intent.accountId || !connectionIsLive(connection, intent.requiredScopes, now)) throw new Error("intended social account is not verified live with required scopes");
    const existing = this.#byIdempotency.get(intent.idempotencyKey);
    if (existing && existing !== intent.id) throw new Error("duplicate publish idempotency key");
    const frozen = Object.freeze({ ...intent, requiredScopes: Object.freeze([...intent.requiredScopes]) });
    this.#intents.set(intent.id, frozen); this.#fingerprints.set(intent.id,fingerprint);
    this.#byIdempotency.set(intent.idempotencyKey, intent.id);
    return frozen;
  }

  transition(intentId: string, expected: PublishState, next: PublishState): PublishIntent {
    const current = this.#intents.get(intentId);
    if (!current || current.state !== expected) throw new Error("publish state mismatch");
    const allowed: Readonly<Record<PublishState, readonly PublishState[]>> = {
      prepared: ["scheduled", "submitting", "failed", "cancelled"],
      scheduled: ["submitting", "failed", "cancelled"],
      submitting: ["published", "uncertain", "failed"],
      uncertain: ["published", "failed"],
      published: [],
      cancelled: [],
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

export interface EvidenceBackedPublishIntent {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly draftId: string;
  readonly draftVersion: number;
  readonly draftContentHash: string;
  readonly profileKey: string;
  readonly profileVersion: number;
  readonly idempotencyKey: string;
  readonly state: PublishState;
  readonly scheduledAt?: string | undefined;
  readonly authorizationRef: string;
  readonly authorizationAccountId: string;
  readonly authorizationObservedAt: string;
  readonly authorizationExpiresAt: string;
  readonly requiredScopes: readonly string[];
}

export type PublishAttemptState = "submitted" | "acknowledged" | "failed" | "unknown";

export interface PublishAttemptEvidence {
  readonly attemptId: string;
  readonly intentId: string;
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly state: PublishAttemptState;
  readonly providerRequestRef: string;
  readonly observedAt: string;
  readonly responseRef?: string | undefined;
  readonly externalPublicationId?: string | undefined;
}

export interface EvidenceBackedPublishReceipt {
  readonly intentId: string;
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly externalPublicationId: string;
  readonly providerRef: string;
  readonly publishedAt: string;
  readonly evidenceRefs: readonly string[];
}

function publishTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function publishRefs(values: readonly string[], label: string): readonly string[] {
  if (values.some((value) => !value.trim())) throw new Error(`${label} cannot contain blank values`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

export class EvidenceBackedPublishLedger {
  readonly #intents = new Map<string, EvidenceBackedPublishIntent>();
  readonly #fingerprints = new Map<string,string>();
  readonly #idempotency = new Map<string, string>();
  readonly #attempts = new Map<string, PublishAttemptEvidence>();
  readonly #receipts = new Map<string, EvidenceBackedPublishReceipt>();
  readonly #publicEffects = new Map<string, string>();

  prepare(intent: EvidenceBackedPublishIntent, draft: SocialDraft, connection: SocialConnectionEvidence, now: string, maxVerificationAgeMs: number): EvidenceBackedPublishIntent {
    if(intent.state!=="prepared")throw new Error("New publish intent must start prepared");
    const fingerprint=JSON.stringify(intent);
    if(this.#intents.has(intent.id)){if(this.#fingerprints.get(intent.id)!==fingerprint)throw new Error("Publish intent identity collision");return this.#intents.get(intent.id)!;}
    assertDraftPublishReady(draft);
    const nowMs = publishTimestamp(now, "publish preparation now");
    const authAt = publishTimestamp(intent.authorizationObservedAt, "publish authorization observedAt");
    const authExpires = publishTimestamp(intent.authorizationExpiresAt, "publish authorization expiresAt");
    if (!intent.id.trim() || !intent.authorizationRef.trim() || !intent.idempotencyKey.trim() || !intent.profileKey.trim()) throw new Error("publish intent identity, authorization, idempotency, and platform profile are required");
    if (!Number.isSafeInteger(intent.draftVersion) || intent.draftVersion < 1 || !Number.isSafeInteger(intent.profileVersion) || intent.profileVersion < 1) throw new Error("publish draft/profile versions must be positive");
    if (authAt > nowMs || authExpires <= nowMs || authExpires <= authAt) throw new Error("publish authorization must be current and unexpired");
    if (intent.authorizationAccountId !== intent.accountId) throw new Error("protected-action authorization must name the exact intended account");
    if (intent.ownerId !== draft.ownerId || intent.brandId !== draft.brandId || intent.accountId !== draft.intendedAccountId || intent.draftId !== draft.id || intent.draftVersion !== draft.version || intent.draftContentHash !== draft.contentHash) throw new Error("publish intent must bind the exact approved draft revision/content/account");
    if (connection.ownerId !== intent.ownerId || connection.canonicalAccountId !== intent.accountId) throw new Error("social connection does not match exact owner/account authorization");
    const assessment = assessSocialConnection(connection, intent.requiredScopes, now, maxVerificationAgeMs);
    if (!assessment.live) throw new Error("intended social account is not verified live with required scopes");
    const existing = this.#idempotency.get(intent.idempotencyKey);
    if (existing && existing !== intent.id) throw new Error("publish idempotency key is already bound to another intent");
    const frozen = Object.freeze({ ...intent, requiredScopes: publishRefs(intent.requiredScopes, "publish required scopes") });
    this.#intents.set(intent.id, frozen); this.#fingerprints.set(intent.id,fingerprint);
    this.#idempotency.set(intent.idempotencyKey, intent.id);
    return frozen;
  }

  schedule(intentId: string, scheduledAt: string): EvidenceBackedPublishIntent {
    const current = this.requireIntent(intentId);
    if (current.state !== "prepared") throw new Error("only prepared publish intent can be scheduled");
    publishTimestamp(scheduledAt, "publish schedule");
    return this.replace(current, { ...current, state: "scheduled", scheduledAt });
  }

  startAttempt(attempt: PublishAttemptEvidence): PublishAttemptEvidence {
    const intent = this.requireIntent(attempt.intentId);
    if (intent.state !== "prepared" && intent.state !== "scheduled") throw new Error("publish attempt cannot start until uncertain/published/failed state is reconciled");
    if (attempt.accountId !== intent.accountId || attempt.idempotencyKey !== intent.idempotencyKey) throw new Error("publish attempt must use exact account and intent idempotency key");
    if (!attempt.attemptId.trim() || !attempt.providerRequestRef.trim()) throw new Error("publish attempt requires stable provider request evidence");
    publishTimestamp(attempt.observedAt, "publish attempt observedAt");
    if (this.#attempts.has(attempt.attemptId)) throw new Error("duplicate publish attempt id");
    const attemptedAt=publishTimestamp(attempt.observedAt,"attempt time");
    if(attempt.state!=="submitted" || attemptedAt<publishTimestamp(intent.authorizationObservedAt,"authorization time") || attemptedAt>=publishTimestamp(intent.authorizationExpiresAt,"authorization expiry"))throw new Error("Publish authorization stale or attempt state invalid");
    if(intent.scheduledAt && attemptedAt<publishTimestamp(intent.scheduledAt,"scheduledAt"))throw new Error("Publish schedule not due");
    const frozen = Object.freeze({ ...attempt });
    this.#attempts.set(attempt.attemptId, frozen);
    this.replace(intent, { ...intent, state: "submitting" });
    return frozen;
  }

  markAttemptUnknown(attemptId: string, responseRef: string, observedAt: string): EvidenceBackedPublishIntent {
    const attempt = this.#attempts.get(attemptId);
    if (!attempt) throw new Error("unknown publish attempt");
    if (!responseRef.trim()) throw new Error("unknown publish outcome requires response/loss evidence");
    publishTimestamp(observedAt, "unknown publish outcome observedAt");
    const intent = this.requireIntent(attempt.intentId);
    if (intent.state !== "submitting") throw new Error("only submitting publication can become uncertain");
    this.#attempts.set(attemptId, Object.freeze({ ...attempt, state: "unknown", responseRef, observedAt }));
    return this.replace(intent, { ...intent, state: "uncertain" });
  }

  reconcileReceipt(receipt: EvidenceBackedPublishReceipt): EvidenceBackedPublishReceipt {
    const intent = this.requireIntent(receipt.intentId);
    if (receipt.accountId !== intent.accountId || receipt.idempotencyKey !== intent.idempotencyKey) throw new Error("publication receipt does not match exact account/idempotency binding");
    if (!receipt.externalPublicationId.trim() || !receipt.providerRef.trim()) throw new Error("publication receipt requires external effect and provider evidence");
    publishTimestamp(receipt.publishedAt, "publication receipt publishedAt");
    const evidenceRefs = publishRefs(receipt.evidenceRefs, "publication receipt evidence");
    if (evidenceRefs.length === 0) throw new Error("publication receipt evidence is required");
    const prior = this.#receipts.get(receipt.intentId);
    if (prior) {
      if (prior.externalPublicationId !== receipt.externalPublicationId || prior.accountId !== receipt.accountId) throw new Error("conflicting publication receipts indicate more than one possible public effect");
      return prior;
    }
    const effectKey = JSON.stringify([receipt.accountId,receipt.externalPublicationId]);
    const boundIntent = this.#publicEffects.get(effectKey);
    if (boundIntent && boundIntent !== receipt.intentId) throw new Error("public effect is already attributed to another publish intent");
    if (intent.state !== "submitting" && intent.state !== "uncertain" && intent.state !== "published") throw new Error("publication receipt is inconsistent with current publish state");
    const frozen = Object.freeze({ ...receipt, evidenceRefs });
    this.#receipts.set(receipt.intentId, frozen);
    this.#publicEffects.set(effectKey, receipt.intentId);
    if (intent.state !== "published") this.replace(intent, { ...intent, state: "published" });
    return frozen;
  }

  recordFailure(intentId: string, evidenceRef: string): EvidenceBackedPublishIntent {
    const intent = this.requireIntent(intentId);
    if (this.#receipts.has(intentId)) throw new Error("confirmed public effect cannot be overwritten by failure");
    if (!evidenceRef.trim()) throw new Error("publish failure requires evidence");
    if (intent.state !== "submitting" && intent.state !== "uncertain" && intent.state !== "prepared" && intent.state !== "scheduled") throw new Error("publish failure transition is invalid");
    return this.replace(intent, { ...intent, state: "failed" });
  }

  cancel(id:string):EvidenceBackedPublishIntent {const i=this.requireIntent(id);if(i.state!=="prepared"&&i.state!=="scheduled")throw new Error("Dispatched publication requires reconciliation, not cancellation");return this.replace(i,{...i,state:"cancelled"});}
  reschedule(id:string,scheduledAt:string,now:string):EvidenceBackedPublishIntent {const i=this.requireIntent(id);if(i.state!=="scheduled"||publishTimestamp(scheduledAt,"schedule")<publishTimestamp(now,"now"))throw new Error("Invalid reschedule");return this.replace(i,{...i,scheduledAt});}
  intent(id: string): EvidenceBackedPublishIntent | undefined { return this.#intents.get(id); }
  receipt(id: string): EvidenceBackedPublishReceipt | undefined { return this.#receipts.get(id); }

  private requireIntent(id: string): EvidenceBackedPublishIntent {
    const intent = this.#intents.get(id);
    if (!intent) throw new Error("unknown publish intent");
    return intent;
  }

  private replace(current: EvidenceBackedPublishIntent, next: EvidenceBackedPublishIntent): EvidenceBackedPublishIntent {
    const frozen = Object.freeze({ ...next, requiredScopes: Object.freeze([...next.requiredScopes]) });
    this.#intents.set(current.id, frozen);
    return frozen;
  }
}
