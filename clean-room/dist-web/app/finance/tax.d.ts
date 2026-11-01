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
export declare function createTaxEstimate(taxYear: number, evidence: readonly TaxEvidenceRecord[], estimatedAmountCents?: number): TaxEstimate;
