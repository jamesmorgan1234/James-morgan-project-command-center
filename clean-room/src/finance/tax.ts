export type TaxEvidenceKind = "income" | "expense" | "withholding" | "estimated_payment" | "document";

export interface TaxEvidenceRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly taxYear: number;
  readonly kind: TaxEvidenceKind;
  readonly amountCents?: number;
  readonly sourceRef: string;
  readonly verified: boolean;
}

export interface TaxEstimate {
  readonly taxYear: number;
  readonly state: "estimate";
  readonly basisRefs: readonly string[];
  readonly estimatedAmountCents?: number;
  readonly disclaimer: "not_a_filing_or_final_tax_determination";
}

export function createTaxEstimate(taxYear: number, evidence: readonly TaxEvidenceRecord[], estimatedAmountCents?: number): TaxEstimate {
  if (!Number.isSafeInteger(taxYear) || taxYear < 1900 || taxYear > 3000) throw new Error("Invalid tax year");
  const verified = evidence.filter((item) => item.taxYear === taxYear && item.verified && item.sourceRef.trim());
  if (verified.length === 0) throw new Error("Tax estimate requires verified evidence");
  if (estimatedAmountCents !== undefined && !Number.isSafeInteger(estimatedAmountCents)) throw new Error("Tax estimate amount must be safe integer cents");
  return Object.freeze({ taxYear, state: "estimate" as const, basisRefs: Object.freeze(verified.map((item) => item.sourceRef)), ...(estimatedAmountCents === undefined ? {} : { estimatedAmountCents }), disclaimer: "not_a_filing_or_final_tax_determination" as const });
}
