export const FINANCIAL_PRIMITIVE_KINDS = Object.freeze([
  "account",
  "balance",
  "asset",
  "debt",
  "category",
  "merchant",
  "transaction",
  "valuation",
  "forecast",
  "account_type",
  "connection_state",
  "confidence"
] as const);

export type FinancialPrimitiveKind = (typeof FINANCIAL_PRIMITIVE_KINDS)[number];
export type FinancialTruthState = "realized" | "projected";
export type FinancialSourceFreshness = "fresh" | "stale" | "disconnected" | "unknown";

export interface FinancialConfidencePrimitive {
  readonly score: number;
  readonly basis: "provider" | "rule" | "model" | "owner" | "verified";
  readonly evidenceRefs: readonly string[];
}

export interface FinancialPrimitiveSource {
  readonly providerKey: string;
  readonly providerIdentity: string;
  readonly providerRecordId: string;
  readonly fetchedAt: string;
  readonly freshness: FinancialSourceFreshness;
  readonly provenanceRefs: readonly string[];
}

export interface FinancialPrimitiveInput {
  readonly id: string;
  readonly ownerId: string;
  readonly kind: FinancialPrimitiveKind;
  readonly canonicalRef: string;
  readonly truthState: FinancialTruthState;
  readonly observedAt: string;
  readonly occurredAt?: string;
  readonly accountRef?: string;
  readonly amountCents?: number;
  readonly currency?: string;
  readonly label?: string;
  readonly assumptionRefs?: readonly string[];
  readonly scenarioRef?: string;
  readonly confidence: FinancialConfidencePrimitive;
  readonly source: FinancialPrimitiveSource;
}

export interface FinancialPrimitiveRecord extends FinancialPrimitiveInput {
  readonly protectedActionAuthorized: false;
}

export interface FinancialProviderRawRecord {
  readonly providerKey: string;
  readonly providerIdentity: string;
  readonly providerRecordId: string;
  readonly ownerId: string;
  readonly fetchedAt: string;
  readonly provenanceRefs: readonly string[];
  readonly providerPayload: Readonly<Record<string, unknown>>;
}

function nonblank(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function timestamp(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return value;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = [...new Set(values.map((value) => value.trim()))];
  return Object.freeze(normalized);
}

export function createFinancialPrimitive(input: FinancialPrimitiveInput): FinancialPrimitiveRecord {
  if (!(FINANCIAL_PRIMITIVE_KINDS as readonly string[]).includes(input.kind)) throw new Error(`Unsupported financial primitive kind: ${String(input.kind)}`);
  nonblank(input.id, "Financial primitive id");
  nonblank(input.ownerId, "Financial primitive ownerId");
  nonblank(input.canonicalRef, "Financial primitive canonicalRef");
  timestamp(input.observedAt, "Financial primitive observedAt");
  if (input.occurredAt !== undefined) timestamp(input.occurredAt, "Financial primitive occurredAt");
  if (input.amountCents !== undefined && !Number.isSafeInteger(input.amountCents)) throw new Error("Financial primitive amount must be safe integer cents");
  if (input.currency !== undefined && !/^[A-Z]{3}$/.test(input.currency)) throw new Error("Financial primitive currency must be three uppercase letters");
  if (input.amountCents !== undefined && input.currency === undefined) throw new Error("Financial primitive monetary amount requires currency");
  if (input.truthState === "projected") {
    if (!input.assumptionRefs || input.assumptionRefs.length === 0) throw new Error("Projected financial primitive requires explicit assumptions");
    refs(input.assumptionRefs, "Financial primitive assumptionRefs");
  } else if (input.assumptionRefs && input.assumptionRefs.length > 0) {
    throw new Error("Realized financial primitive cannot carry forecast assumptions");
  }
  if (!Number.isFinite(input.confidence.score) || input.confidence.score < 0 || input.confidence.score > 1) throw new Error("Financial confidence score must be 0..1");
  refs(input.confidence.evidenceRefs, "Financial confidence evidenceRefs", input.confidence.basis === "verified");
  nonblank(input.source.providerKey, "Financial source providerKey");
  nonblank(input.source.providerIdentity, "Financial source providerIdentity");
  nonblank(input.source.providerRecordId, "Financial source providerRecordId");
  timestamp(input.source.fetchedAt, "Financial source fetchedAt");
  refs(input.source.provenanceRefs, "Financial source provenanceRefs");
  return Object.freeze({
    ...input,
    assumptionRefs: input.assumptionRefs ? Object.freeze([...input.assumptionRefs]) : undefined,
    confidence: Object.freeze({ ...input.confidence, evidenceRefs: Object.freeze([...input.confidence.evidenceRefs]) }),
    source: Object.freeze({ ...input.source, provenanceRefs: Object.freeze([...input.source.provenanceRefs]) }),
    protectedActionAuthorized: false as const
  });
}

export function normalizeFinancialProviderRecord(raw: FinancialProviderRawRecord, canonical: Omit<FinancialPrimitiveInput, "ownerId" | "source"> & { readonly freshness: FinancialSourceFreshness }): FinancialPrimitiveRecord {
  if (!raw.providerKey.startsWith("finance-provider:")) throw new Error("Financial raw provider key is invalid");
  nonblank(raw.providerIdentity, "Financial raw provider identity");
  nonblank(raw.providerRecordId, "Financial raw provider record id");
  nonblank(raw.ownerId, "Financial raw ownerId");
  timestamp(raw.fetchedAt, "Financial raw fetchedAt");
  refs(raw.provenanceRefs, "Financial raw provenanceRefs");
  return createFinancialPrimitive({
    ...canonical,
    ownerId: raw.ownerId,
    source: {
      providerKey: raw.providerKey,
      providerIdentity: raw.providerIdentity,
      providerRecordId: raw.providerRecordId,
      fetchedAt: raw.fetchedAt,
      freshness: canonical.freshness,
      provenanceRefs: raw.provenanceRefs
    }
  });
}

export interface FinancialCurrentHistoryView {
  readonly current: FinancialPrimitiveRecord | undefined;
  readonly history: readonly FinancialPrimitiveRecord[];
}

export function financialCurrentAndHistory(records: readonly FinancialPrimitiveRecord[], ownerId: string, kind: FinancialPrimitiveKind, canonicalRef: string): FinancialCurrentHistoryView {
  const scoped = records
    .filter((record) => record.ownerId === ownerId && record.kind === kind && record.canonicalRef === canonicalRef)
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  return Object.freeze({ current: scoped[0], history: Object.freeze(scoped) });
}
