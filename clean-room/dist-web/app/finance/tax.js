export function createTaxEstimate(taxYear, evidence, estimatedAmountCents) {
    if (!Number.isSafeInteger(taxYear) || taxYear < 1900 || taxYear > 3000)
        throw new Error("Invalid tax year");
    const verified = evidence.filter((item) => item.taxYear === taxYear && item.verified && item.sourceRef.trim());
    if (verified.length === 0)
        throw new Error("Tax estimate requires verified evidence");
    if (estimatedAmountCents !== undefined && !Number.isSafeInteger(estimatedAmountCents))
        throw new Error("Tax estimate amount must be safe integer cents");
    return Object.freeze({ taxYear, state: "estimate", basisRefs: Object.freeze(verified.map((item) => item.sourceRef)), ...(estimatedAmountCents === undefined ? {} : { estimatedAmountCents }), disclaimer: "not_a_filing_or_final_tax_determination" });
}
//# sourceMappingURL=tax.js.map