export type MetricConfidence = "confirmed" | "estimated";
export type SocialMetricName = "followers" | "subscribers" | "impressions" | "reach" | "views" | "watch_time" | "engagement" | "clicks" | "conversions" | "revenue" | "post_performance";
export interface SocialMetric {
    readonly id: string;
    readonly accountId: string;
    readonly contentRef?: string;
    readonly metric: string;
    readonly value: number;
    readonly observedAt: string;
    readonly sourceRef: string;
    readonly confidence: MetricConfidence;
}
export interface AttributionRecord {
    readonly id: string;
    readonly sourceMetricIds: readonly string[];
    readonly outcomeKind: "traffic" | "lead" | "sale" | "revenue";
    readonly amount?: number;
    readonly currency?: string;
    readonly confidence: MetricConfidence;
    readonly sourceRefs: readonly string[];
}
export interface EvidenceBackedSocialMetric {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly contentRef?: string;
    readonly metric: string;
    readonly value?: number;
    readonly truthState?: "known" | "unknown" | "unavailable" | "partial" | "conflicting";
    readonly sourceKind?: "unknown" | "observed" | "provider_reported" | "calculated" | "inferred";
    readonly reportingWindowStart?: string;
    readonly reportingWindowEnd?: string;
    readonly unit: string;
    readonly observedAt: string;
    readonly collectedAt: string;
    readonly sourceRefs: readonly string[];
    readonly confidence: MetricConfidence;
    readonly freshnessMaxAgeMs: number;
}
export interface EvidenceBackedAttribution {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly sourceMetricIds: readonly string[];
    readonly outcomeKind: "traffic" | "lead" | "sale" | "revenue";
    readonly attributionConfidence?: MetricConfidence;
    readonly attributionBasis?: "unknown" | "direct_provider" | "declared_assumption";
    readonly attributionEvidenceRefs?: readonly string[];
    readonly assumptionRefs?: readonly string[];
    readonly outcomeRef: string;
    readonly amount?: number;
    readonly currency?: string;
    readonly confidence: MetricConfidence;
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface VerifiedSocialOutcome {
    readonly ref: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly amount: number;
    readonly currency: string;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
    readonly testData: boolean;
}
export interface MetricAssessment {
    readonly metricId: string;
    readonly fresh: boolean;
    readonly confidence: MetricConfidence;
    readonly ageMs: number;
}
export interface SocialPerformanceSnapshot {
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly generatedAt: string;
    readonly metricIds: readonly string[];
    readonly metricEvidence: readonly Readonly<{
        metricId: string;
        state: string;
        sourceKind: string;
        fresh: boolean;
        confidence: MetricConfidence;
        observedAt: string;
        sourceRefs: readonly string[];
    }>[];
    readonly confirmedRevenueAttributionIds: readonly string[];
    readonly estimatedOutcomeIds: readonly string[];
    readonly estimatedAttributionIds: readonly string[];
}
export interface SocialPostingWindowEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly accountId: string;
    readonly platform: string;
    readonly weekday: number;
    readonly startMinuteLocal: number;
    readonly endMinuteLocal: number;
    readonly timeZone: string;
    readonly basisMetricIds: readonly string[];
    readonly score: number;
    readonly confidence: MetricConfidence;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
}
export declare function validateMetric(metric: SocialMetric): SocialMetric;
export declare function validateAttribution(record: AttributionRecord, metrics: readonly SocialMetric[], verifiedOutcomeRefs?: readonly string[]): AttributionRecord;
export declare function validateEvidenceBackedMetric(metric: EvidenceBackedSocialMetric): EvidenceBackedSocialMetric;
export declare function assessMetricFreshness(metric: EvidenceBackedSocialMetric, now: string): MetricAssessment;
export declare function validateEvidenceBackedAttribution(record: EvidenceBackedAttribution, metrics: readonly EvidenceBackedSocialMetric[], outcomes?: readonly VerifiedSocialOutcome[]): EvidenceBackedAttribution;
export declare function validatePostingWindowEvidence(window: SocialPostingWindowEvidence, metrics: readonly EvidenceBackedSocialMetric[]): SocialPostingWindowEvidence;
export declare function buildSocialPerformanceSnapshot(metrics: readonly EvidenceBackedSocialMetric[], attributions: readonly EvidenceBackedAttribution[], ownerId: string, brandId: string, accountId: string, now: string, outcomes?: readonly VerifiedSocialOutcome[]): SocialPerformanceSnapshot;
