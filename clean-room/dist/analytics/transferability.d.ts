export interface TransferRegime {
    readonly domain?: string;
    readonly companyId?: string;
    readonly taskClass?: string;
    readonly environment?: string;
    readonly provider?: string;
    readonly dataClass?: string;
    readonly resourceClass?: string;
}
export interface NegativeKnowledgeRecord {
    readonly id: string;
    readonly version: number;
    readonly statement: string;
    readonly sourceRegime: TransferRegime;
    readonly contraindication: TransferRegime;
    readonly failureSignature: string;
    readonly recoveryLessons: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly evaluatorEvidenceRefs: readonly string[];
    readonly active: boolean;
    readonly invalidatedByEvidenceRefs: readonly string[];
    readonly recordedAt: string;
    readonly revalidateAfter: string;
}
export interface TransferAssessment {
    readonly id: string;
    readonly version: number;
    readonly sourceRef: string;
    readonly sourceRegime: TransferRegime;
    readonly targetRegime: TransferRegime;
    readonly similarityEvidenceRefs: readonly string[];
    readonly applicabilityEvidenceRefs: readonly string[];
    readonly evaluatorEvidenceRefs: readonly string[];
    readonly negativeKnowledgeRefs: readonly string[];
    readonly alternativeRefs: readonly string[];
    readonly decision: "eligible" | "rejected" | "revoked";
    readonly reasonCodes: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly decidedAt: string;
    readonly expiresAt: string;
}
export declare function validateNegativeKnowledge(record: NegativeKnowledgeRecord): NegativeKnowledgeRecord;
export declare function assessTransfer(input: Omit<TransferAssessment, "decision" | "reasonCodes">, negativeKnowledge: readonly NegativeKnowledgeRecord[], now: string): TransferAssessment;
