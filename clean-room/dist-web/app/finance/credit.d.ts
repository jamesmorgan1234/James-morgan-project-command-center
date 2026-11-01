export interface CreditScoreFact {
    readonly provider: string;
    readonly model: string;
    readonly score: number;
    readonly reportDate: string;
    readonly sourceRef: string;
}
export interface CreditFactor {
    readonly key: string;
    readonly impact: "positive" | "negative" | "neutral" | "unknown";
    readonly evidenceRef: string;
}
export interface CreditRecommendation {
    readonly title: string;
    readonly rationale: string;
    readonly factorRefs: readonly string[];
    readonly scoreForecast: null;
}
export declare function validateCreditScoreFact(fact: CreditScoreFact): void;
export declare function recommendFromFactors(title: string, rationale: string, factors: readonly CreditFactor[]): CreditRecommendation;
export type CreditRefreshState = "fresh" | "stale" | "pending" | "unavailable";
export type CreditAccountState = "open" | "closed" | "unknown";
export interface CreditReportIdentity {
    readonly provider: string;
    readonly model: string;
    readonly reportDate: string;
    readonly reportId: string;
}
export interface CanonicalCreditScoreFact extends CreditReportIdentity {
    readonly ownerId: string;
    readonly score: number;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
    readonly refreshState: CreditRefreshState;
    readonly protectedActionAuthorized: false;
}
export interface CanonicalCreditFactor extends CreditReportIdentity {
    readonly ownerId: string;
    readonly key: string;
    readonly impact: "positive" | "negative" | "neutral" | "unknown";
    readonly observedAt: string;
    readonly evidenceRefs: readonly string[];
    readonly protectedActionAuthorized: false;
}
export interface CreditReportAccount extends CreditReportIdentity {
    readonly ownerId: string;
    readonly accountRef: string;
    readonly creditorName: string;
    readonly accountState: CreditAccountState;
    readonly balanceCents?: number | undefined;
    readonly creditLimitCents?: number | undefined;
    readonly utilizationBasisPoints?: number | undefined;
    readonly observedAt: string;
    readonly evidenceRefs: readonly string[];
    readonly protectedActionAuthorized: false;
}
export interface CreditReportSnapshot extends CreditReportIdentity {
    readonly ownerId: string;
    readonly observedAt: string;
    readonly refreshState: CreditRefreshState;
    readonly scoreFacts: readonly CanonicalCreditScoreFact[];
    readonly factors: readonly CanonicalCreditFactor[];
    readonly accounts: readonly CreditReportAccount[];
    readonly sourceRefs: readonly string[];
    readonly protectedActionAuthorized: false;
}
export interface CreditDataAccessContext {
    readonly ownerId: string;
    readonly subjectOwnerId: string;
    readonly contextDomain: string;
    readonly scopes: readonly string[];
}
export declare function calculateCreditUtilizationBasisPoints(balanceCents: number | undefined, creditLimitCents: number | undefined): number | undefined;
export declare function createCanonicalCreditScoreFact(input: Omit<CanonicalCreditScoreFact, "protectedActionAuthorized">): CanonicalCreditScoreFact;
export declare function createCanonicalCreditFactor(input: Omit<CanonicalCreditFactor, "protectedActionAuthorized">): CanonicalCreditFactor;
export declare function createCreditReportAccount(input: Omit<CreditReportAccount, "protectedActionAuthorized" | "utilizationBasisPoints"> & {
    readonly utilizationBasisPoints?: number | undefined;
}): CreditReportAccount;
export declare function createCreditReportSnapshot(input: Omit<CreditReportSnapshot, "protectedActionAuthorized">): CreditReportSnapshot;
export declare function assertCreditDataIsolation(context: CreditDataAccessContext): void;
export declare function assessCreditRefresh(report: CreditReportSnapshot, now: string, maxAgeMs: number): CreditRefreshState;
