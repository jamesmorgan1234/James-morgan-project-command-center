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
