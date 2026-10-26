import type { BookFormat } from "./registry.js";

export type PublicationState = "draft" | "uploaded" | "submitted" | "review" | "live" | "blocked";

export interface PublicationRecord {
  readonly id: string;
  readonly bookId: string;
  readonly format: BookFormat;
  readonly providerKey: string;
  readonly state: PublicationState;
  readonly providerReceiptRef: string | null;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
  readonly testOrder: boolean;
}

export function validatePublication(record: PublicationRecord): PublicationRecord {
  if (!record.id.trim() || !record.bookId.trim() || !record.providerKey.trim() || !record.observedAt.includes("T") || record.sourceRefs.length === 0) throw new Error("publication identity/evidence required");
  if ((record.state === "submitted" || record.state === "review" || record.state === "live") && !record.providerReceiptRef?.trim()) throw new Error("provider receipt required for submitted/review/live state");
  return Object.freeze({ ...record, sourceRefs: Object.freeze([...record.sourceRefs]) });
}

export function countsAsSale(record: PublicationRecord): boolean {
  return record.state === "live" && !record.testOrder;
}

export interface EvidenceBackedPublicationEvent {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly format: BookFormat;
  readonly providerKey: string;
  readonly state: PublicationState;
  readonly providerReceiptRef?: string | undefined;
  readonly providerPublicationRef?: string | undefined;
  readonly submittedAt?: string | undefined;
  readonly reviewedAt?: string | undefined;
  readonly liveAt?: string | undefined;
  readonly blockedReason?: string | undefined;
  readonly errorRef?: string | undefined;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
  readonly testOrder: boolean;
}

export interface PublicationStateSnapshot {
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly format: BookFormat;
  readonly providerKey: string;
  readonly state: PublicationState;
  readonly eventId: string;
  readonly providerReceiptRef?: string | undefined;
  readonly providerPublicationRef?: string | undefined;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
}

const ALLOWED_PUBLICATION_TRANSITIONS: Readonly<Record<PublicationState, readonly PublicationState[]>> = Object.freeze({
  draft: ["uploaded", "blocked"] as PublicationState[],
  uploaded: ["submitted", "blocked"] as PublicationState[],
  submitted: ["review", "blocked"] as PublicationState[],
  review: ["live", "blocked"] as PublicationState[],
  live: [] as PublicationState[],
  blocked: ["uploaded", "submitted", "review"] as PublicationState[]
});

function publicationTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function publicationRefs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export function validateEvidenceBackedPublication(event: EvidenceBackedPublicationEvent): EvidenceBackedPublicationEvent {
  if (!event.id.trim() || !event.ownerId.trim() || !event.projectId.trim() || !event.bookId.trim() || !event.providerKey.trim()) throw new Error("publication event identity/owner/project/book/provider are required");
  const observedAt = publicationTimestamp(event.observedAt, "publication observedAt");
  const sourceRefs = publicationRefs(event.sourceRefs, "publication source refs");
  if ((event.state === "submitted" || event.state === "review" || event.state === "live") && !event.providerReceiptRef?.trim()) throw new Error("provider receipt is required for submitted/review/live publication state");
  if (event.state === "live" && !event.providerPublicationRef?.trim()) throw new Error("live publication requires provider publication evidence");
  if (event.state === "blocked" && !event.blockedReason?.trim() && !event.errorRef?.trim()) throw new Error("blocked publication requires reason or error evidence");
  if (event.state !== "blocked" && (event.blockedReason !== undefined || event.errorRef !== undefined)) throw new Error("only blocked publication state may carry blocked/error fields");
  const dates = [event.submittedAt, event.reviewedAt, event.liveAt].filter((value): value is string => value !== undefined);
  for (const value of dates) if (publicationTimestamp(value, "publication lifecycle timestamp") > observedAt) throw new Error("publication lifecycle evidence cannot occur after observation");
  if (event.state === "submitted" && !event.submittedAt) throw new Error("submitted publication requires submittedAt evidence");
  if (event.state === "review" && (!event.submittedAt || !event.reviewedAt)) throw new Error("review publication requires submittedAt and reviewedAt evidence");
  if (event.state === "live" && (!event.submittedAt || !event.reviewedAt || !event.liveAt)) throw new Error("live publication requires submitted/review/live timestamps");
  return Object.freeze({ ...event, sourceRefs });
}

export class BookPublicationLedger {
  readonly #current = new Map<string, EvidenceBackedPublicationEvent>();
  readonly #history: EvidenceBackedPublicationEvent[] = [];

  record(event: EvidenceBackedPublicationEvent): EvidenceBackedPublicationEvent {
    const valid = validateEvidenceBackedPublication(event);
    const key = `${valid.ownerId}:${valid.projectId}:${valid.bookId}:${valid.format}:${valid.providerKey}`;
    const prior = this.#current.get(key);
    if (prior) {
      if (publicationTimestamp(valid.observedAt, "publication observedAt") <= publicationTimestamp(prior.observedAt, "prior publication observedAt")) throw new Error("publication event observation must advance");
      if (!ALLOWED_PUBLICATION_TRANSITIONS[prior.state].includes(valid.state)) throw new Error(`invalid publication transition ${prior.state} -> ${valid.state}`);
      if (prior.providerPublicationRef && valid.providerPublicationRef && prior.providerPublicationRef !== valid.providerPublicationRef) throw new Error("provider publication identity cannot be silently substituted");
    } else if (valid.state !== "draft" && valid.state !== "uploaded") {
      throw new Error("publication history must begin at draft or uploaded state");
    }
    this.#current.set(key, valid);
    this.#history.push(valid);
    return valid;
  }

  current(ownerId: string, projectId: string, bookId: string, format: BookFormat, providerKey: string): PublicationStateSnapshot | undefined {
    const event = this.#current.get(`${ownerId}:${projectId}:${bookId}:${format}:${providerKey}`);
    if (!event) return undefined;
    return Object.freeze({ ownerId, projectId, bookId, format, providerKey, state: event.state, eventId: event.id, providerReceiptRef: event.providerReceiptRef, providerPublicationRef: event.providerPublicationRef, observedAt: event.observedAt, sourceRefs: event.sourceRefs });
  }

  history(ownerId: string, bookId: string): readonly EvidenceBackedPublicationEvent[] {
    return Object.freeze(this.#history.filter((event) => event.ownerId === ownerId && event.bookId === bookId));
  }
}

export function isConfirmedPublished(event: EvidenceBackedPublicationEvent): boolean {
  const valid = validateEvidenceBackedPublication(event);
  return valid.state === "live" && Boolean(valid.providerReceiptRef?.trim()) && Boolean(valid.providerPublicationRef?.trim());
}

export function countsAsConfirmedBookSale(event: EvidenceBackedPublicationEvent, saleEvidenceRef?: string): boolean {
  return isConfirmedPublished(event) && !event.testOrder && Boolean(saleEvidenceRef?.trim());
}
